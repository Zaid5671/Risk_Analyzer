from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"

# Input data paths
CANONICAL_WORKS_PATH = DATA_DIR / "features" / "shared" / "canonical_works.parquet"
EXPENDITURE_FEATURES_PATH = DATA_DIR / "features" / "expenditure" / "expenditure_anomaly_features.parquet"

# Output paths
MODELS_DIR = BASE_DIR / "models" / "delay_predictor"
MODEL_OUTPUTS_DIR = DATA_DIR / "model_outputs" / "delay_predictor"
OUTPUT_PARQUET_PATH = MODEL_OUTPUTS_DIR / "delay_predictions.parquet"
MODEL_JOB_PATH = MODELS_DIR / "gradient_boosting.joblib"
ENCODERS_JOB_PATH = MODELS_DIR / "encoders.joblib"

# Reference Date (consistent with platform reference date)
REFERENCE_DATE = "2026-09-05"
COMPLETION_DEADLINE_DAYS = 365

# Features used for supervised classification
FEATURE_COLS = [
    "days_since_sanction",
    "utilization_ratio",
    "transaction_count",
    "work_category_encoded",
    "state_encoded",
    "has_first_disbursement",
]

# Severity classification thresholds
SEVERITY_HIGH_THRESHOLD = 0.75
SEVERITY_MEDIUM_THRESHOLD = 0.50

# Hyperparameters
RANDOM_STATE = 42
N_ESTIMATORS = 100
MAX_DEPTH = 5
TEST_SIZE = 0.20
