# Loan Risk Evaluation System

An AI-assisted credit-risk platform that evaluates a company's loan risk by combining **internal loan records**, **public SBA loan data**, and **live web research**. Two LLM agents (Supervisor and Auditor) analyse the data, and a rule-based engine makes the final **Approve / Manual Review / Reject** decision. Analysts use the system from a **Chrome side-panel extension**.

---

## Table of Contents

- [Key Features](#key-features)
- [Architecture](#architecture)
- [How a Request Flows](#how-a-request-flows)
- [The Agents](#the-agents)
- [Risk Evaluation Engine](#risk-evaluation-engine)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Security Notes](#security-notes)
- [Roadmap](#roadmap)

---

## Key Features

- **Multi-source data aggregation:** pulls loan records from a **Notion** database and the **SBA loans** PostgreSQL dataset.
- **Live company research:** an n8n **Supervisor (research) agent** uses SerpAPI search, the UpRock web crawler, and Gemini to build a financial and credit profile of the company.
- **LLM analysis with source priority:** Gemini combines the records and the research. Internal records always take priority over external research.
- **Auditor agent:** a second n8n agent checks the Supervisor's output against the raw records to catch made-up or unsupported claims.
- **Deterministic risk engine:** a transparent rule-based engine computes the risk level and the loan decision.
- **Personalised dashboards:** analysts leave notes in plain language (for example "hide total exposure" or "show repayment first"). An LLM turns these notes into dashboard preferences, and the newest instruction wins.
- **Report export:** download the evaluation as **PDF** (rendered with Playwright/Chromium) or **DOCX**.
- **Chrome extension UI:** company autocomplete, a paginated result list, and a risk dashboard in the browser side panel.

---

## Architecture

```
┌──────────────────────────┐
│  Chrome Extension (UI)   │  side panel: search, dashboard, notes, export
└────────────┬─────────────┘
             │ HTTP (localhost:8000)
┌────────────▼─────────────────────────────────────────────────────────┐
│                     FastAPI Backend  (APIs/api_request.py)           │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐   │
│  │ NotionClient │  │  SBASource   │  │ local_database.csv (notes)│   │
│  └──────┬───────┘  └──────┬───────┘  └────────────┬──────────────┘   │
│         └────────┬────────┘                       │                  │
│                  ▼                                ▼                  │
│        ┌───────────────────┐            ┌─────────────────────┐      │
│        │ LLMClients        │◄───────────│ PreferenceExtractor │      │
│        │ (Gemini Supervisor│            │ (Gemini)            │      │
│        │  analysis)        │            └─────────────────────┘      │
│        └─────────┬─────────┘                                         │
│                  ▼                                                   │
│        ┌───────────────────┐        ┌────────────────────────────┐   │
│        │ AuditorClient     │───────►│ n8n: Auditor Agent         │   │
│        └─────────┬─────────┘        │ POST /webhook/records_audit│   │
│                  ▼                  └────────────────────────────┘   │
│        ┌───────────────────┐                                         │
│        │ Risk Engine       │  → risk level + decision + factors      │
│        └───────────────────┘                                         │
│                                                                      │
│  get_company_research() ───────────►┌────────────────────────────────┐
│                                     │ n8n: Supervisor Agent          │
│                                     │ POST /webhook/company-research │
│                                     │ SerpAPI → UpRock → Gemini      │
│                                     └────────────────────────────────┘
└──────────────────────────────────────────────────────────────────────┘
```

---

## How a Request Flows

`GET /company_details/{company_name}` runs the full pipeline:

1. **Fetch records.** Notion records and SBA records (`sba_loans` table, matched by borrower name) are merged into one list.
2. **External research.** The backend calls the n8n Supervisor Agent webhook, which returns a structured company profile.
3. **Load analyst notes.** Notes for the company are read from `local_database.csv`.
4. **Extract preferences.** Gemini turns the notes into `hidden_fields`, `hidden_sections`, and `field_order`.
5. **Supervisor analysis.** Gemini (`gemini-2.5-flash-lite`, temperature 0.2) returns JSON containing `companySummary`, `repaymentPct`, `fraudHistory`, `legalIssues`, `marketReputation`, `creditworthiness`, `riskFactors`, and `loanRecords`.
6. **Audit.** The n8n Auditor Agent checks the analysis against the records and research. If the auditor fails, the original analysis is used.
7. **Risk evaluation.** The rule-based engine produces the final risk level and decision.
8. The response returns the records, research, audited analysis, risk evaluation, notes, and preferences.

---

## The Agents

The n8n workflows are in [`N8N Agents/`](N8N%20Agents/) and can be imported directly into n8n.

### 1. Supervisor Agent (Company Research)

| | |
|---|---|
| **Webhook** | `POST http://localhost:5678/webhook/company-research` |
| **Input** | `{ "company_name": "..." }` |
| **Pipeline** | Webhook → Extract Company Name → **SerpAPI** Google search → Prepare Research Context → **UpRock Crawler** → **Gemini** (structured JSON) → Clean JSON Response → Respond to Webhook |
| **Output** | `company_name`, `company_profile`, `revenue_profitability`, `assets_liabilities`, `debt_and_loans`, `credit_rating`, `bankruptcy_default_history`, `legal_regulatory_issues`, `market_reputation`, `funding_acquisitions`, `recent_news`, `risk_indicators`, `overall_financial_health`, `sources` |

The agent is told to return only JSON and to write `"Unknown"` when information is missing. The cleanup step removes `evidence` wrappers and empty arrays. If the result has `status: "error"`, the workflow stops with an error. The workflow also contains an alternative AI Agent path (Gemini or Groq `qwen3-32b` with a structured output parser) that is not connected by default.

### 2. Auditor Agent (Verification)

| | |
|---|---|
| **Webhook** | `POST http://localhost:5678/webhook/records_audit` |
| **Input** | `{ company_name, records, research_data, llm_analysis }` |
| **Model** | Google Gemini + Structured Output Parser |
| **Role** | Checks the Supervisor output against the source data. It does **not** create new information. |

It uses this order of trust: **internal records → external research → Supervisor output**. It checks `repaymentPct`, `companySummary`, `fraudHistory`, and the other fields, and returns a corrected analysis in the same schema.

### 3. In-process LLM components (`llm/`)

- **`LLMClients`** ([llm/llm_call.py](llm/llm_call.py)): the Supervisor analysis prompt. It keeps internal and external sources separate and follows user preferences.
- **`PreferenceExtractor`** ([llm/preference_extractor.py](llm/preference_extractor.py)): turns free-text analyst notes into dashboard keys, with the newest instruction winning.

---

## Risk Evaluation Engine

The engine is in [risk_evaluation_engine/risk_engine.py](risk_evaluation_engine/risk_engine.py). It uses fixed rules, so every decision can be explained.

| Step | Rule |
|---|---|
| Repayment | Average of the record `Repayment Percentage` values, or the LLM `repaymentPct` if none exist. **> 90% → Low**, **70–90% → Medium**, **< 70% → High**, **unknown → Medium** |
| Fraud | `fraudHistory` mentions fraud or suspicious activity (negations such as "no fraud" are ignored) → **High** |
| Legal issues | A legal issue is reported → risk goes up **one level** |
| Multiple loans | More than one loan, and the risk is already above Low or at least one loan is not paid/closed/settled → risk goes up **one level** |
| Decision | **Low → Approve Loan**, **Medium → Manual Review**, **High → Reject Loan** |

Every escalation is recorded in `factors`, so the dashboard can show why a decision was made.

---

## Project Structure

```
Loan-Risk-Evaluation-System/
├── APIs/
│   └── api_request.py            # FastAPI app, Notion and SBA clients, export endpoints
├── agents/
│   └── auditor.py                # Client for the n8n Auditor Agent
├── llm/
│   ├── llm_call.py               # Gemini Supervisor analysis
│   └── preference_extractor.py   # Notes → dashboard preferences
├── risk_evaluation_engine/
│   └── risk_engine.py            # Rule-based risk scoring and decision
├── N8N Agents/
│   ├── Supervisor Agent.json     # n8n research workflow
│   └── Auditor Agent.json        # n8n audit workflow
├── Chrome_Extension/             # Manifest V3 side-panel UI
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html / popup.js / style.css
├── tests/                        # pytest suite
├── local_database.csv            # Analyst notes / suggestions store
├── requirements.txt
└── .env.example
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| Data | Notion API, PostgreSQL (SQLAlchemy + psycopg2), CSV |
| AI / LLM | Google Gemini (`google-genai`), n8n LangChain agents, Groq (optional) |
| Research | SerpAPI, UpRock Crawler (n8n community node) |
| Export | Playwright (Chromium) for PDF, python-docx for DOCX |
| Frontend | Chrome Extension (Manifest V3, Side Panel API), vanilla JS |
| Testing | pytest |

---

## Getting Started

### Prerequisites

- Python **3.11+**
- [n8n](https://n8n.io/) running locally on port `5678`
- A PostgreSQL database with an `sba_loans` table (columns used: `borrname`, `grossapproval`, `loanstatus`, `approvaldate`, `naicsdescription`, `jobssupported`, `businesstype`, `borrcity`, `borrstate`)
- A Notion integration with access to a loan-records database (properties: `Company Name` (title), `Loan Amount`, `Repayment Percentage`, `Status`, `Risk Flag`, `Date`, `Borrower Name`)
- API keys for Google Gemini and SerpAPI
- Google Chrome

### 1. Clone and install

```bash
git clone https://github.com/lakshyakumarsaini07/Loan-Risk-Evaluation-System.git
cd Loan-Risk-Evaluation-System

python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
playwright install chromium
```

### 2. Configure environment

```bash
cp .env.example .env   # then fill in your keys
```

### 3. Set up the n8n agents

```bash
npx n8n            # or run n8n with Docker
```

1. Open `http://localhost:5678`, then **Import from File** and import both JSON files from `N8N Agents/`.
2. Install the community node `@uprock-ai/n8n-nodes-uprock`.
3. Add credentials for **Google Gemini** (and **Groq** if you use it).
4. In **Supervisor Agent → Company Search**, replace `YOUR_SERPAPI_API_KEY` with your SerpAPI key.
5. **Activate** both workflows.

### 4. Run the API

```bash
uvicorn APIs.api_request:app --reload --port 8000
```

Interactive docs are available at `http://127.0.0.1:8000/docs`.

### 5. Load the Chrome extension

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and select the `Chrome_Extension/` folder.
3. Click the extension icon to open the side panel, then search for a company.

---

## Configuration

| Variable | Required | Description |
|---|---|---|
| `NOTION_API_KEY` | ✅ | Notion integration secret |
| `NOTION_DATABASE_ID` | ✅ | ID of the Notion loan-records database |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |
| `DATABASE_URL` | ✅ | PostgreSQL connection string for the SBA dataset |

The n8n webhook URLs are set in `APIs/api_request.py` (`N8N_RESEARCH_URL`) and `agents/auditor.py`. They default to `http://localhost:5678`.

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/company_details/{company_name}` | Runs the full pipeline and returns records, research, audited LLM analysis, risk evaluation, notes, and preferences |
| `GET` | `/suggest_company_names?query=...` | Company-name suggestions for autocomplete (Notion + SBA) |
| `POST` | `/post_comment` | Saves an analyst note: `{ "company_name": "...", "suggestion": "..." }` |
| `POST` | `/export-pdf?company_name=...` | Renders the given HTML to a PDF: `{ "html": "...", "company_name": "..." }` |
| `POST` | `/export-docx?company_name=...` | Converts the given HTML to a DOCX report |

<details>
<summary>Example <code>/company_details</code> response (shortened)</summary>

```json
{
  "company_name": "Acme Corp",
  "count": 3,
  "records": [ { "Company Name": "Acme Corp", "Loan Amount": 250000, "Source": "SBA" } ],
  "research": { "company_profile": "...", "legal_regulatory_issues": "Unknown" },
  "llm_analysis": {
    "companySummary": "...",
    "repaymentPct": 92,
    "fraudHistory": "No fraud detected",
    "legalIssues": "None",
    "creditworthiness": "Good",
    "riskFactors": []
  },
  "risk_evaluation": {
    "risk_level": "Medium Risk",
    "decision": "Manual Review",
    "factors": ["Multiple Loans • Count: 3"]
  },
  "notes": [],
  "preferences": { "hidden_fields": [], "hidden_sections": [], "field_order": [] }
}
```
</details>

---

## Testing

```bash
pytest -v
```

The test suite covers the risk engine (repayment levels, fraud and legal detection, escalation, decisions), Notion property extraction, record formatting, and the company-details endpoint.

---

## Security Notes

- **Never commit `.env`.** It is listed in `.gitignore`. Use `.env.example` as the template.
- The n8n exports contain a **placeholder** SerpAPI key. Add real keys inside n8n, not in the JSON files.
- CORS currently allows all origins (`*`) for local development. Restrict it before deploying.
- `/export-pdf` renders HTML sent by the client in headless Chromium. Only expose it to trusted clients.

---

## Roadmap

- [ ] Move n8n webhook URLs into environment variables
- [ ] Replace the CSV notes store with PostgreSQL
- [ ] Add authentication to the API
- [ ] Dockerise the API and n8n with `docker-compose`
- [ ] Add CI (pytest and linting) with GitHub Actions

---

## Authors

**Lakshya Kumar Saini** · [@lakshyakumarsaini07](https://github.com/lakshyakumarsaini07)
