# Epic 5 ML workflow

Install the ML dependencies from the simulation environment:

```powershell
python -m pip install -e ".\simulation"
```

Build and validate the consolidated dataset:

```powershell
python -m ml.data.build_training_dataset
python -m ml.data.validate_ml_dataset
```

Train the candidate models:

```powershell
python -m ml.models.train_candidates
```

This trains Linear Regression and Random Forest using only `development` exercises. It evaluates both models on validation, test, and held-out disruption exercises, writes metrics to `ml/reports/candidate_model_evaluation.json`, and writes model artifacts to `ml/artifacts/`.

Package both selected models with reproducibility metadata:

```powershell
python -m ml.models.package_models
```

The manifest records model versions, feature-schema version, dataset provenance, metrics, artifact hashes, and intended use.
