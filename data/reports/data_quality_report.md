# Phase 2 — Data Ingestion & Quality Validation Report
**Status**: `PHASE 2 COMPLETE`  
**Active Files Processed**: 12  

---

## 1. Dataset Scope & Availability Status

| Dataset Folder | Scope Category | Status | Details |
|---|---|---|---|
| `LokSabha18` | Active | `processed` | Processed 6 files |
| `RajyaSabha_Sitting` | Active | `processed` | Processed 6 files |
| `LokSabha17` | Optional / Historical | `excluded_optional_historical` | Optional historical dataset excluded from current active scope. |
| `RajyaSabha_Retired` | Optional / Historical | `excluded_optional_historical` | Optional historical dataset excluded from current active scope. |

---

## 2. Active Dataset Ingestion Summary

| House | Dataset | Source File | Rows Before | Grand Total Removed | Rows After | Valid Work IDs | NA Recs |
|---|---|---|---|---|---|---|---|
| Lok Sabha | `mp_allocations` | `LokSabha18/Allocated Limit for Honble MPs_LokSabha_18.csv` | 544 | 1 | 543 | 0 | 0 |
| Lok Sabha | `calamity` | `LokSabha18/Amount consented for Calamity_LokSabha_18.csv` | 13 | 1 | 12 | 0 | 0 |
| Lok Sabha | `expenditures` | `LokSabha18/Expenditure on Completed and On-going Works as on Date_LokSabha_18.csv` | 84,172 | 1 | 84,171 | 84,171 | 0 |
| Lok Sabha | `works_completed` | `LokSabha18/Works Completed_LokSabha_18.csv` | 34,440 | 1 | 34,439 | 34,439 | 0 |
| Lok Sabha | `works_recommended` | `LokSabha18/Works Recommended_LokSabha_18.csv` | 107,024 | 1 | 107,023 | 78,851 | 28,172 |
| Lok Sabha | `works_sanctioned` | `LokSabha18/Works Sanctioned_LokSabha_18.csv` | 79,220 | 1 | 79,219 | 79,219 | 0 |
| Rajya Sabha | `mp_allocations` | `RajyaSabha_Sitting/Allocated_Limit_for_Honble_MPs_Rajya_Sabha.csv` | 232 | 1 | 231 | 0 | 0 |
| Rajya Sabha | `calamity` | `RajyaSabha_Sitting/Amount_consented_for_Calamity_Rajya_Sitting.csv` | 21 | 1 | 20 | 0 | 0 |
| Rajya Sabha | `expenditures` | `RajyaSabha_Sitting/Expenditure_on_Completed_and_On-going_Works_as_on_Date_Rajya_Sitting.csv` | 25,141 | 1 | 25,140 | 25,140 | 0 |
| Rajya Sabha | `works_completed` | `RajyaSabha_Sitting/Works_Completed_Rajya_Sitting.csv` | 9,979 | 1 | 9,978 | 9,978 | 0 |
| Rajya Sabha | `works_recommended` | `RajyaSabha_Sitting/Works_Recommended_Rajya_Sitting.csv` | 25,240 | 1 | 25,239 | 19,378 | 5,861 |
| Rajya Sabha | `works_sanctioned` | `RajyaSabha_Sitting/Works_Sanctioned_Rajya_Sitting.csv` | 19,607 | 1 | 19,606 | 19,606 | 0 |

---

## 3. Cross-Dataset Join Validation (Lok Sabha 18th)

### Sanctioned → Expenditure Work ID Match
- **Unique Expenditure Work IDs**: 56,604
- **Matching Sanctioned Work IDs**: 56,604
- **Unmatched Expenditure Work IDs**: 0
- **Match Percentage**: `100.0%`

### Completed → Sanctioned Work ID Match
- **Unique Completed Work IDs**: 34,439
- **Matching Sanctioned Work IDs**: 34,439
- **Unmatched Completed Work IDs**: 0
- **Match Percentage**: `100.0%`

### MP Allocation → Sanctioned MP Name Match
- **Unique Allocated MPs**: 543
- **Matching Sanctioned MPs**: 536
- **Unmatched Allocated MPs**: 7
- **Match Percentage**: `98.71%`


---

## 4. Policy Constants & External Dependencies

- **SLA Policy Thresholds**: SLA thresholds are configured as fixed policy constants (75 / 45 / 365 days) according to the finalized Phase 1 specification:
  - Recommendation → Sanction: **75 days**
  - Rejection notification: **45 days**
  - General work completion limit: **365 days**
- **Only Remaining External Dependency**: Authoritative eligible/ineligible MPLADS work-category allowlist.