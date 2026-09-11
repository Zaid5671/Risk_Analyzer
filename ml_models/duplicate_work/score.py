import numpy as np
import pandas as pd
from .config import (
    WEIGHT_SEMANTIC,
    WEIGHT_STRUCTURAL,
    THRESHOLD_HIGH,
    THRESHOLD_REVIEW
)

def compute_duplicate_score(df_scored: pd.DataFrame) -> pd.DataFrame:
    """
    Combines semantic similarity and structural score:
      duplicate_score = w1 * semantic_similarity + w2 * structural_score
    Bounded strictly in [0.0, 1.0].
    Assigns screening severity category: LOW, REVIEW, HIGH / POTENTIAL DUPLICATE.
    """
    df = df_scored.copy()
    
    df["duplicate_score"] = (
        WEIGHT_SEMANTIC * df["semantic_similarity"] +
        WEIGHT_STRUCTURAL * df["structural_score"]
    )
    df["duplicate_score"] = np.clip(df["duplicate_score"], 0.0, 1.0)
    
    # Confidence penalty: If both works are in DIFFERENT constituencies AND different MPs,
    # reduce the score by 20% — these cannot be physical duplicates
    if "is_same_constituency" in df.columns and "is_same_mp" in df.columns:
        different_location = (~df["is_same_constituency"].astype(bool)) & (~df["is_same_mp"].astype(bool))
        df.loc[different_location, "duplicate_score"] *= 0.80
    
    # Assign screening category
    score = df["duplicate_score"].values
    conf = df["confidence"].values
    
    severities = []
    for s, c in zip(score, conf):
        if s >= THRESHOLD_HIGH and c >= 0.50:
            severities.append("HIGH")
        elif s >= THRESHOLD_REVIEW:
            severities.append("REVIEW")
        else:
            severities.append("LOW")
            
    df["severity"] = severities
    return df
