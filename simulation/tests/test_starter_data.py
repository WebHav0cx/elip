from pathlib import Path

from simulation.adapters.starter_data import validate_starter_data


STARTER_DATA_DIRECTORY = Path(__file__).parents[1]


def test_repository_starter_data_is_valid() -> None:
    report = validate_starter_data(STARTER_DATA_DIRECTORY)

    assert report.valid, report.errors
    assert report.rows_checked["polling_units_synthetic.csv"] == 900
    assert report.rows_checked["logistics_deliveries_synthetic.csv"] == 300
    assert report.rows_checked["incident_reports_synthetic.csv"] == 400
