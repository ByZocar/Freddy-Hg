"""Tests del SHA-256 de cadena de custodia."""
from backend.services.sha256_chain import compute_evidence_hash, hash_phone


def test_evidence_hash_is_reproducible():
    payload = {"centroid_lat": -1.234567, "centroid_lon": -72.345678}
    h1 = compute_evidence_hash(payload, "S1A_IW_GRDH_TEST", "2026-05-10T10:15:01Z")
    h2 = compute_evidence_hash(payload, "S1A_IW_GRDH_TEST", "2026-05-10T10:15:01Z")
    assert h1 == h2
    assert len(h1) == 64
    assert all(c in "0123456789abcdef" for c in h1)


def test_evidence_hash_changes_on_coords():
    base = {"centroid_lat": -1.234567, "centroid_lon": -72.345678}
    other = {"centroid_lat": -1.234568, "centroid_lon": -72.345678}
    assert compute_evidence_hash(base, "X", "T") != compute_evidence_hash(other, "X", "T")


def test_evidence_hash_rounds_coords():
    """Decimal noise more granular than 6 decimals must not change the hash."""
    a = {"centroid_lat": -1.2345670001, "centroid_lon": -72.3456780001}
    b = {"centroid_lat": -1.2345674999, "centroid_lon": -72.3456784999}
    assert compute_evidence_hash(a, "X", "T") == compute_evidence_hash(b, "X", "T")


def test_phone_hash_is_normalized():
    assert hash_phone("+57 315 335 0984") == hash_phone("+573153350984")
    assert hash_phone("+573153350984") == hash_phone("+57-315-335-0984")
    assert len(hash_phone("+573153350984")) == 64
