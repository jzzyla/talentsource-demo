# Model card

## Intended use
Predict sensory red-wine quality scores from physicochemical measurements. Not a safety, health, purchasing, or causal optimization tool. The target is an ordinal sensory rating, treated here as continuous regression. The dataset describes Portuguese Vinho Verde wines and should not be assumed representative of other regions or wine styles.

## Provenance and feature order
Original UCI winequality-red.csv: 1,599 rows. SHA-256: 4a402cf041b025d4566d954c3b9ba8635a3a8a01e039005d97d6a710278cf05e.

Inputs, in order: fixed acidity; volatile acidity; citric acid; residual sugar; chlorides; free sulfur dioxide; total sulfur dioxide; density; pH; sulphates; alcohol. The quality target is excluded. Input labels mirror the source; units and reporting bases follow Table 1 of Cortez et al. (2009), linked in the interface. Per-litre labels are equivalent to per-dm³ units; input values are not rescaled.

## Evaluation
Identical feature vectors are grouped before splitting. GroupShuffleSplit with seed 42 holds out 20% of the 1,359 unique feature groups, yielding 1,270 training and 329 test rows. Group sizes differ, so 20% of groups is not exactly 20% of rows. This prevents exact duplicate feature vectors leaking across the split. No claim is made about unknown vineyard/batch relationships.

All preprocessing and fitting use training data only. A training-mean baseline, StandardScaler + Ridge(alpha=10), and a 60-tree RandomForestRegressor(max_depth=9, min_samples_leaf=3, random_state=42) are fitted. Parameters are fixed, not selected by searching the holdout. Models are not refitted on the full dataset. Metrics in models/summary.json evaluate the exact deployed models.

The inference engine reproduces sklearn's float32 tree inputs, threshold traversal, leaf averaging, and ridge standardization. Ninety held-out fixtures check the export. The results do not prove prediction performance outside this sample or cover every possible input.

## Descriptive analytics
The distribution and Pearson correlations use the full dataset for description only. They are not evidence of causation, model feature importance, or holdout performance. Input observed ranges use all rows; defaults are training medians. These full-data display statistics do not enter model fitting.

## Uncertainty and limits
Labels are imbalanced; scores 5 and 6 dominate, and extreme-score examples are scarce. A single split is noisy. MAE and RMSE are aggregate errors, not individual prediction intervals. Negative baseline R² is possible because the training mean differs from the test mean. Small differences between models should not be overinterpreted.

No missing data occurs in the bundled file. The UI rejects missing/non-finite values, clears predictions on numeric overflow, warns on marginal out-of-range inputs, and leaves out-of-distribution combination detection as future work. It does not provide a calibrated probability or confidence percentage. Per-feature correlations do not support changing one chemical input to improve a real wine.
