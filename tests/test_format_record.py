import pytest 
from APIs.api_request import NotionClient

@pytest.fixture
def instance():
    return NotionClient()


def test_format_record_with_custom_data(instance):
    records = {
        "properties" :  {
            "Company Name" : "Appsavio",
            "Loan Amount" : 50000,
            "Repayment Percentage" : 76,
            "Status" : "Paid",
            "Risk Flag" : "Medium",
            "Date" : "12-03-2025",
            "Borrower Name" : "HM Infortech"
        }
    }

    result = instance._format_record(records)

    assert result == {
            "Company Name" : "Appsavio",
            "Loan Amount" : 50000,
            "Repayment Percentage" : 76,
            "Loan Status" : "Paid",
            "Risk Flag" : "Medium",
            "Date" : "12-03-2025",
            "Borrower Name" : "HM Infortech"
    }

