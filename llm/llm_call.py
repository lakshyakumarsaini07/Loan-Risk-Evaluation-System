import json
import os
from typing import Any, Dict, List, Optional
from pathlib import Path
from xmlrpc import client
from dotenv import load_dotenv

# Used gemini for llm calling
from google import genai
from google.genai import types

#load the .env 
load_dotenv()

class LLMClients:

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found")

        self.client = genai.Client(api_key=self.api_key)

    def call(
        self,
        company_name: str,
        records: List[Dict[str, Any]],
        notes: Optional[List[str]] = None,
        preferences: Optional[Dict[str, Any]] = None,
        research_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        notes_block = json.dumps(notes or [], indent= 2 , ensure_ascii=False)
        preferences_block = json.dumps(preferences or {}, indent=2,ensure_ascii=False)
        research_block = json.dumps(research_data or {},indent=2,ensure_ascii=False)
        output_schema = {
            "companySummary": "string",
            "repaymentPct": "number",
            "fraudHistory": "string",
            "legalIssues": "string",
            "marketReputation": "string",
            "creditworthiness": "string",
            "riskFactors": ["string"],
            "loanRecords": ["object"]
        }

        schema_block = json.dumps(
            output_schema,
            indent=2,
            ensure_ascii=False
        )

        system_prompt = """
        You are a supervisor agent.

        Use:

        INTERNAL RECORDS
        for:
        - loan metrics
        - repayment
        - exposure

        EXTERNAL RESEARCH
        for:
        - legal issues
        - fraud mentions
        - market reputation
        - recent news

        USER PREFERENCES
        for:
        - field ordering
        - hidden sections

        Never mix sources incorrectly.

        When sources disagree:

        Internal records have higher priority than external research.

        Research is supplementary only.

        Your responsibilities:

        - Analyze internal records.
        - Use external research when available.
        - Generate company summary.
        - Identify risk factors.
        - Never hallucinate.
        - Use "Unknown" if information is missing.

        Company summaries should mention:

        - Company name
        - Industry
        - Business type
        - Location
        - Source of information
        - Loan observations
        - External legal mentions
        - Fraud mentions
        - Bankruptcy mentions
        - Recent news
        - Regulatory mentions

        Return ONLY JSON.

        Do not create fields outside the schema.
        """

        user_prompt = f"""
        Company Name:

        {company_name}

        Records:

        {json.dumps(records, indent=2, ensure_ascii=False)}

        User Notes:

        {notes_block}

        Extracted Preferences:

        {preferences_block}

        External Research Data:

        {research_block}

        Available Fields:

        - Company Name
        - Borrower Name
        - Loan Amount
        - Repayment Percentage
        - Loan Status
        - Risk Flag
        - Fraud History
        - Legal Issues
        - Market Reputation
        - Creditworthiness
        - Comments
        - Source
        - NAICS Description
        - Jobs Supported
        - Business Type
        - Borrower City
        - Borrower State

        Rules:

        - Use only record data.
        - If data unavailable use "Unknown".
        - Respect hidden_fields.
        - Do not generate fields listed in hidden_fields.
        - Respect field_order if provided.
        - Return valid JSON only.
        - Do not create additional fields.
        - Mention the source when relevant.
        - Combine information from multiple sources.
        - If records come from SBA, use NAICS Description,Business Type, Jobs Supported and Location to enrich the summary.

        Return ONLY this schema:
        {schema_block}
        """

        try:
            response = self.client.models.generate_content( 
                model="gemini-2.5-flash-lite",
                contents=f"""
                System Instruction:
                {system_prompt}

                User Input:
                {user_prompt}
                """,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

            raw_text = response.text.strip()

            if not raw_text:
                return {}

            parsed_response = json.loads(raw_text)

            if not isinstance(parsed_response, dict):
                raise ValueError("LLM response is not a JSON object")

            return parsed_response

        except json.JSONDecodeError as e:
            raise ValueError(
                f"Failed to parse Gemini JSON response: {str(e)}"
            )

        except Exception as e:
            raise RuntimeError(
                f"Gemini API call failed: {str(e)}"
            )

