import importlib.util

import pytest


pytestmark = pytest.mark.skipif(
    importlib.util.find_spec("sklearn") is None,
    reason="scikit-learn is required for model evaluation",
)


def test_feature_contract_has_no_leakage_fields() -> None:
    from ml.evaluation.evaluate_models import ALL_FEATURES, LEAKAGE_FIELDS

    assert not set(ALL_FEATURES) & LEAKAGE_FIELDS
