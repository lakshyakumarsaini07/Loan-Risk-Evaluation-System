import json
import os
from typing import Dict, List, Any

from dotenv import load_dotenv
from google import genai
from google.genai import types


load_dotenv()

class PreferenceExtractor:

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")

        if not self.api_key:
            raise ValueError("GEMINI_API_KEY not found")

        self.client = genai.Client(api_key=self.api_key)

    def extract(
        self,
        notes: List[Dict[str, Any]]
    ) -> Dict:
        
        if not notes:
            return {
                "hidden_fields": [],
                "hidden_sections": [],
                "field_order": []
            }

        prompt = f"""

            You are a dashboard personalization assistant.

            Your job is to convert user feedback into structured dashboard preferences.

            User feedback:
            Each feedback item contains:

            Each feedback item contains:

            {{
            "suggestion": "...",
            "created_at": "..."
            }}

            The list is ordered oldest to newest.

            If instructions conflict:

            - The newest instruction wins.
            - Later instructions override earlier instructions.

            Example:

            hide summary
            show summary

            Result:
            summary should be visible.

            Example:

            show summary
            hide summary

            Result:
            summary should be hidden.

            {json.dumps(notes, indent=2, ensure_ascii=False)}

            ----------------------------------------
            AVAILABLE OVERVIEW FIELD KEYS
            ----------------------------------------

            totalLoans
            totalExposure
            repaymentPct
            highRiskLoans

            ----------------------------------------
            AVAILABLE DISTRIBUTION FIELD KEYS
            ----------------------------------------

            paid
            pending
            defaulters
            fraud
            legal

            ----------------------------------------
            AVAILABLE SECTION KEYS
            ----------------------------------------

            overview
            distribution
            factors
            borrowers
            records
            summary

            ----------------------------------------
            FIELD ORDER KEYS
            ----------------------------------------

            totalLoans
            totalExposure
            repaymentPct
            highRiskLoans

            paid
            pending
            defaulters
            fraud
            legal
            ----------------------------------------
            AVAILABLE SUMMARY FIELD KEYS
            ----------------------------------------

            fraudHistory
            legalIssues
            marketReputation
            creditworthiness
            comments
            ----------------------------------------
            OUTPUT SCHEMA
            ----------------------------------------

            {{
                "hidden_fields": [],
                "hidden_sections": [],
                "field_order": []
            }}

            ----------------------------------------
            RULES
            ----------------------------------------

            1. Return ONLY valid JSON.

            2. Never return explanations.

            3. Never return markdown.

            4. Never return labels such as:
            - Total Exposure
            - Repayment Percentage
            - Borrowers
            - Loan Records

            5. Always return INTERNAL KEYS.

            Examples:

            User:
            "Hide total exposure"

            Output:

            {{
                "hidden_fields": [
                    "totalExposure"
                ],
                "hidden_sections": [],
                "field_order": []
            }}

            ----------------------------------------
            User:
            "Hide company summary"

            Output:

            {{
            "hidden_fields": [],
            "hidden_sections": [
                "summary"
            ],
            "field_order": []
            }}

            ----------------------------------------
            User:
            "Don't show summary"

            Output:

            {{
                "hidden_fields": [],
                "hidden_sections": [
                    "summary"
                ],
                "field_order": []
            }}
            ----------------------------------------
            User:
            "Hide legal issues"

            Output:

            {{
                "hidden_fields": [
                    "legalIssues"
                ],
                "hidden_sections": [],
                "field_order": []
            }}
            ----------------------------------------
            User:
            "Hide creditworthiness"

            Output:

            {{
                "hidden_fields": [
                    "creditworthiness"
                ],
                "hidden_sections": [],
                "field_order": []
            }}
            ----------------------------------------
            User:
            "Hide fraud history"

            Output:

            {{
                "hidden_fields": [
                    "fraudHistory"
                ],
                "hidden_sections": [],
                "field_order": []
            }}
            ----------------------------------------

            User:
            "Hide borrowers"

            Output:

            {{
                "hidden_fields": [],
                "hidden_sections": [
                    "borrowers"
                ],
                "field_order": []
            }}

            ----------------------------------------

            User:
            "Hide total exposure and borrowers"

            Output:

            {{
                "hidden_fields": [
                    "totalExposure"
                ],
                "hidden_sections": [
                    "borrowers"
                ],
                "field_order": []
            }}

            ----------------------------------------

            User:
            "Show repayment percentage first"

            Output:

            {{
                "hidden_fields": [],
                "hidden_sections": [],
                "field_order": [
                    "repaymentPct"
                ]
            }}

            ----------------------------------------

            User:
            "Show repayment percentage first and hide total exposure"

            Output:

            {{
                "hidden_fields": [
                    "totalExposure"
                ],
                "hidden_sections": [],
                "field_order": [
                    "repaymentPct"
                ]
            }}

            ----------------------------------------

            Interpret user intent intelligently.

            Words like:
            - hide
            - remove
            - don't show
            - exclude

            should add items to hidden_fields or hidden_sections.

            Words like:
            - first
            - top
            - prioritize
            - show first

            should add items to field_order.

            If feedback is unrelated to dashboard customization,
            ignore it.

            If no valid preferences exist return:

            {{
                "hidden_fields": [],
                "hidden_sections": [],
                "field_order": []
            }}

"""

        try:
            response = self.client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0
                )
            )

            text = response.text.strip()

            if not text:
                return {
                    "hidden_fields": [],
                    "hidden_sections": [],
                    "field_order": []
                }

            parsed = json.loads(text)

            return {
                "hidden_fields": parsed.get("hidden_fields", []),
                "hidden_sections": parsed.get("hidden_sections", []),
                "field_order": parsed.get("field_order", [])
                    }

        except Exception as e:
            print("Preference extraction error:", e)

            return {
                "hidden_fields": [],
                "hidden_sections": [],
                "field_order": []
            }