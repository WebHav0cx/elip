import importlib.util

import pytest


pytestmark = pytest.mark.skipif(
    importlib.util.find_spec("sklearn") is None,
    reason="scikit-learn is required for candidate model training",
)


def test_candidate_training_module_imports() -> None:
    from ml.models.train_candidates import ALL_FEATURES, CATEGORICAL_FEATURES, NUMERIC_FEATURES

    assert set(NUMERIC_FEATURES).isdisjoint(CATEGORICAL_FEATURES)
    assert set(ALL_FEATURES) == set(NUMERIC_FEATURES) | set(CATEGORICAL_FEATURES)
