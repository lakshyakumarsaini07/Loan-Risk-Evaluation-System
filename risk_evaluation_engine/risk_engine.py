from typing import List, Dict, Any, Optional
import json
from enum import Enum

class RiskLevel(Enum):
    LOW = "Low Risk"
    MEDIUM = "Medium Risk"
    HIGH = "High Risk"

class LoanDecision(Enum):
    APPROVE = "Approve Loan"
    MANUAL_REVIEW = "Manual Review"
    REJECT = "Reject Loan"


class RiskEvaluator:
    def _normalize_text(self, value: Any) -> str:
        return str(value or "").strip().lower()

    def _has_negative_signal(self, value: Any, phrases: List[str]) -> bool:
        normalized = self._normalize_text(value)
        if not normalized:
            return False
        return any(phrase in normalized for phrase in phrases)

    def _is_paid_status(self, status: Any) -> bool:
        normalized = self._normalize_text(status)
        if not normalized:
            return False
        return normalized in {"paid", "closed", "settled"}

    def assess_repayment_risk(self, repayment_percentage: Optional[float]) -> RiskLevel:
        if repayment_percentage is None:
            return RiskLevel.MEDIUM
        
        try:
            repayment = float(repayment_percentage)
            if repayment > 90:
                return RiskLevel.LOW
            if 70 <= repayment <= 90:
                return RiskLevel.MEDIUM
            return RiskLevel.HIGH
        except (ValueError, TypeError):
            return RiskLevel.MEDIUM

    def detect_fraud(self, llm_analysis: Dict[str, Any]) -> bool:
        fraud_history = str(
            llm_analysis.get("fraudHistory")
            or ""
        ).lower()
        risk_flag = str(llm_analysis.get("Risk Flag", "")).lower()

        negative_phrases = [
            "no fraud",
            "no indication of fraud",
            "no evidence of fraud",
            "no known fraud",
            "none",
            "none detected",
            "not detected",
            "without fraud",
            "no suspicious activity",
            "no suspicion of fraud",
        ]

        if self._has_negative_signal(fraud_history, negative_phrases):
            return False

        fraud_indicators = ["fraud", "suspicious"]
        has_fraud = any(indicator in fraud_history for indicator in fraud_indicators)
        has_fraud_flag = "fraud" in risk_flag

        return has_fraud or has_fraud_flag

    def check_legal_issues(self, llm_analysis: Dict[str, Any]) -> bool:
        legal_issues = llm_analysis.get("legalIssues", "")
        negative_phrases = [
            "unknown",
            "none",
            "none detected",
            "no",
            "n/a",
            "na",
            "no legal issues",
            "no indication of legal issues",
            "no evidence of legal issues",
            "no known legal issues",
            "not detected",
            "no litigation",
            "no lawsuits",
            "no disputes",
        ]

        return not self._has_negative_signal(legal_issues, negative_phrases)

    def count_loan(self, records: List[Dict[str, Any]]) -> int:
        return len(records) if records else 0

    def multiple_loans(self, loan_count: int) -> bool:
        return loan_count > 1

    def inc_riskLevel(self, current_risk: RiskLevel) -> RiskLevel:
        if current_risk == RiskLevel.LOW:
            return RiskLevel.MEDIUM
        if current_risk == RiskLevel.MEDIUM:
            return RiskLevel.HIGH
        return RiskLevel.HIGH

    def make_decision(self, risk_level: RiskLevel) -> LoanDecision:
        if risk_level == RiskLevel.LOW:
            return LoanDecision.APPROVE
        if risk_level == RiskLevel.MEDIUM:
            return LoanDecision.MANUAL_REVIEW
        return LoanDecision.REJECT

    def eval_loan_from_llm(
        self,
        llm_analysis: Dict[str, Any],
        records: List[Dict[str, Any]],
    ) -> dict[str, Any]:
        factors: List[str] = []

        company_name = (
            records[0].get("Company Name")
            if records
            else "Unknown"
        )

        # Compute repayment percentage from provided records (average of available values).
        repayment_values: List[float] = []
        for rec in records or []:
            val = rec.get("Repayment Percentage")
            if val is None:
                continue
            try:
                repayment_values.append(float(val))
            except (TypeError, ValueError):
                if isinstance(val, str):
                    try:
                        cleaned = val.strip().replace("%", "").replace(",", "")
                        repayment_values.append(float(cleaned))
                    except Exception:
                        continue
                else:
                    continue

        repayment_percentage: Optional[float] = None
        if repayment_values:
            repayment_percentage = sum(repayment_values) / len(repayment_values)
        else:
            # fallback to LLM-provided repayment percentage if no record values
            lp = llm_analysis.get("repaymentPct")
            if lp is not None:
                try:
                    repayment_percentage = float(lp)
                except (TypeError, ValueError):
                    if isinstance(lp, str):
                        try:
                            cleaned = lp.strip().replace("%", "").replace(",", "")
                            repayment_percentage = float(cleaned)
                        except Exception:
                            repayment_percentage = None

        # keep loan status from LLM analysis where applicable
        loan_status = (
            records[0].get("Loan Status")
            if records
            else "Unknown"
        )

        risk_level = self.assess_repayment_risk(repayment_percentage)

        fraud_detected = self.detect_fraud(llm_analysis)
        if fraud_detected:
            fraud_history = llm_analysis.get(
                "fraudHistory",
                ""
            )
            risk_level = RiskLevel.HIGH
            factors.append(f"Fraud Detected: {fraud_history} ")

        has_legal_issue = self.check_legal_issues(llm_analysis)
        if has_legal_issue:
            found_legal_issue = llm_analysis.get("legalIssues", "")
            if risk_level != RiskLevel.HIGH:
                risk_level = self.inc_riskLevel(risk_level)
            factors.append(f"Legal Issues: {found_legal_issue}")

        loan_count = self.count_loan(records)
        has_multiple_loans = self.multiple_loans(loan_count)
        if has_multiple_loans:
            # Only escalate for multiple loans when repayment risk is already elevated
            # or there is at least one non-paid loan status in the records.
            has_non_paid = any(
                not self._is_paid_status(rec.get("Loan Status"))
                for rec in records or []
            )
            if not records:
                has_non_paid = False

            if risk_level != RiskLevel.LOW or has_non_paid:
                risk_level = self.inc_riskLevel(risk_level)

            factors.append(f"Multiple Loans • Count: {loan_count}")

        decision = self.make_decision(risk_level)

        return {
            "company_name": company_name,
            "risk_level": risk_level.value,
            "decision": decision.value,
            "factors": factors,
            "details": {
                    "repayment_percentage": f"{repayment_percentage:.2f}" if repayment_percentage is not None else None,
                "fraud_detected": fraud_detected,
                "legal_issues": has_legal_issue,
                "loan_count": loan_count,
                "loan_status": loan_status,
                "creditworthiness": llm_analysis.get("creditworthiness", "Unknown"),
                "companySummary" : llm_analysis.get("companySummary","UnKnown")



            },
        }

def eval_loan_risk(
    llm_analysis: Dict[str, Any],
    records: List[Dict[str, Any]],
) -> Dict[str, Any]:
    evaluator = RiskEvaluator()
    return evaluator.eval_loan_from_llm(llm_analysis, records)

