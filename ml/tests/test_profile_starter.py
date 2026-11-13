from pathlib import Path

from ml.data.profile_starter import profile_starter_data, render_markdown


ROOT = Path(__file__).parents[2]
DATASET = ROOT / "simulation" / "logistics_deliveries_synthetic.csv"


def test_profile_covers_starter_dataset() -> None:
    profile = profile_starter_data(DATASET)

    assert profile.row_count == 300
    assert profile.duplicate_pu_ids == 0
    assert all(count == 0 for count in profile.missing.values())
    assert profile.numeric["transit_hours"].count == 300
    assert profile.distance_transit_correlation is not None
    assert set(profile.by_vehicle) == {"boat", "bus", "motorcycle", "truck"}


def test_profile_report_records_synthetic_limitations() -> None:
    report = render_markdown(profile_starter_data(DATASET))

    assert "AI-01 Starter Logistics Data Profile" in report
    assert "artificial rules and randomness" in report
    assert "transit_hours" in report
