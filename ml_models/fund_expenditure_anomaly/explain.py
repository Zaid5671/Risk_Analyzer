import pandas as pd
from typing import List, Tuple
from .config import Model3Config

class ExplanationGenerator:
    def __init__(self, config: Model3Config):
        self.config = config

    def generate_reasons_and_explanation(self, row: pd.Series) -> Tuple[List[str], str]:
        """
        Generates auditable reason tags and a transparent human-readable explanation
        documenting exactly why a work was flagged.
        """
        reasons = []
        explanation_parts = []

        status = str(row.get("work_status", "Unknown"))
        sanction_amt = float(row.get("sanction_amount", 0.0))
        disbursed_amt = float(row.get("total_disbursed_amount", 0.0))
        util_ratio = float(row.get("utilization_ratio", 0.0))
        tx_cnt = int(row.get("transaction_count", 0))
        hhi = float(row.get("payment_concentration_hhi", 0.0))
        days_first = row.get("days_to_first_disbursement", None)
        score = float(row.get("fund_anomaly_score", 0.0))
        severity = str(row.get("severity", "LOW"))
        category = str(row.get("audit_category", "ACTIVE_EXPENDITURE"))

        # Case 1: Status-Expenditure Mismatch (Late status + zero expenditure)
        if category == "STATUS_EXPENDITURE_MISMATCH":
            reasons.append("STATUS_EXPENDITURE_MISMATCH")
            explanation = (
                f"Work status is '{status}', but portal expenditure records show ₹0.00 disbursed "
                f"(Sanction: ₹{sanction_amt:,.2f}). Requires administrative verification for "
                f"unrecorded payment vouchers or source data synchronization lag."
            )
            return reasons, explanation

        # Case 2: Dormant Sanction (>365 days with zero disbursement)
        if category == "DORMANT_SANCTION":
            sanction_age = int(row.get("sanction_age_days", 0))
            reasons.append("DORMANT_SANCTION")
            explanation = (
                f"Work was sanctioned {sanction_age} days ago (exceeding 365-day general completion limit), "
                f"yet zero funds have been disbursed from ₹{sanction_amt:,.2f} sanctioned. "
                f"Requires review for stalled project implementation."
            )
            return reasons, explanation

        # Case 3: Normal Awaiting Disbursement
        if category == "NORMAL_AWAITING_DISBURSEMENT":
            sanction_age = int(row.get("sanction_age_days", 0))
            reasons.append("NORMAL_AWAITING_DISBURSEMENT")
            explanation = (
                f"Normal early stage ({status}, {sanction_age} days since sanction). "
                f"Awaiting initial fund release. No financial anomaly detected."
            )
            return reasons, explanation

        # Case 4: Active works checks
        # Work Completed with low utilization (< 50%)
        if row.get("is_completed_low_util", False):
            reasons.append("LOW_UTILIZATION_COMPLETED")
            explanation_parts.append(
                f"Work marked '{status}' with only {util_ratio*100:.1f}% fund utilization "
                f"(₹{disbursed_amt:,.2f} spent of ₹{sanction_amt:,.2f} sanctioned)."
            )

        # Early stage with disbursement
        if row.get("is_early_high_disb", False):
            reasons.append("EARLY_STAGE_DISBURSEMENT")
            explanation_parts.append(
                f"Disbursement of ₹{disbursed_amt:,.2f} recorded while work status is still in '{status}' stage."
            )

        # Extreme transaction count (slicing/fragmentation)
        if tx_cnt >= 10:
            reasons.append("EXTREME_TRANCHE_FRAGMENTATION")
            explanation_parts.append(
                f"High transaction fragmentation: {tx_cnt} payment tranches (HHI={hhi:.3f}) vs peer median of 1 tranche."
            )

        # Abnormal disbursement latency (> 300 days)
        if days_first is not None and pd.notna(days_first) and float(days_first) >= 300:
            reasons.append("PROLONGED_DISBURSEMENT_LATENCY")
            explanation_parts.append(
                f"Delayed first payout: {int(days_first)} days elapsed between sanction and initial disbursement."
            )

        # Rapid lump-sum drain on large work (Disbursed >= ₹50L with HHI=1.0 in 0-1 days)
        spending_win = float(row.get("spending_window_days", 0.0))
        if disbursed_amt >= 5000000.0 and hhi >= 0.99 and spending_win <= 1:
            reasons.append("LARGE_LUMP_SUM_RAPID_DRAIN")
            explanation_parts.append(
                f"Large single-day lump-sum release: ₹{disbursed_amt:,.2f} disbursed in 1 tranche on Day {int(days_first or 0)}."
            )

        # Severe under-utilization on active work (< 30% utilization on non-recent work)
        if util_ratio < 0.30 and not row.get("is_completed_low_util", False):
            reasons.append("SEVERE_UNDER_UTILIZATION")
            explanation_parts.append(
                f"Low fund absorption: only {util_ratio*100:.1f}% utilized (₹{disbursed_amt:,.2f} / ₹{sanction_amt:,.2f})."
            )

        # Default normal explanation if no specific trigger fired
        if not reasons:
            reasons.append("NORMAL_EXPENDITURE_PATTERN")
            explanation = (
                f"Disbursed ₹{disbursed_amt:,.2f} across {tx_cnt} tranche(s) ({util_ratio*100:.1f}% utilization). "
                f"Consistent with typical MPLADS financial flow."
            )
        else:
            factors = " | ".join(explanation_parts)
            explanation = (
                f"Financial Anomaly Strength: {score:.2f} ({severity}). "
                f"Key observations: {factors}"
            )

        return reasons, explanation
