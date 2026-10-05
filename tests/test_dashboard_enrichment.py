"""
Dashboard backend enrichment: readable work context and reasons on list endpoints,
duplicate groups, full-coverage summaries, user listing, demo mode and warning paging.
"""
import pytest

from api.config import settings
from api.enrichment import format_inr


def test_format_inr_uses_indian_units():
    assert format_inr(2_000_000) == "₹20 L"
    assert format_inr(12_500_000) == "₹1.25 Cr"
    assert format_inr(45_000) == "₹45,000"
    assert format_inr(None) == "—"


@pytest.mark.parametrize("path", [
    "/api/v1/analytics/cost-anomalies",
    "/api/v1/analytics/fund-anomalies",
    "/api/v1/analytics/delays",
    "/api/v1/analytics/predictions/delay-risk",
])
def test_list_items_carry_work_context_and_reason(client, ministry_headers, path):
    r = client.get(path, params={"page_size": 10}, headers=ministry_headers)
    assert r.status_code == 200
    items = r.json()["items"]
    assert items
    for item in items:
        assert item["work_info"]["work_id"] == item["work_id"]
        assert item["reason"]


def test_cost_items_include_peer_median(client, ministry_headers):
    r = client.get("/api/v1/analytics/cost-anomalies", params={"severity": "HIGH", "page_size": 5}, headers=ministry_headers)
    item = r.json()["items"][0]
    assert item["peer_median_amount"] > 0
    assert item["cost_ratio_vs_peer_median"] > 1
    assert "typical" in item["reason"]


def test_duplicate_pairs_include_both_works(client, ministry_headers):
    r = client.get("/api/v1/analytics/duplicate-works", params={"page_size": 5}, headers=ministry_headers)
    for pair in r.json()["items"]:
        assert pair["work_1"]["work_id"] == pair["work_id_1"]
        assert pair["work_2"]["work_id"] == pair["work_id_2"]


def test_duplicate_groups_collapse_pairs(client, ministry_headers):
    summary = client.get("/api/v1/analytics/duplicate-works/summary", headers=ministry_headers).json()
    assert summary["total_groups"] > 0
    assert summary["total_works_involved"] < 2 * summary["total_pairs"]

    r = client.get("/api/v1/analytics/duplicate-works/groups", params={"page_size": 20}, headers=ministry_headers)
    assert r.status_code == 200
    body = r.json()
    assert body["pagination"]["total_records"] == summary["total_groups"]
    sizes = [g["work_count"] for g in body["items"]]
    assert sizes == sorted(sizes, reverse=True)
    for g in body["items"]:
        assert g["work_count"] >= 2 and g["reason"]
        assert len(g["works"]) == min(g["work_count"], 50)


def test_duplicate_groups_respect_jurisdiction(client, district_patna_headers, ministry_headers):
    patna = client.get("/api/v1/analytics/duplicate-works/summary", headers=district_patna_headers).json()
    national = client.get("/api/v1/analytics/duplicate-works/summary", headers=ministry_headers).json()
    assert 0 < patna["total_groups"] < national["total_groups"]

    r = client.get("/api/v1/analytics/duplicate-works/groups", params={"page_size": 100}, headers=district_patna_headers)
    for g in r.json()["items"]:
        if not g["works_truncated"]:
            assert any(w["state"] == "Bihar" and w["district"] == "PATNA" for w in g["works"])


def test_district_summary_covers_every_district_in_one_call(client, ministry_headers):
    r = client.get("/api/v1/analytics/district-summary", params={"limit": 1000}, headers=ministry_headers)
    assert r.status_code == 200
    rows = r.json()
    assert len(rows) == 861
    assert len({row["state"] for row in rows}) == 36


def test_delay_type_filter_accepts_stored_and_legacy_values(client, ministry_headers):
    stored = client.get("/api/v1/analytics/delays", params={"primary_delay_type": "OPEN_WORK_AGING", "page_size": 5}, headers=ministry_headers)
    legacy = client.get("/api/v1/analytics/delays", params={"primary_delay_type": "OPEN_WORK_AGING_STALLED", "page_size": 5}, headers=ministry_headers)
    assert stored.status_code == legacy.status_code == 200
    assert stored.json()["pagination"]["total_records"] > 0
    assert stored.json()["pagination"]["total_records"] == legacy.json()["pagination"]["total_records"]
    assert all(i["primary_delay_type"] == "OPEN_WORK_AGING" for i in stored.json()["items"])


def test_list_users_is_ministry_only(client, ministry_headers, state_up_headers):
    r = client.get("/api/v1/auth/users", headers=ministry_headers)
    assert r.status_code == 200
    emails = {u["email"] for u in r.json()}
    assert "ministry@mplads.gov.in" in emails
    assert all("hashed_password" not in u for u in r.json())
    assert client.get("/api/v1/auth/users", headers=state_up_headers).status_code == 403


def test_demo_mode_blocks_user_creation(client, ministry_headers, monkeypatch):
    monkeypatch.setattr(settings, "DEMO_MODE", True)
    r = client.post("/api/v1/auth/users", headers=ministry_headers, json={
        "email": "should.not.exist@mplads.gov.in", "password": "Password123!",
        "full_name": "Blocked User", "role": "MINISTRY",
    })
    assert r.status_code == 403
    assert "demo" in r.json()["detail"].lower()


def test_early_warnings_paging_and_descriptions(client, ministry_headers):
    first = client.get("/api/v1/analytics/trends/early-warnings", params={"limit": 5}, headers=ministry_headers).json()
    second = client.get("/api/v1/analytics/trends/early-warnings", params={"limit": 5, "offset": 5}, headers=ministry_headers).json()
    assert first["total_alerts"] == second["total_alerts"]
    assert {a["work_id"] for a in first["alerts"]}.isdisjoint({a["work_id"] for a in second["alerts"]})
    assert all(a["urgency_level"] == "CRITICAL" for a in first["alerts"])
    assert any(a["work_description"] for a in first["alerts"])
