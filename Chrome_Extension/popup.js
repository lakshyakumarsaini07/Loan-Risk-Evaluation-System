const API_BASE_URLS = ["http://127.0.0.1:8000", "http://localhost:8000"];

const evaluateBtn = document.getElementById("evaluateBtn");
const companyInput = document.getElementById("companyInput");
const resultCard = document.getElementById("resultCard");
const resultsSection = document.getElementById("resultsSection");
const companyList = document.getElementById("companyList");
const companyPagination = document.getElementById("companyPagination");
const paginationWrapper = document.querySelector(".pagination-wrapper");
const clearBtn = document.getElementById("clearBtn");

const PAGE_SIZE = 3;
let companyMatches = [];
let currentPage = 1;
let selectedCompanyName = "";

// Escape user-facing text to prevent HTML injection in rendered strings.
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Map a risk label into a CSS class name for styling badges.
function getRiskClass(value) {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("high")) {
    return "high";
  }

  if (normalized.includes("medium")) {
    return "medium";
  }

  return "low";
}

// Normalize decision text to consistent labels used by the UI.
function formatDecision(decision) {
  const normalized = String(decision || "").toLowerCase();

  if (normalized.includes("approve") || normalized.includes("accept")) {
    return "Approve";
  }

  if (normalized.includes("reject") || normalized.includes("decline")) {
    return "Reject";
  }

  return decision;
}

// Format a numeric value as a USD currency string.
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return "$0";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(amount));
}

/* --------------------------------------Removed Function ---------------------------------------------

function getOverviewStorageKey(companyName) {
  const safeName = String(companyName || "unknown")
    .replaceAll("|", "-")
    .replaceAll("/", "-")
    .replaceAll("\\", "-");
  return `overviewPrefs:${safeName}`;
} 
*/


/* --------------------------------------Removed Function ---------------------------------------------
function loadOverviewState(companyName) {
  const key = getOverviewStorageKey(companyName);
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return { order: [], hidden: [] };
    const parsed = JSON.parse(stored);
    if (!parsed || typeof parsed !== "object") {
      return { order: [], hidden: [] };
    }
    return {
      order: Array.isArray(parsed.order) ? parsed.order : [],
      hidden: Array.isArray(parsed.hidden) ? parsed.hidden : []
    };
  } catch (error) {
    console.warn("Unable to load overview prefs", error);
    return { order: [], hidden: [] };
  }
}
*/
/* --------------------------------------Removed Function ---------------------------------------------
function saveOverviewState(companyName, state) {
  const key = getOverviewStorageKey(companyName);
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save overview prefs", error);
  }
}
*/
/* --------------------------------------Removed Function ---------------------------------------------
function normalizeOverviewOrder(keys, order) {
  const unique = [];
  const seen = new Set();
  for (const key of order) {
    if (keys.includes(key) && !seen.has(key)) {
      unique.push(key);
      seen.add(key);
    }
  }
  for (const key of keys) {
    if (!seen.has(key)) {
      unique.push(key);
    }
  }
  return unique;
}
*/
/* --------------------------------------Removed Function ---------------------------------------------
function buildOverviewGridHtml(registry, state) {
  const keys = Object.keys(registry);
  const order = normalizeOverviewOrder(keys, state?.order || []);
  const hidden = new Set(state?.hidden || []);
  
  return order
  .filter(key => !hidden.has(key) && registry[key])
  .map(key => {
    const item = registry[key];
    return `
    <div class="stat-card">
    <div class="stat-label">${escapeHtml(item.label)}</div>
    <div class="stat-value">${escapeHtml(item.value)}</div>
    </div>
    `;
  })
  .join("");
}
*/

/* --------------------------------------Removed Function ---------------------------------------------
function renderOverviewGrid(companyName, registry, state) {
  const grid = document.getElementById("overviewGrid");
  const hiddenTray = document.getElementById("overviewHiddenTray");
  const resetBtn = document.getElementById("overviewResetBtn");
  if (!grid) return;

  const keys = Object.keys(registry);
  const order = normalizeOverviewOrder(keys, state.order || []);
  const hidden = new Set(state.hidden || []);
  const hasCustomState =
    (state.order && state.order.length > 0) ||
    (state.hidden && state.hidden.length > 0);

  const cardsHtml = order
    .filter(key => !hidden.has(key) && registry[key])
    .map(key => {
      const item = registry[key];
      return `
        <div class="stat-card overview-card" data-key="${escapeHtml(key)}" draggable="true">
          <button class="overview-delete" type="button" aria-label="Remove metric">
            <!--<span class="overview-delete-text">Delete</span>-->
            <svg class="overview-delete-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path d="M 20.5 4 A 1.50015 1.50015 0 0 0 19.066406 6 L 14.640625 6 C 12.803372 6 11.082924 6.9194511 10.064453 8.4492188 L 7.6972656 12 L 7.5 12 A 1.50015 1.50015 0 1 0 7.5 15 L 8.2636719 15 A 1.50015 1.50015 0 0 0 8.6523438 15.007812 L 11.125 38.085938 C 11.423352 40.868277 13.795836 43 16.59375 43 L 31.404297 43 C 34.202211 43 36.574695 40.868277 36.873047 38.085938 L 39.347656 15.007812 A 1.50015 1.50015 0 0 0 39.728516 15 L 40.5 15 A 1.50015 1.50015 0 1 0 40.5 12 L 40.302734 12 L 37.935547 8.4492188 C 36.916254 6.9202798 35.196001 6 33.359375 6 L 28.933594 6 A 1.50015 1.50015 0 0 0 27.5 4 L 20.5 4 z M 14.640625 9 L 33.359375 9 C 34.196749 9 34.974746 9.4162203 35.439453 10.113281 L 36.697266 12 L 11.302734 12 L 12.560547 10.113281 A 1.50015 1.50015 0 0 0 12.5625 10.111328 C 13.025982 9.4151428 13.801878 9 14.640625 9 z M 11.669922 15 L 36.330078 15 L 33.890625 37.765625 C 33.752977 39.049286 32.694383 40 31.404297 40 L 16.59375 40 C 15.303664 40 14.247023 39.049286 14.109375 37.765625 L 11.669922 15 z" />
            </svg>
          </button>
          <div class="stat-label">${escapeHtml(item.label)}</div>
          <div class="stat-value">${escapeHtml(item.value)}</div>
        </div>
      `;
    })
    .join("");

  grid.innerHTML = cardsHtml || "<div class=\"overview-empty\">No metrics selected.</div>";

  if (hiddenTray) {
    const hiddenItems = order
      .filter(key => hidden.has(key) && registry[key])
      .map(key => {
        const item = registry[key];
        return `
          <button class="overview-chip" data-key="${escapeHtml(key)}" type="button">
            ${escapeHtml(item.label)}
          </button>
        `;
      })
      .join("");

    hiddenTray.innerHTML = hiddenItems
      ? `
        <div class="overview-hidden-title">Hidden metrics</div>
        <div class="overview-hidden-list">${hiddenItems}</div>
      `
      : "";
  }

  if (resetBtn) {
    resetBtn.style.display = hasCustomState ? "inline-flex" : "none";
    resetBtn.onclick = () => {
      state.order = [];
      state.hidden = [];
      saveOverviewState(companyName, state);
      renderOverviewGrid(companyName, registry, state);
    };
  }

  if (hiddenTray) {
    hiddenTray.querySelectorAll(".overview-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const key = chip.dataset.key;
        if (!key) return;
        const hiddenSet = new Set(state.hidden || []);
        hiddenSet.delete(key);
        state.hidden = Array.from(hiddenSet);

        const orderList = normalizeOverviewOrder(
          Object.keys(registry),
          state.order || []
        );
        if (!orderList.includes(key)) {
          orderList.push(key);
        }
        state.order = orderList;
        saveOverviewState(companyName, state);
        renderOverviewGrid(companyName, registry, state);
      });
    });
  }

  attachOverviewInteractions(companyName, registry, state);
} */
/*  --------------------------------------Removed Function ---------------------------------------------

function attachOverviewInteractions(companyName, registry, state) {
  const grid = document.getElementById("overviewGrid");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".overview-card"));
  if (!cards.length) return;

  let draggedKey = null;

  const reorderAndPersist = (fromKey, toKey) => {
    if (!fromKey || !toKey || fromKey === toKey) return;
    const keys = normalizeOverviewOrder(Object.keys(registry), state.order || []);
    const fromIndex = keys.indexOf(fromKey);
    const toIndex = keys.indexOf(toKey);
    if (fromIndex === -1 || toIndex === -1) return;
    keys.splice(fromIndex, 1);
    keys.splice(toIndex, 0, fromKey);
    state.order = keys;
    saveOverviewState(companyName, state);
    renderOverviewGrid(companyName, registry, state);
  };

  const hideAndPersist = (key) => {
    if (!key) return;
    const hidden = new Set(state.hidden || []);
    hidden.add(key);
    state.hidden = Array.from(hidden);
    saveOverviewState(companyName, state);
    renderOverviewGrid(companyName, registry, state);
  };

  for (const card of cards) {
    const key = card.dataset.key;

    card.addEventListener("dragstart", (event) => {
      draggedKey = key;
      card.classList.add("dragging");
      event.dataTransfer?.setData("text/plain", key || "");
      event.dataTransfer?.setDragImage(card, 20, 20);
    });

    card.addEventListener("dragend", () => {
      draggedKey = null;
      card.classList.remove("dragging");
    });

    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("drag-over");
      const fromKey = draggedKey || event.dataTransfer?.getData("text/plain");
      reorderAndPersist(fromKey, key);
    });

    const deleteBtn = card.querySelector(".overview-delete");
    deleteBtn?.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideAndPersist(key);
    });
  }
}
*/




// Robust helper to extract a value from an object using a list of potential keys (case-insensitive & spacing-insensitive)
function getLlmValue(obj, keys) {
  if (!obj || typeof obj !== "object") return undefined;
  for (const key of keys) {
    if (obj[key] !== undefined) {
      return obj[key];
    }
  }
  const lowerKeys = keys.map(k => k.toLowerCase().replace(/[\s_-]+/g, ""));
  for (const [k, v] of Object.entries(obj)) {
    const normalizedK = k.toLowerCase().replace(/[\s_-]+/g, "");
    if (lowerKeys.includes(normalizedK)) {
      return v;
    }
  }
  return undefined;
}

// Render the full results view from the API payload.
function renderResults(data) {
  if (!data || !data.risk_evaluation) {
    resultCard.innerHTML = `
      <div class="error">
        No evaluation data available.
      </div>
    `;
    return;
  }
  lastEvaluatedCompanyName =
    data.company_name ||
    data.risk_evaluation?.company_name ||
    "Unknown";

  const evaluation = data.risk_evaluation;
  const details = evaluation.details || {};
  const llmAnalysis = data.llm_analysis || {};
  console.log("FULL API DATA", data);
  console.log("LLM ANALYSIS", data.llm_analysis);
  console.log(
    "SUMMARY",
    data.llm_analysis?.companySummary
  );

  const records = data.records || [];
  const preferences = data.preferences || {};

  const hiddenFields = new Set(
    preferences.hidden_fields || []
  );

  const hiddenSections = new Set(
    preferences.hidden_sections || []
  );

  const fieldOrder =
    preferences.field_order || [];


  console.log("Preferences:", preferences);
  const riskClass = getRiskClass(evaluation.risk_level);

  const decision = formatDecision(evaluation.decision);

  const decisionClass =
    decision.includes("Approve") ? "approve" : "reject";

  const displayRiskLevel = String(
    evaluation.risk_level || "Unknown"
  )
    .replace(/ N\/A$/, "")
    .trim();

  // Analytics
  const totalLoans = records.length;

  let paidLoans = 0;
  let pendingLoans = 0;
  let defaulterLoans = 0;
  let currentLoans = 0;

  records.forEach(record => {

    const status = String(
      record["Loan Status"] || ""
    ).toUpperCase();

    if (
      status === "PAID" ||
      status === "PAID IN FULL" ||
      status === "CLOSED"
    ) {
      paidLoans++;
    }

    else if (
      status === "PENDING"
    ) {
      pendingLoans++;
    }

    else if (
      status === "CURRENT"
    ) {
      currentLoans++;
    }

    else if (
      status.includes("DEFAULT") ||
      status.includes("CHARGEOFF") ||
      status.includes("DEFAULTER")
    ) {
      defaulterLoans++;
    }

  });

  const highRiskLoans = records.filter(
    r => String(r["Risk Flag"]).toLowerCase() === "high"
  ).length;

  const totalExposure = records.reduce((sum, record) => {
    const amount = Number(record["Loan Amount"]);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const borrowers = [
    ...new Set(records.map(r => r["Borrower Name"]))
  ];
  const primaryRecord = records[0] || {};

  const businessType =
    primaryRecord["Business Type"] ||
    llmAnalysis["Business Type"] ||
    "N/A";

  const industry =
    primaryRecord["NAICS Description"] ||
    llmAnalysis["NAICS Description"] ||
    "N/A";

  const jobsSupported =
    primaryRecord["Jobs Supported"] ??
    llmAnalysis["Jobs Supported"] ??
    "N/A";

  const city =
    primaryRecord["Borrower City"] ||
    llmAnalysis["Borrower City"] ||
    "";

  const state =
    primaryRecord["Borrower State"] ||
    llmAnalysis["Borrower State"] ||
    "";

  const source =
    primaryRecord["Source"] ||
    llmAnalysis["Source"] ||
    "Unknown";

  const location =
    city || state
      ? `${city}${city && state ? ", " : ""}${state}`
      : "N/A";

  const factorsHtml = (
      llmAnalysis.riskFactors ||
      evaluation.factors ||
      []
  )
    .map(
      factor => `
        <li class="factor-item">
          ${escapeHtml(factor)}
        </li>
      `
    )
    .join("");

  const loanRows = records
    .map(record => {
      const rowRiskClass = getRiskClass(record["Risk Flag"]);

      return`
        <tr>
          <td>${escapeHtml(record["Date"])}</td>
          <td>${escapeHtml(record["Borrower Name"])}</td>
          <td>
            ${
              record["Repayment Percentage"] !== null &&
              record["Repayment Percentage"] !== undefined
                ? `${escapeHtml(record["Repayment Percentage"])}%`
                : "N/A"
            }
          </td>
          <td>${escapeHtml(record["Loan Status"])}</td>
          <td>
            <span class="risk-badge ${rowRiskClass}">
              ${escapeHtml(record["Risk Flag"])}
            </span>
          </td>
        </tr>
      `;
    })
    .join("");
  resultCard.innerHTML = `
  <!-- ---------------------------------------------------RESULT HEADER----------------------------------------------------------- -->
    <div class="result-header">
      <div class="company-name">
        ${escapeHtml(
            data.company_name ||
            evaluation.company_name ||
            "Unknown"
        )}
      </div>
      <div class="risk-badge ${riskClass}">
        ${escapeHtml(displayRiskLevel)}
      </div>
    </div>
    <div class="decision ${decisionClass}">
      ${escapeHtml(decision)}
    </div>

    <!-- ---------------------------------------------------OVERVIEW------------------------------------------------------------- -->
    <div class="section">
      <div class="section-title">Portfolio Overview</div>
      <div class="stats-grid" id="overviewGrid">

      </div>
    </div>

    <!-- --------------------------------------------------LOAN STATUS--------------------------------------------------------------- -->
    ${
    hiddenSections.has("distribution")
    ? ""
    : `
    <div class="section">
      <div class="section-title">
          Loan Distribution
      </div>

      <div class="metrics">
          <div class="metric-row">

            <span class="metric-label">
                Current Loans
            </span>

            <span class="metric-value">
                ${currentLoans}
            </span>
          </div>

          ${
          !hiddenFields.has("paid")
          ? `
          <div class="metric-row">
            <span class="metric-label">Paid Loans</span>
            <span class="metric-value">${paidLoans}</span>
          </div>
          `
          : ""
          }

          ${
          !hiddenFields.has("pending")
          ? `
          <div class="metric-row">
            <span class="metric-label">Pending Loans</span>
            <span class="metric-value">${pendingLoans}</span>
          </div>
          `
          : ""
          }

          ${
          !hiddenFields.has("defaulters")
          ? `
          <div class="metric-row">
            <span class="metric-label">Defaulters</span>
            <span class="metric-value">${defaulterLoans}</span>
          </div>
          `
          : ""
          }

          ${
          !hiddenFields.has("fraud")
          ? `
          <div class="metric-row">
            <span class="metric-label">Fraud Detected</span>
            <span class="metric-value">
                ${details.fraud_detected ? "Yes" : "No"}
            </span>
          </div>
          `
          : ""
          }

          ${
          !hiddenFields.has("legal")
          ? `
          <div class="metric-row">
            <span class="metric-label">Legal Issues</span>
            <span class="metric-value">
                ${details.legal_issues ? "Yes" : "No"}
            </span>
          </div>
          `
          : ""
          }

      </div>
    </div>
    `
    }

    <!-- ---------------------------------------------------RISK FACTORS--------------------------------------------------------------- -->
    ${
    hiddenSections.has("factors")
    ? ""
    : `
    <div class="section">
      <div class="section-title">
          Risk Factors
      </div>

      <ul class="factor-list">
          ${factorsHtml || "<li>No risk factors found.</li>"}
      </ul>
    </div>
    `
    }

    <!-- ---------------------------------------------------COMPANY SUMMARY------------------------------------------------------------- -->
    ${
    hiddenSections.has("summary")
    ? ""
    : `
    <div class="section">

      <div class="section-title">
          Company Summary
      </div>

      <div
          class="ai-comments"
          id="llmComments">

          ${
            escapeHtml(
              llmAnalysis.companySummary ||
              details.companySummary ||
              "No summary available."
            )
          }

      </div>

    </div>
    `
    }
    <!-- ---------------------------------------------------BORROWERS--------------------------------------------------------------- -->
    ${
    hiddenSections.has("borrowers")
    ? ""
    : `
    <div class="section">
      <div class="section-title">
          Borrowers
      </div>

      <div class="borrowers-list">
          ${
          borrowers
            .map(
              borrower =>
                `<div class="borrower-chip">${escapeHtml(borrower)}</div>`
            )
            .join("")
          }
      </div>
    </div>
    `
    }
    <!-- ---------------------------------------------------LOAN RECORDS--------------------------------------------------------------- -->
    ${
    hiddenSections.has("records")
    ? ""
    : `
    <div class="section">
      <div class="section-title">
          Loan Records
      </div>

      <div class="table-wrapper">
          <table class="loan-table">
              <thead>
                  <tr>
                      <th>Date</th>
                      <th>Borrower</th>
                      <th>Repayment</th>
                      <th>Status</th>
                      <th>Risk</th>
                  </tr>
              </thead>

              <tbody>
                  ${loanRows}
              </tbody>
          </table>
      </div>
    </div>
    `
    }
  `;

  // Make the download container visibl`e after rendering results
  const downloadContainer = document.querySelector('.download-container');
  if (downloadContainer) {
    downloadContainer.classList.remove('hidden');
  }

  let overviewRegistry = {

    totalLoans: {
      label: "Total Loans",
      value: totalLoans
    },

    totalExposure: {
      label: "Total Exposure",
      value: formatCurrency(totalExposure)
    },

    repaymentPct: {
      label: "Repayment %",
      value:
        llmAnalysis.repaymentPct != null
          ? `${llmAnalysis.repaymentPct}%`
          : "N/A"
    },

    highRiskLoans: {
      label: "High Risk Loans",
      value: highRiskLoans
    },

    jobsSupported: {
      label: "Jobs Supported",
      value: jobsSupported
    },

    businessType: {
      label: "Business Type",
      value: businessType
    },

    industry: {
      label: "Industry",
      value: industry
    },

    source: {
      label: "Source",
      value: source
    }

  };

  Object.keys(overviewRegistry).forEach(key => {

    if (hiddenFields.has(key)) {
      delete overviewRegistry[key];
    }

  });

//----------------
  if (fieldOrder.length) {

    const orderedRegistry = {};

    fieldOrder.forEach(key => {

      if (overviewRegistry[key]) {
        orderedRegistry[key] =
          overviewRegistry[key];
      }

    });

    Object.keys(overviewRegistry)
      .forEach(key => {

        if (!orderedRegistry[key]) {
          orderedRegistry[key] =
            overviewRegistry[key];
        }

      });

    overviewRegistry = orderedRegistry;
  }
//----------------

  const overviewGrid =
    document.getElementById("overviewGrid");

  if (overviewGrid) {
    overviewGrid.innerHTML =
      Object.values(overviewRegistry)
        .map(
          item => `
          <div class="stat-card">
            <div class="stat-label">
              ${escapeHtml(item.label)}
            </div>

            <div class="stat-value">
              ${escapeHtml(item.value)}
            </div>
          </div>
        `
        )
        .join("");
  }

  generateAndRenderComments(
    evaluation.company_name,
    evaluation,
    details,
    llmAnalysis
  );



}


// Populate the AI comments section with generated or fallback text.
/*
async function generateAndRenderComments(
  companyName,
  evaluation,
  details,
  llmAnalysis
) {
  const llmEl = document.getElementById("llmComments");

  if (!llmEl) {
    return;
  }

  try {
    const comments = await fetchLLMComments(
      companyName,
      evaluation,
      llmAnalysis
    );

    if (comments && comments.toString().trim()) {
      llmEl.textContent = comments.toString();
    } else if (details.Comments) {
      llmEl.textContent = details.Comments;
    } else if (getLlmValue(llmAnalysis, ["Comments", "comments"])) {
      llmEl.textContent = getLlmValue(llmAnalysis, ["Comments", "comments"]);
    } else {
      llmEl.textContent = "No comments available.";
    }
  } catch (error) {
    console.error(error);

    if (details.Comments) {
      llmEl.textContent = details.Comments;
    } else if (getLlmValue(llmAnalysis, ["Comments", "comments"])) {
      llmEl.textContent = getLlmValue(llmAnalysis, ["Comments", "comments"]);
    } else {
      llmEl.textContent = "Unable to generate comments.";
    }
  }
}*/
async function generateAndRenderComments(
  companyName,
  evaluation,
  details,
  llmAnalysis
) {
  const llmEl = document.getElementById("llmComments");

  if (!llmEl) {
    return;
  }

  const summary =
      llmAnalysis?.companySummary ||
      details?.companySummary ||
      evaluation?.companySummary;

  llmEl.textContent =
      summary || "No summary available.";
}

/* Removed 
// Helper: fetch or derive LLM comments. Keeps generateAndRenderComments safe.
async function fetchLLMComments(companyName, evaluation, llmAnalysis) {
  if (!evaluation) return "";

  // Prefer explicit fields if present
  if (evaluation.comments) return String(evaluation.comments);
  if (evaluation.summary) return String(evaluation.summary);
  const cVal = getLlmValue(llmAnalysis, ["Comments", "comments"]);
  if (cVal) return String(cVal);
  const sVal = getLlmValue(llmAnalysis, ["Summary", "summary"]);
  if (sVal) return String(sVal);

  // No LLM available locally — return empty string (caller will fallback)
  return "";
} */

// Show loading state while the company evaluation is in progress.
function showLoading() {
  resultCard.innerHTML = `
    <div class="loading">
      <!-- <div class="spinner"></div> -->
      <img
          src="Livechatbot.svg"
          class="chatbot-loader"
          alt="Loading"
      />
      <div class="loading-text">
        Evaluating company...
      </div>
    </div>
  `;

  resultsSection.classList.add("active");
}

// Render an error message in the results area.
function showError(message) {
  resultCard.innerHTML = `
    <div class="error">
      ${escapeHtml(message)}
    </div>
  `;

  resultsSection.classList.add("active");
}

// Fetch the full company evaluation from the local API.
async function fetchCompanyDetails(companyName) { 
  let finalError = null;

  for (const baseUrl of API_BASE_URLS) {
    try {
      const response = await fetch(
        `${baseUrl}/company_details/${encodeURIComponent(companyName)}`
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload?.detail ||
          `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      return payload || {};
    } catch (error) {
      finalError = error;
    }
  }

  throw finalError || new Error("Unable to connect to local API.");
}

function showCompanySearchLoading() {

  companyList.innerHTML = `
    <div class="loading-svg">

      <img
        src="Livechatbot.svg"
        class="chatbot-loader"
        alt="Loading"
      >

      <div class="loading-text">
        Searching companies...
      </div>

    </div>
  `;

  paginationWrapper?.classList.add("hidden");
}

// Fetch related company names based on the query text.
async function fetchCompanyMatches(query) {

  showCompanySearchLoading();

  let finalError = null;

  for (const baseUrl of API_BASE_URLS) {

    try {

      const response = await fetch(
        `${baseUrl}/suggest_company_names?query=${encodeURIComponent(query)}`
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {

        const message =
          payload?.detail ||
          `Request failed with status ${response.status}`;

        throw new Error(message);
      }

      return payload?.suggestions || [];

    } catch (error) {

      finalError = error;

    }

  }

  throw finalError || new Error(
    "Unable to connect to local API."
  );
}

function renderCompanyPage() {
  if (!companyList) return;

  if (!companyMatches.length) {
    companyList.innerHTML = "<div class=\"empty\">No matching companies found.</div>";
    return;
  }

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = companyMatches.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  companyList.innerHTML = pageItems
    .map(name => {
      const isSelected = name === selectedCompanyName;
      return `
        <div class="company-item${isSelected ? " selected" : ""}">${escapeHtml(name)}</div>
      `;
    })
    .join("");
}


function updatePaginationLinks() {
  if (!companyPagination) return;

  const totalPages = Math.max(
    1,
    Math.ceil(companyMatches.length / PAGE_SIZE)
  );

  if (totalPages <= 1) {
    companyPagination.innerHTML = "";
    return;
  }

  let html = "";

  // First button
  html += `
    <li class="page-item">
      <a
        class="page-link ${currentPage === 1 ? "disabled" : ""}"
        href="#"
        data-page="first"
      >
        First
      </a>
    </li>
  `;

  // Prev button
  html += `
    <li class="page-item">
      <a
        class="page-link ${currentPage === 1 ? "disabled" : ""}"
        href="#"
        data-page="prev"
      >
        Prev
      </a>
    </li>
  `;

  // Show only 3 page numbers
  let startPage = Math.max(
    1,
    currentPage - 1
  );

  let endPage = Math.min(
    totalPages,
    startPage + 2
  );

  if (endPage - startPage < 2) {
    startPage = Math.max(
      1,
      endPage - 2
    );
  }

  for (
    let i = startPage;
    i <= endPage;
    i++
  ) {
    html += `
      <li class="page-item">
        <a
          class="page-link ${
            i === currentPage
              ? "active"
              : ""
          }"
          href="#"
          data-page="${i}"
        >
          ${i}
        </a>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item">
      <a
        class="page-link ${
          currentPage === totalPages
            ? "disabled"
            : ""
        }"
        href="#"
        data-page="next"
      >
        Next
      </a>
    </li>
  `;

  // Last button
  html += `
    <li class="page-item">
      <a
        class="page-link ${
          currentPage === totalPages
            ? "disabled"
            : ""
        }"
        href="#"
        data-page="last"
      >
        Last
      </a>
    </li>
  `;

  companyPagination.innerHTML = html;
}

function setCompanyMatches(matches) {
  companyMatches = matches;
  currentPage = 1;
  renderCompanyPage();
  updatePaginationLinks();

  if (paginationWrapper) {
    paginationWrapper.classList.toggle(
      "hidden",
      companyMatches.length === 0
    );
  }
}

async function loadCompanyMatches(query) {

    if (!query) {
        setCompanyMatches([]);
        return;
    }

    showCompanySearchLoading();

    try {

        const matches = await fetchCompanyMatches(query);

        setCompanyMatches(matches);

    } catch (error) {

        console.error(error);

        companyList.innerHTML = `
            <div class="error-message">
                Failed to load companies
            </div>
        `;
    }
}

// Orchestrate a company evaluation request and render the results.
async function evaluateCompany(companyName) {
  const company = companyName || companyInput.value.trim();

  if (!company) {
    return;
  }

  evaluateBtn.disabled = true;

  showLoading();

  try {
    const payload = await fetchCompanyDetails(company);

    renderResults(payload);
  } catch (error) {
    showError(
      error.message || "Failed to load evaluation results."
    );
  } finally {
    evaluateBtn.disabled = false;
  }
}

// List related company names without running an evaluation.
async function listCompanies() {
  const company = companyInput.value.trim();

  if (!company) {
    return;
  }

  evaluateBtn.disabled = true;
  selectedCompanyName = "";

  try {
    await loadCompanyMatches(company);
  } catch (error) {
    console.error(error);
  } finally {
    evaluateBtn.disabled = false;
  }
}

// List companies when the user clicks the button.
evaluateBtn.addEventListener("click", listCompanies);

// Evaluate on Enter keypress within the company input.
companyInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    listCompanies();
  }
});

// Auto-fill and evaluate when a company is selected.
companyList?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const item = target.closest(".company-item");
  if (!item) return;

  const companyName = item.textContent?.trim();
  if (!companyName) return;

  companyInput.value = companyName;
  selectedCompanyName = companyName;
  renderCompanyPage();

  // show loader first
  showLoading();

  // smooth scroll to result section
  setTimeout(() => {
    resultsSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }, 100);

  // fetch data
  evaluateCompany(companyName);
});

function clearCompanyResults() {
  companyMatches = [];
  currentPage = 1;
  selectedCompanyName = "";

  if (companyList) {
    companyList.innerHTML = "";
  }

  if (paginationWrapper) {
    paginationWrapper.classList.add("hidden");
  }

  resultsSection.classList.remove("active");
  resultCard.innerHTML = "";
}

clearBtn?.addEventListener("click", clearCompanyResults);

// Handle pagination clicks for company matches.
companyPagination.addEventListener(
  "click",
  (event) => {

    event.preventDefault();

    const link =
      event.target.closest(
        ".page-link"
      );

    if (!link) return;

    if (
      link.classList.contains(
        "disabled"
      )
    ) {
      return;
    }

    const page =
      link.dataset.page;

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          companyMatches.length /
          PAGE_SIZE
        )
      );

    if (page === "first") {

      currentPage = 1;

    } else if (
      page === "prev"
    ) {

      currentPage = Math.max(
        1,
        currentPage - 1
      );

    } else if (
      page === "next"
    ) {

      currentPage = Math.min(
        totalPages,
        currentPage + 1
      );

    } else if (
      page === "last"
    ) {

      currentPage =
        totalPages;

    } else {

      const pageNumber =
        Number(page);

      if (
        !Number.isNaN(
          pageNumber
        )
      ) {
        currentPage =
          pageNumber;
      }
    }

    renderCompanyPage();
    updatePaginationLinks();
  }
);


const downloadBtn = document.getElementById("downloadBtn");
const downloadFormat = document.getElementById("downloadFormat");

// Handle export selection and dispatch to the right downloader.
downloadBtn?.addEventListener("click", async () => {
  const format = (downloadFormat?.value || "pdf").toLowerCase();

  if (format === "docx") {
    await downloadDocx();
    return;
  }

  await downloadPdf();
});


// Send the rendered results HTML to the PDF export endpoint.
async function downloadPdf() {
  try {
  const results = document.getElementById("resultsSection");
  if (!results || !results.classList.contains("active")) {
    alert("Load company details first");
    return;
  }

  const clone = results.cloneNode(true);
  const downloadContainer = clone.querySelector(".download-container");
  if (downloadContainer) downloadContainer.remove();


const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 14mm;
    }

    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111827;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
    }

    .container {
      max-width: 100%;
      padding: 0;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 2px solid #e5e7eb;
    }

    .company-name {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
    }

    .section {
      margin-bottom: 14px;
      padding: 14px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #111827;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .stat-card,
    .metric-row {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10px;
      background: #f9fafb;
    }

    .stat-label,
    .metric-label {
      font-size: 11px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .stat-value,
    .metric-value {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
    }

    .metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .factor-list {
      margin: 0;
      padding-left: 18px;
    }

    .borrowers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .borrower-chip {
      padding: 6px 10px;
      border-radius: 999px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      font-size: 11px;
    }

    .table-wrapper {
      overflow: visible;
    }

    .loan-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }

    .loan-table th,
    .loan-table td {
      border: 1px solid #d1d5db;
      padding: 8px;
      text-align: left;
      vertical-align: top;
    }

    .loan-table th {
      background: #f3f4f6;
      font-weight: 700;
    }

    .risk-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      background: #eef2ff;
      color: #1e3a8a;
    }

    .risk-badge.high {
      background: #fee2e2;
      color: #991b1b;
    }

    .risk-badge.medium {
      background: #fef3c7;
      color: #92400e;
    }

    .risk-badge.low {
      background: #dcfce7;
      color: #166534;
    }

    .decision {
      margin-bottom: 14px;
      font-size: 16px;
      font-weight: 700;
    }

    .decision.approve {
      color: #166534;
    }

    .decision.reject {
      color: #991b1b;
    }

    .ai-comments {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="container">
    ${clone.outerHTML}
  </div>
</body>
</html>`;

  const response = await fetch("http://localhost:8000/export-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      html,
      company_name: lastEvaluatedCompanyName || "loan_report"
    })
  });

  if (!response.ok) {
    const text = await response.text().catch(() => null);
    throw new Error(`PDF failed: ${response.status} ${text || ""}`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "loan_report.pdf";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
  } catch (err) {
  console.error("PDF Download Error:", err);
  alert("Unable to download PDF: " + (err.message || err));
  }
}


// Send the rendered results HTML to the DOCX export endpoint.
async function downloadDocx() {
  try {
    const results = document.getElementById("resultsSection");
    if (!results || !results.classList.contains("active")) {
      alert("Load company details first");
      return;
    }

    const clone = results.cloneNode(true);
    const downloadContainer = clone.querySelector(".download-container");
    if (downloadContainer) downloadContainer.remove();



    const html = `<!DOCTYPE html><html><body>${clone.outerHTML}</body></html>`;

    const response = await fetch("http://localhost:8000/export-docx", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        company_name: lastEvaluatedCompanyName || "loan_report"
      })
    });

    if (!response.ok) {
      const text = await response.text().catch(() => null);
      throw new Error(`DOCX failed: ${response.status} ${text || ""}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "loan_report.docx";
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("DOCX Download Error:", err);
    alert("Unable to download DOCX: " + (err.message || err));
  }
}

let lastEvaluatedCompanyName = "";


// Submit user feedback for the last evaluated company.
document.getElementById("submitBtn").addEventListener("click", async () => {
  const suggestionEl = document.getElementById("suggestion");
  const statusEl = document.getElementById("status");
  const suggestion = suggestionEl.value.trim();
  if (!suggestion) return;

  const company_name = lastEvaluatedCompanyName || document.getElementById("companyInput").value.trim() || "Unknown";

  // Show a temporary status message next to the suggestion form.
  function showStatus(text, variant = "success", autoHide = true) {
    statusEl.textContent = text;
    statusEl.classList.remove("success", "error", "visible");
    statusEl.classList.add(variant, "visible");
    if (autoHide) {
      clearTimeout(statusEl._hideTimer);
      statusEl._hideTimer = setTimeout(() => {
        statusEl.classList.remove("visible");
      }, 3000);
    }
  }

  try {
    const response = await fetch("http://localhost:8000/post_comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name, suggestion })
    });

    const data = await response.json().catch(() => null);

    if (response.ok) {
      showStatus(data?.message || "Suggestion submitted successfully.", "success", true);
      suggestionEl.value = "";
    } else {
      showStatus(data?.detail || "Submission failed", "error", true);
    }
  } catch {
    showStatus("Failed to submit suggestion", "error", true);
  }
});