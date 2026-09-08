# Model 2: Duplicate Work Detection Report

**Project**: AI-Powered MPLADS Monitoring and Analytics Platform (SIH PS 26102)  
**Phase**: Phase 4.2 — Model 2 (Duplicate Work Detection)  
**Date**: 2026-09-07  
**Model Version**: 1.0.0  

---

## 1. Dataset Summary

* **Candidate Pairs Source**: `data/features/duplicate/duplicate_candidate_pairs.parquet`
* **Canonical Works Source**: `data/features/shared/canonical_works.parquet`
* **Total Candidate Pairs Scored**: **2,025,667**
* **Total Unique Works Involved**: **84,796**
* **Total Unique Descriptions**: **75,620**
* **Deduplication Ratio**: **98.13%** reduction in transformer encoding passes.

---

## 2. Benchmark Results (10,000 Pair Sample)

Before executing the full scoring run, the architecture was benchmarked on 10,000 candidate pairs:

* **Subset Size**: 10,000 candidate pairs
* **Unique Works in Subset**: 980
* **Unique Descriptions in Subset**: 968
* **Benchmark Runtime**: 18.43 seconds
* **Peak Memory (RAM)**: 52.55 MB
* **Embedding Throughput**: **83.2** descriptions/sec
* **Pairwise Similarity Throughput**: **329,234.4** pairs/sec
* **Projected Full Run Runtime**: **944.6** seconds (~15.7 min)
* **Projected Embedding Memory**: **124.21** MB (feasible on standard laptops)

---

## 3. Embedding Architecture

* **Model**: `all-MiniLM-L6-v2`
* **Embedding Dimension**: 384
* **Batch Size**: 256
* **Device**: CPU / PyTorch
* **Unique Works Embedded**: 84,796
* **Cache Strategy**: Saved to `models/duplicate_work/embeddings_cache.npz` for zero re-computation across runs.

---

## 4. Scoring Methodology

The final `duplicate_score` combines semantic similarity and independent structural evidence:

$$\text{duplicate\_score} = 0.65 \times \text{semantic\_similarity} + 0.35 \times \text{structural\_score}$$

### Structural Evidence Components:
* **Amount Similarity** (Weight 0.35): $1.0 - \frac{|\text{amt}_1 - \text{amt}_2|}{\max(\text{amt}_1, \text{amt}_2)}$
* **Date Proximity** (Weight 0.35): $\exp(-\Delta\text{days} / 30.0)$
* **Same MP** (Weight 0.15): 1.0 if identical MP, else 0.0
* **Same Constituency** (Weight 0.15): 1.0 if identical constituency, else 0.0

### Confidence & Generic Text Handling:
* Short descriptions ($< 5$ words) scale confidence down to $\min(1.0, w / 5.0)$.
* Generic repeated descriptions (occurring $\ge 50$ times nationwide) are flagged with a 30% confidence penalty.

### Screening Thresholds:
* **`HIGH / POTENTIAL DUPLICATE`**: $\text{duplicate\_score} \ge 0.85$ and $\text{confidence} \ge 0.50$
* **`REVIEW`**: $0.70 \le \text{duplicate\_score} < 0.85$ (or $\ge 0.85$ with low confidence)
* **`LOW`**: $\text{duplicate\_score} < 0.70$

---

## 5. Results & Severity Distribution

| Screening Severity | Count | Percentage |
| :--- | :--- | :--- |
| **`LOW`** | **592,819** | **29.27%** |
| **`REVIEW`** | **649,112** | **32.04%** |
| **`HIGH` (Potential Duplicate)** | **783,736** | **38.69%** |
| **Total Candidate Pairs** | **2,025,667** | **100.00%** |

### Score Percentiles:
* **50th Percentile (Median)**: 0.8109
* **75th Percentile**: 0.8913
* **90th Percentile**: 0.9594
* **95th Percentile**: 0.9960
* **99th Percentile**: 1.0000
* **Maximum Score**: 1.0000

---

## 6. Top Anomaly Sample (Top 5 Potential Duplicates)

### 1. Pair: `WS/MP18160/2025-2026/230976` & `WS/MP18160/2025-2026/233815`
* **District**: BALOTRA | **Work Type**: `Purchase of smart boards, visual display units and projectors`
* **Sanction Amounts**: ₹600,000.00 vs ₹600,000.00 (diff: ₹0.00)
* **Sanction Dates**: 2025-11-11 vs 2025-11-11 (0 days apart)
* **Work 1 Description**: "As Per Attechment"
* **Work 2 Description**: "As Per Attechment"
* **Semantic Similarity**: **1.0000** | **Structural Score**: **1.0000**
* **Duplicate Score**: **1.0000** | **Severity**: **`REVIEW`**
* **Explanation**: `POTENTIAL DUPLICATE — REQUIRES REVIEW: Semantic similarity 1.00, sanction amounts ₹600,000.00 vs ₹600,000.00 (ratio 1.00), sanction dates 0d apart in BALOTRA (Purchase of smart boards, visual display units and projectors). Same MP: Yes | Same Constituency: Yes. Confidence: 0.42 | Flags: Short description, Generic description. Overall score: 1.00.`

### 2. Pair: `WS/MP18205/2024-2025/148724` & `WS/MP18205/2024-2025/148725`
* **District**: GHAZIPUR | **Work Type**: `Street lights`
* **Sanction Amounts**: ₹216,400.00 vs ₹216,400.00 (diff: ₹0.00)
* **Sanction Dates**: 2025-01-04 vs 2025-01-04 (0 days apart)
* **Work 1 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Work 2 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Semantic Similarity**: **1.0000** | **Structural Score**: **1.0000**
* **Duplicate Score**: **1.0000** | **Severity**: **`HIGH`**
* **Explanation**: `POTENTIAL DUPLICATE — REQUIRES REVIEW: Semantic similarity 1.00, sanction amounts ₹216,400.00 vs ₹216,400.00 (ratio 1.00), sanction dates 0d apart in GHAZIPUR (Street lights). Same MP: Yes | Same Constituency: Yes. Confidence: 1.00. Overall score: 1.00.`

### 3. Pair: `WS/MP18205/2024-2025/148720` & `WS/MP18205/2024-2025/148723`
* **District**: GHAZIPUR | **Work Type**: `Street lights`
* **Sanction Amounts**: ₹216,400.00 vs ₹216,400.00 (diff: ₹0.00)
* **Sanction Dates**: 2025-01-05 vs 2025-01-05 (0 days apart)
* **Work 1 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Work 2 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Semantic Similarity**: **1.0000** | **Structural Score**: **1.0000**
* **Duplicate Score**: **1.0000** | **Severity**: **`HIGH`**
* **Explanation**: `POTENTIAL DUPLICATE — REQUIRES REVIEW: Semantic similarity 1.00, sanction amounts ₹216,400.00 vs ₹216,400.00 (ratio 1.00), sanction dates 0d apart in GHAZIPUR (Street lights). Same MP: Yes | Same Constituency: Yes. Confidence: 1.00. Overall score: 1.00.`

### 4. Pair: `WS/MP18205/2024-2025/148721` & `WS/MP18205/2024-2025/148723`
* **District**: GHAZIPUR | **Work Type**: `Street lights`
* **Sanction Amounts**: ₹216,400.00 vs ₹216,400.00 (diff: ₹0.00)
* **Sanction Dates**: 2025-01-05 vs 2025-01-05 (0 days apart)
* **Work 1 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Work 2 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Semantic Similarity**: **1.0000** | **Structural Score**: **1.0000**
* **Duplicate Score**: **1.0000** | **Severity**: **`HIGH`**
* **Explanation**: `POTENTIAL DUPLICATE — REQUIRES REVIEW: Semantic similarity 1.00, sanction amounts ₹216,400.00 vs ₹216,400.00 (ratio 1.00), sanction dates 0d apart in GHAZIPUR (Street lights). Same MP: Yes | Same Constituency: Yes. Confidence: 1.00. Overall score: 1.00.`

### 5. Pair: `WS/MP18205/2024-2025/148722` & `WS/MP18205/2024-2025/148723`
* **District**: GHAZIPUR | **Work Type**: `Street lights`
* **Sanction Amounts**: ₹216,400.00 vs ₹216,400.00 (diff: ₹0.00)
* **Sanction Dates**: 2025-01-05 vs 2025-01-05 (0 days apart)
* **Work 1 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Work 2 Description**: "Installation of Semi High Mat Lights at different places as per attached recommendation letter Revised Letter Attached"
* **Semantic Similarity**: **1.0000** | **Structural Score**: **1.0000**
* **Duplicate Score**: **1.0000** | **Severity**: **`HIGH`**
* **Explanation**: `POTENTIAL DUPLICATE — REQUIRES REVIEW: Semantic similarity 1.00, sanction amounts ₹216,400.00 vs ₹216,400.00 (ratio 1.00), sanction dates 0d apart in GHAZIPUR (Street lights). Same MP: Yes | Same Constituency: Yes. Confidence: 1.00. Overall score: 1.00.`

---

## 7. Validation Results

### 7.1 Manual Precision@50 Review
* **Total Top Pairs Sampled**: 50
* **Clearly Duplicate (Identical/Near-Identical Scope)**: 49
* **Likely Duplicate (High Overlap/Requires Verification)**: 0
* **Likely Legitimate (Routine Repeated Purchases)**: 0
* **Unclear / Generic**: 1
* **Precision@50 (Strict)**: **98.0%**
* **Precision@50 (Broad)**: **98.0%**

### 7.2 Synthetic Rephrasing Test
* **All Test Cases Passed**: **True**
* Paraphrased pairs consistently scored $\ge 0.80$, while dissimilar pairs scored $< 0.40$.

### 7.3 Generic Description Sanity Check
* Works with high-frequency generic phrases (e.g., "Led Semi High Mast Light") receive an automatic confidence reduction and are prevented from dominating the top of the review priority list.

---

## 8. Limitations & Auditable Framing

> **Important Operational Note**: The system identifies potential duplicate works for administrative screening and review. It does not establish that two works are fraudulent duplicates or illegal. Administrative verification by implementing district authorities (IDA) is required prior to taking any sanction or audit action.

---

## 9. Output Artifacts

* **Full Scored Dataset**: `data/model_outputs/duplicate_work/duplicate_scores.parquet` (2,025,667 pairs)
* **Review Dataset**: `data/model_outputs/duplicate_work/duplicate_review.parquet` (1,432,848 pairs)
* **Embeddings Cache**: `models/duplicate_work/embeddings_cache.npz`
* **Metadata**: `models/duplicate_work/global_model_metadata.json`
* **Unit Tests**: `tests/test_model2_duplicate_work.py`

---

**MODEL 2 COMPLETE**