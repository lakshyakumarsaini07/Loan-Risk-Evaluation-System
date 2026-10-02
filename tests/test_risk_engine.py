import json
import pytest
from pathlib import Path

from risk_evaluation_engine.risk_engine import (
    RiskEvaluator,
    RiskLevel,
    LoanDecision,
    eval_loan_risk,
)


@pytest.fixture
def evaluator():
    return RiskEvaluator()


# assess_repayment_risk
@pytest.mark.parametrize(
    "repayment,expected",
    [
        (95, RiskLevel.LOW),
        (90, RiskLevel.MEDIUM),
        (70, RiskLevel.MEDIUM),
        (50, RiskLevel.HIGH),
        (None, RiskLevel.MEDIUM),
        ("invalid", RiskLevel.MEDIUM),
    ]
)
def test_assess_repayment_risk(evaluator, repayment, expected):
    assert evaluator.assess_repayment_risk(repayment) == expected


# detect_fraud
@pytest.mark.parametrize(
    "data,expected",
    [
        ({"Fraud History": "Fraud case"}, True),
        ({"fraud history": "Suspicious activity"}, True),
        ({"Risk Flag": "fraud"}, False),
        ({"Fraud History": "clean"}, False),
        ({}, False),
    ]
)
def test_detect_fraud(evaluator, data, expected):
    assert evaluator.detect_fraud(data) is expected


# check_legal_issues
@pytest.mark.parametrize(
    "data,expected",
    [
        ({"Legal Issues": "pending litigation"}, True),
        ({"Legal Issues": "unknown"}, False),
        ({"Legal Issues": ""}, False),
        ({}, False),
        ({"Legal Issues": "fraud"}, True),
    ]
)
def test_check_legal_issues(evaluator, data, expected):
    assert evaluator.check_legal_issues(data) is expected



# count_loan
def test_count_loan(evaluator):
    records = [{}, {}, {}]

    assert evaluator.count_loan(records) == 3
    assert evaluator.count_loan([]) == 0
    assert evaluator.count_loan(None) == 0


# multiple_loans
@pytest.mark.parametrize(
    "count,expected",
    [
        (0, False),
        (1, False),
        (2, True),
    ]
)
def test_multiple_loans(evaluator, count, expected):
    assert evaluator.multiple_loans(count) is expected



# inc_riskLevel
@pytest.mark.parametrize(
    "risk,expected",
    [
        (RiskLevel.LOW, RiskLevel.MEDIUM),
        (RiskLevel.MEDIUM, RiskLevel.HIGH),
        (RiskLevel.HIGH, RiskLevel.HIGH),
    ]
)
def test_inc_risk_level(evaluator, risk, expected):
    assert evaluator.inc_riskLevel(risk) == expected



# make_decision
@pytest.mark.parametrize(
    "risk,expected",
    [
        (RiskLevel.LOW, LoanDecision.APPROVE),
        (RiskLevel.MEDIUM, LoanDecision.MANUAL_REVIEW),
        (RiskLevel.HIGH, LoanDecision.REJECT),
    ]
)
def test_make_decision(evaluator, risk, expected):
    assert evaluator.make_decision(risk) == expected



# eval_loan_from_llm (low risk) 
def test_eval_loan_from_llm_low_risk(evaluator):
    llm = {
        "Company Name": "ABC",
        "Repayment Percentage": 95,
        "Loan Status": "Paid",
    }

    result = evaluator.eval_loan_from_llm(llm, [])

    assert result["company_name"] == "ABC"
    assert result["risk_level"] == "Low Risk"
    assert result["decision"] == "Approve Loan"



# eval_loan_from_llm fraud -> reject
def test_eval_loan_from_llm_fraud(evaluator):

    llm = {
        "Company Name": "XYZ",
        "Repayment Percentage": 95,
        "Fraud History": "Fraud detected"
    }

    result = evaluator.eval_loan_from_llm(llm, [])

    assert result["risk_level"] == "High Risk"
    assert result["decision"] == "Reject Loan"
    assert result["details"]["fraud_detected"] is True



# legal issue increases risk
def test_eval_loan_legal_issue(evaluator):

    llm = {
        "Repayment Percentage": 95,
        "Legal Issues": "ongoing litigation"
    }

    result = evaluator.eval_loan_from_llm(llm, [])

    assert result["risk_level"] == "Medium Risk"



# multiple loans increase risk
def test_eval_loan_multiple_loans(evaluator):

    llm = {"Repayment Percentage": 95}

    records = [{}, {}]

    result = evaluator.eval_loan_from_llm(llm, records)

    assert result["risk_level"] == "Medium Risk"



# eval_loan_risk wrapper
def test_eval_loan_risk():

    result = eval_loan_risk(
        {"Repayment Percentage": 95},
        []
    )

    assert result["decision"] == "Approve Loan"








