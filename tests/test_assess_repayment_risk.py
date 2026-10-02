import pytest
from risk_evaluation_engine.risk_engine import RiskEvaluator, RiskLevel

@pytest.fixture
def instance():
    return RiskEvaluator()

@pytest.mark.parametrize(
        "repayment_percentage , expected",
        [

        (95, RiskLevel.LOW),
        (90.1, RiskLevel.LOW),

        (90, RiskLevel.MEDIUM),
        (80, RiskLevel.MEDIUM),
        (70, RiskLevel.MEDIUM),

        (69.9, RiskLevel.HIGH),
        (50, RiskLevel.HIGH),
        (0, RiskLevel.HIGH),
        (-10, RiskLevel.HIGH),

        (None, RiskLevel.MEDIUM),

        ("95", RiskLevel.LOW),
        ("85", RiskLevel.MEDIUM),
        ("50", RiskLevel.HIGH),

        ("invalid", RiskLevel.MEDIUM),
        ("", RiskLevel.MEDIUM),

        ([], RiskLevel.MEDIUM),
        ({}, RiskLevel.MEDIUM),
    ],
)


def test_assess_repayment_risk(instance, repayment_percentage, expected):
    result = instance.assess_repayment_risk(repayment_percentage)

    assert result == expected


