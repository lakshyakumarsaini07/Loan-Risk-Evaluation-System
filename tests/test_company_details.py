from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from fastapi.testclient import TestClient

from APIs.api_request import app

client = TestClient(app)

@patch("APIs.api_request.eval_loan_risk")
@patch("APIs.api_request.PreferenceExtractor")
@patch("APIs.api_request.LLMClients")
@patch("APIs.api_request.NotionClient")

def test_company_details_success(
    mock_notion_client,
    mock_llm_clients,
    mock_preference_extractor,
    mock_eval_loan_risk,):
    
    company_name = "OpenAI"

    mock_records = [
        {"id": 1, "revenue": 100000},
        {"id": 2, "revenue": 200000},
    ]

    mock_notes = [
        "Company has strong repayment history"
    ]

    mock_preferences = {
        "focus": "risk"
    }

    mock_analysis = {
        "summary": "Strong financials",
        "score": 85,
    }

    mock_risk = {
        "risk_level": "LOW",
        "approved": True,
    }

    notion_instance = MagicMock()
    notion_instance.query_by_company_name.return_value = mock_records
    notion_instance.load_company_notes.return_value = mock_notes
    mock_notion_client.return_value = notion_instance

    pref_instance = MagicMock()
    pref_instance.extract.return_value = mock_preferences
    mock_preference_extractor.return_value = pref_instance

    llm_instance = MagicMock()
    llm_instance.call.return_value = mock_analysis
    mock_llm_clients.return_value = llm_instance

    mock_eval_loan_risk.return_value = mock_risk

    response = client.get(f"/company_details/{company_name}")

    assert response.status_code == 200

    data = response.json()

    assert data["company_name"] == company_name
    assert data["count"] == 2
    assert data["records"] == mock_records
    assert data["llm_analysis"] == mock_analysis
    assert data["risk_evaluation"] == mock_risk
    assert data["notes"] == mock_notes
    assert data["preferences"] == mock_preferences

    notion_instance.query_by_company_name.assert_called_once_with(company_name)
    notion_instance.load_company_notes.assert_called_once_with(company_name)

    pref_instance.extract.assert_called_once_with(mock_notes)

    llm_instance.call.assert_called_once_with(
        company_name,
        mock_records,
        mock_notes,
        mock_preferences,
    )

    mock_eval_loan_risk.assert_called_once_with(
        mock_analysis,
        mock_records,
    )


@patch("APIs.api_request.eval_loan_risk")
@patch("APIs.api_request.PreferenceExtractor")
@patch("APIs.api_request.LLMClients")
@patch("APIs.api_request.NotionClient")
def test_company_details_no_records(
    mock_notion_client,
    mock_llm_clients,
    mock_preference_extractor,
    mock_eval_loan_risk,):

    company_name = "UnknownCorp"


    notion_instance = MagicMock()
    notion_instance.query_by_company_name.return_value = []
    notion_instance.load_company_notes.return_value = []
    mock_notion_client.return_value = notion_instance

    pref_instance = MagicMock()
    pref_instance.extract.return_value = {}
    mock_preference_extractor.return_value = pref_instance

    llm_instance = MagicMock()
    mock_llm_clients.return_value = llm_instance

    response = client.get(f"/company_details/{company_name}")

    assert response.status_code == 200

    data = response.json()

    assert data["company_name"] == company_name
    assert data["count"] == 0
    assert data["records"] == []
    assert data["llm_analysis"] == {}
    assert data["risk_evaluation"] == {}
    assert data["notes"] == []
    assert data["preferences"] == {}

    llm_instance.call.assert_not_called()
    mock_eval_loan_risk.assert_not_called()


@patch("APIs.api_request.NotionClient")
def test_company_details_value_error(mock_notion_client):
    notion_instance = MagicMock()

    notion_instance.query_by_company_name.side_effect = ValueError(
    "Database connection failed")

    mock_notion_client.return_value = notion_instance

    response = client.get("/company_details/TestCompany")

    assert response.status_code == 500

    assert response.json() == {
    "detail": "Database connection failed"}


@patch("APIs.api_request.NotionClient")
def test_company_details_http_exception(mock_notion_client):
    notion_instance = MagicMock()


    notion_instance.query_by_company_name.side_effect = HTTPException(
        status_code=404,
        detail="Company not found",
    )

    mock_notion_client.return_value = notion_instance

    response = client.get("/company_details/TestCompany")

    assert response.status_code == 404

    assert response.json() == {
        "detail": "Company not found"
    }


@patch("APIs.api_request.NotionClient")
def test_company_details_unexpected_exception(mock_notion_client):
    notion_instance = MagicMock()

    notion_instance.query_by_company_name.side_effect = Exception(
        "Unexpected DB crash"
    )

    mock_notion_client.return_value = notion_instance

    response = client.get("/company_details/TestCompany")

    assert response.status_code == 500

    assert response.json() == {
        "detail": "Unexpected error: Unexpected DB crash"
    }

