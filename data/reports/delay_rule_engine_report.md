# Phase 5: Delay Logic & SLA Rule Engine Report

**Project**: AI-Powered MPLADS Monitoring and Analytics Platform (SIH PS 26102)  
**Phase**: Phase 5 — Delay Logic + Severity Logging  
**Date**: 2026-09-11  
**Status**: `PHASE 5 COMPLETE`  

---

## 1. Executive Summary
Phase 5 implements the deterministic Delay & SLA Rule Engine for all 98,825 active MPLADS works. Grounded in official MPLADS guidelines (Para 3.12 75-day sanction SLA and 365-day completion guideline limit), the engine evaluates observable lifecycle milestones, assigns standardized severities (`NONE`, `LOW`, `MEDIUM`, `HIGH`), and produces a fully explainable, normalized delay score in [0.0, 1.0].

## 2. Dataset & Reference Date Strategy
* **Total Works Analyzed**: 98,825
* **Completed Works Analyzed**: 44,417 (45.0%)
* **Incomplete / Open Works Analyzed**: 54,408 (55.0%)
* **Fixed Reference Date**: `2026-09-05` (latest sanction date in dataset, ensuring complete determinism and reproducibility)
* **Execution Runtime**: 21.62 seconds

## 3. Severity Distribution
| Severity Tier | Work Count | Share % | Definition / Operational Meaning |
|---|---|---|---|
| `NONE` | 38,233 | 38.69% | Fully compliant with 75-day sanction SLA and 365-day execution guideline |
| `LOW` | 21,803 | 22.06% | Minor administrative delay (76–150 days on recommendation -> sanction) |
| `MEDIUM` | 23,526 | 23.81% | Significant delay: 151–225 days on sanction OR 1.0–1.5 years on project execution |
| `HIGH` | 15,263 | 15.44% | Severe delay: >225 days on sanction (>3x SLA) OR >1.5 years on project execution |

## 4. Milestone-Specific Breakdown
* **Recommendation → Sanction SLA (75 Days)**:
  * Exceeded: **50,432** works (51.03%)
  * Within SLA: **48,393** works
* **Sanction → Completion (Completed Works, $N = 44,417$)**:
  * Exceeded 365-day guideline: **5,370** works (12.09%)
  * Completed within 1 year: **39,047** works
* **Open Work Aging (Incomplete Works, $N = 54,408$)**:
  * Exceeded 365-day guideline: **13,768** works (25.31%)
  * Within 1 year allowable window: **40,640** works

## 5. Score Percentiles (Normalized Delay Score [0.0, 1.0])
* **p0 (Min)**: 0.0
* **p25**: 0.1567
* **p50 (Median)**: 0.3567
* **p75**: 0.5923
* **p90**: 0.82
* **p95**: 1.0
* **p99**: 1.0
* **p100 (Max)**: 1.0

## 6. Sample Top Delayed Works
| Work ID | State | Status | Rec->Sanc Days | Sanc->Comp Days | Open Aging Days | Delay Score | Severity |
|---|---|---|---|---|---|---|---|
| `WS/MP18345/2026-2027/231787` | Uttar Pradesh | Sanction | 319d | N/A | 45d | `1.00` | `HIGH` |
| `WS/MP577/2025-2026/133564` | Gujarat | Physical Inspection | 534d | 130d | N/A | `1.00` | `HIGH` |
| `WS/MP577/2025-2026/133563` | Gujarat | Physical Inspection | 447d | 329d | N/A | `1.00` | `HIGH` |
| `WS/MP577/2025-2026/133562` | Gujarat | Sanction | 447d | N/A | 333d | `1.00` | `HIGH` |
| `WS/MP577/2025-2026/133561` | Gujarat | Sanction | 457d | N/A | 323d | `1.00` | `HIGH` |
| `WS/MP620/2025-2026/133305` | Karnataka | Sanction | 329d | N/A | 459d | `1.00` | `HIGH` |
| `WS/MP620/2025-2026/133191` | Karnataka | Work partially Completed | 325d | N/A | 464d | `1.00` | `HIGH` |
| `WS/MP620/2025-2026/133167` | Karnataka | Sanction | 437d | N/A | 352d | `1.00` | `HIGH` |
| `WS/MP171/2025-2026/145684` | Telangana | Work Completed | 342d | 63d | N/A | `1.00` | `HIGH` |
| `WS/MP171/2025-2026/145683` | Telangana | Work Completed | 342d | 63d | N/A | `1.00` | `HIGH` |

## 7. Artifacts & Outputs
* **Scored Dataset**: `data\model_outputs\delay_rules\delay_scores.parquet`
* **Report Document**: `data\reports\delay_rule_engine_report.md`
