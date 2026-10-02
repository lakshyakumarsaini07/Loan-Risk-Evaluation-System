import requests


class AuditorClient:

    def __init__(self):
        self.url = "http://localhost:5678/webhook/records_audit"

    def audit(
        self,
        company_name,
        records,
        research_data,
        llm_analysis
    ):

        payload = {
            "company_name": company_name,
            "records": records,
            "research_data": research_data,
            "llm_analysis": llm_analysis
        }

        try:

            response = requests.post(
                self.url,
                json=payload,
                timeout=120
            )

            response.raise_for_status()

            data = response.json()

            if isinstance(data, list):
                data = data[0]["json"]

            return data

        except Exception as e:

            print("Auditor failed:", e)

            return llm_analysis