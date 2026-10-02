from dotenv import load_dotenv
import requests
import os
import json

# load .env
load_dotenv()

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
NOTION_DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

BASE_URL = "https://api.notion.com/v1"

HEADERS = {
    "Authorization": f"Bearer {NOTION_API_KEY}",
    "Content-Type": "application/json",
    "Notion-Version": "2026-03-11",
}


def get_data_source_id():
    print("\n================ DATABASE API =================")

    url = f"{BASE_URL}/databases/{NOTION_DATABASE_ID}"

    print("GET URL:")
    print(url)

    response = requests.get(url, headers=HEADERS)

    print("\nSTATUS CODE:")
    print(response.status_code)

    if response.status_code != 200:
        print("\nERROR:")
        print(response.text)
        return None

    data = response.json()

    print("\n================ DATABASE RESPONSE =================")
    print(json.dumps(data, indent=2))

    data_sources = data.get("data_sources", [])

    print("\n================ DATA SOURCES =================")
    print(json.dumps(data_sources, indent=2))

    if not data_sources:
        print("No data sources found")
        return None

    data_source_id = data_sources[0]["id"]

    print("\n================ DATA SOURCE ID =================")
    print(data_source_id)

    return data_source_id


def query_data_source(data_source_id, company_name="HCL"):
    print("\n================ QUERY DATA SOURCE =================")

    url = f"{BASE_URL}/data_sources/{data_source_id}/query"

    payload = {
        "page_size": 10,
        "filter": {
            "property": "Company Name",
            "title": {
                "contains": company_name
            }
        }
    }

    print("\nPOST URL:")
    print(url)

    print("\nPAYLOAD:")
    print(json.dumps(payload, indent=2))

    response = requests.post(
        url,
        headers=HEADERS,
        json=payload
    )

    print("\nSTATUS CODE:")
    print(response.status_code)

    if response.status_code != 200:
        print("\nERROR:")
        print(response.text)
        return

    data = response.json()

    print("\n================ QUERY RESPONSE =================")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    data_source_id = get_data_source_id()

    if data_source_id:
        query_data_source(data_source_id)