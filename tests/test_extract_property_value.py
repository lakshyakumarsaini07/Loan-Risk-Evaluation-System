import pytest 
from APIs.api_request import NotionClient
from typing import Dict, Any




@pytest.fixture
def instance():
    return NotionClient()


@pytest.mark.parametrize(
    "property_data, expected",
    [
        (
            {
                "type" : "title",
                'title' : [
                    {"plain_text" : "Hello"},
                    {"plain_text" : " "},
                    {"plain_text" : "World"},
                ],
            }, 
            "Hello World",
        ),
        (
            {
                "type" : "rich_text",
                "rich_text" :[
                    {"plain_text" : "Rich" },
                    {"plain_text" : " " },
                    {"plain_text" : "Text" },
                ],
            },
            "Rich Text",
        ),
        (
            {
                "type" : "number",
                "number" : 42
            },
            42,
        ),
        (
            {
                "type" : "select",
                "select" : {"name" : "High" },
            },
            "High",
        ),
        (
            {
                "type" : "select",
                "select" : {"name" : "None" },
            },
            "None",
        ),
        (
            {
                "type" : "status",
                "status" : {"name" : "Paid" },
            },
            "Paid",
        ),
                (
            {
                "type" : "status",
                "status" : {"name" : "Pending" },
            },
            "Pending",
        ),
        (
            {
                "type": "multi_select",
                "multi_select": [
                    {"name": "Python"},
                    {"name": "Pytest"},
                ],
            },
            ["Python", "Pytest"],
        ),
        (
            {
                "type": "date",
                "date": {"start": "2026-05-14"},
            },
            "2026-05-14",
        ),
        (
            {
                "type": "date",
                "date": None,
            },
            None,
        ),
        (
            {
                "type": "checkbox",
                "checkbox": True,
            },
            True,
        ),
        (
            {
                "type": "url",
                "url": "https://example.com",
            },
            "https://example.com",
        ),
        (
            {
                "type": "email",
                "email": "test@example.com",
            },
            "test@example.com",
        ),
        (
            {
                "type": "phone_number",
                "phone_number": "+911234567890",
            },
            "+911234567890",
        ),
        (
            {
                "type": "unsupported",
            },
            None,
        ),
        (
            {},
            None,
        ),
    ],
)


def test_extract_property_value(instance, property_data, expected):
    result = instance._extract_property_value(property_data)
    assert result == expected



