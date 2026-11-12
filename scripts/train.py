"""Train frozen models on a reproducible, duplicate-grouped holdout split."""
import csv
import hashlib
import json
from pathlib import Path

import numpy as np
import sklearn
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / 'data/winequality-red.csv').read_bytes()
with (ROOT / 'data/winequality-red.csv').open() as f:
    reader = csv.DictReader(f, delimiter=';')
    names = [n for n in reader.fieldnames if n != 'quality']
    rows = list(reader)
X = np.array([[float(row[n]) for n in names] for row in rows])
y = np.array([float(row['quality']) for row in rows])
# Identical feature vectors remain together: no duplicate rows across train/test.
_, groups = np.unique(X, axis=0, return_inverse=True)
train, test = next(GroupShuffleSplit(n_splits=1, test_size=.2, random_state=42).split(X, y, groups))
assert not set(groups[train]) & set(groups[test])
estimators = {
    'baseline': DummyRegressor(strategy='mean'),
    'ridge': make_pipeline(StandardScaler(), Ridge(alpha=10)),
    'forest': RandomForestRegressor(n_estimators=60, max_depth=9, min_samples_leaf=3, random_state=42, n_jobs=1),
}
metrics = {}
fixtures = []
for name, estimator in estimators.items():
    estimator.fit(X[train], y[train])
    pred = estimator.predict(X[test])
    metrics[name] = dict(mae=mean_absolute_error(y[test], pred), rmse=float(np.sqrt(mean_squared_error(y[test], pred))), r2=r2_score(y[test], pred))
    if name == 'baseline':
        artifact = dict(kind='constant', value=float(estimator.constant_[0, 0]))
    elif name == 'ridge':
        scaler, ridge = estimator.steps[0][1], estimator.steps[1][1]
        artifact = dict(kind='linear', mean=scaler.mean_.tolist(), scale=scaler.scale_.tolist(), coefficients=ridge.coef_.tolist(), intercept=float(ridge.intercept_))
    else:
        trees = []
        for fitted in estimator.estimators_:
            t = fitted.tree_
            trees.append(dict(left=t.children_left.tolist(), right=t.children_right.tolist(), feature=t.feature.tolist(), threshold=t.threshold.tolist(), value=t.value[:, 0, 0].tolist()))
        artifact = dict(kind='forest', trees=trees)
    artifact.update(features=names, name=name, version=1)
    (ROOT / f'models/{name}.json').write_text(json.dumps(artifact, separators=(',', ':'), allow_nan=False) + '\n')
    for i, prediction in zip(test[:30], pred[:30]):
        fixtures.append(dict(model=name, inputs=X[i].tolist(), expected=float(prediction)))

schema = [dict(name=n, min=float(X[:, i].min()), max=float(X[:, i].max()), default=float(np.median(X[train, i]))) for i, n in enumerate(names)]
counts = {str(int(v)): int(sum(y == v)) for v in np.unique(y)}
correlations = [dict(name=n, correlation=float(np.corrcoef(X[:, i], y)[0, 1])) for i, n in enumerate(names)]
summary = dict(samples=len(y), features=len(names), train=len(train), test=len(test), uniqueGroups=len(set(groups)), split='GroupShuffleSplit, 20% of unique feature groups, seed 42', seed=42, sklearn=sklearn.__version__, sha256=hashlib.sha256(raw).hexdigest(), metrics=metrics, distribution=counts, correlations=sorted(correlations, key=lambda d: abs(d['correlation']), reverse=True), schema=schema)
(ROOT / 'models/summary.json').write_text(json.dumps(summary, indent=2) + '\n')
(ROOT / 'tests/parity-fixtures.json').write_text(json.dumps(fixtures) + '\n')
print(json.dumps({k:v for k,v in summary.items() if k not in ['schema','correlations']}, indent=2))
