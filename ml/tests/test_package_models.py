import json
from pathlib import Path

from ml.models.package_models import package_models


ROOT = Path(__file__).parents[2]


def test_package_manifest_contains_both_models(tmp_path: Path) -> None:
    manifest_path = tmp_path / "model_manifest.json"
    manifest = package_models(
        ROOT / "ml" / "artifacts",
        ROOT / "ml" / "reports" / "candidate_model_evaluation.json",
        ROOT / "ml" / "reports" / "model_quality_evaluation.json",
        ROOT / "simulation" / "datasets" / "ml_batch" / "metadata.json",
        manifest_path,
    )

    assert set(manifest["models"]) == {"linear_regression", "random_forest"}
    assert manifest["feature_schema_version"] == "1.0.0"
    assert all(len(model["sha256"]) == 64 for model in manifest["models"].values())
    assert json.loads(manifest_path.read_text(encoding="utf-8"))["model_version"] == "0.1.0"
