"""
Tests for Phase 6.1 — Database & Ingestion Pipeline
Verifies Supabase connection, schema tables, row counts, foreign key integrity, and independent models.
"""

import pytest
from sqlalchemy import text
from database.connection import get_engine, check_connection
from database.models import (
    Work,
    CostAnomalyResult,
    DuplicateWorkResult,
    FundExpenditureResult,
    DelayResult,
    WorkExpenditure,
)

def test_database_connection():
    """Verify live connection to Supabase PostgreSQL."""
    assert check_connection() is True

def test_database_tables_exist():
    """Verify all 6 core tables exist in the database."""
    engine = get_engine()
    with engine.connect() as conn:
        for model in [Work, CostAnomalyResult, DuplicateWorkResult, FundExpenditureResult, DelayResult, WorkExpenditure]:
            table_name = model.__tablename__
            result = conn.execute(text(f"SELECT to_regclass('public.{table_name}');"))
            regclass = result.scalar()
            assert regclass is not None, f"Table {table_name} does not exist"

def test_works_row_count():
    """Verify canonical works table has 98,825 rows."""
    engine = get_engine()
    with engine.connect() as conn:
        count = conn.execute(text("SELECT count(*) FROM works;")).scalar()
        assert count == 98825

def test_model_results_row_counts():
    """Verify all independent model results have expected row counts."""
    engine = get_engine()
    with engine.connect() as conn:
        cost_cnt = conn.execute(text("SELECT count(*) FROM cost_anomaly_results;")).scalar()
        assert cost_cnt == 98825

        fund_cnt = conn.execute(text("SELECT count(*) FROM fund_expenditure_results;")).scalar()
        assert fund_cnt == 98825

        delay_cnt = conn.execute(text("SELECT count(*) FROM delay_results;")).scalar()
        assert delay_cnt == 98825

        exp_cnt = conn.execute(text("SELECT count(*) FROM work_expenditures;")).scalar()
        assert exp_cnt == 109311

        dup_cnt = conn.execute(text("SELECT count(*) FROM duplicate_work_results;")).scalar()
        assert dup_cnt == 50000

def test_foreign_key_integrity():
    """Verify zero orphaned records linking to the works table."""
    engine = get_engine()
    with engine.connect() as conn:
        cost_orphans = conn.execute(text(
            "SELECT count(*) FROM cost_anomaly_results c LEFT JOIN works w ON c.work_id = w.work_id WHERE w.work_id IS NULL;"
        )).scalar()
        assert cost_orphans == 0

        fund_orphans = conn.execute(text(
            "SELECT count(*) FROM fund_expenditure_results f LEFT JOIN works w ON f.work_id = w.work_id WHERE w.work_id IS NULL;"
        )).scalar()
        assert fund_orphans == 0

        delay_orphans = conn.execute(text(
            "SELECT count(*) FROM delay_results d LEFT JOIN works w ON d.work_id = w.work_id WHERE w.work_id IS NULL;"
        )).scalar()
        assert delay_orphans == 0

        dup1_orphans = conn.execute(text(
            "SELECT count(*) FROM duplicate_work_results d LEFT JOIN works w ON d.work_id_1 = w.work_id WHERE w.work_id IS NULL;"
        )).scalar()
        assert dup1_orphans == 0

        dup2_orphans = conn.execute(text(
            "SELECT count(*) FROM duplicate_work_results d LEFT JOIN works w ON d.work_id_2 = w.work_id WHERE w.work_id IS NULL;"
        )).scalar()
        assert dup2_orphans == 0

def test_independent_models_no_composite_risk():
    """Verify all 4 model outputs are completely separate with independent score columns."""
    engine = get_engine()
    with engine.connect() as conn:
        cost_cols = [row[0] for row in conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'cost_anomaly_results';"
        )).fetchall()]
        assert "cost_anomaly_score" in cost_cols
        assert "composite_risk_score" not in cost_cols

        delay_cols = [row[0] for row in conn.execute(text(
            "SELECT column_name FROM information_schema.columns WHERE table_name = 'delay_results';"
        )).fetchall()]
        assert "delay_score" in delay_cols
        assert "composite_risk_score" not in delay_cols
