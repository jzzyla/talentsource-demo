# Vine — Wine intelligence

A complete, dependency-free static frontend with three real exported models, an analytics view, reproducible Python training, and GitHub Pages deployment. No API key, backend, build step, or runtime CDN is required.

## Run immediately

Models and the attributed dataset are included; Python ML packages are only needed for retraining.

```sh
python3 -m http.server 8080
```

Open http://localhost:8080. Do not double-click index.html: browsers restrict module and JSON fetches on file URLs.

Estimates update automatically when all 11 measurements are valid. Empty or invalid measurements clear the score until corrected.

## Compare Wines

In Prediction studio, enter a profile, optionally name it, and select **Save as Wine A**. Enter the second profile and select **Save as Wine B**, then open **Compare Wines**. The comparison uses one selected model for both profiles and shows scores, their gap, and all 11 measurement differences. Edit reloads a saved profile into the studio; save to its slot again to update it. Profiles are kept in memory for the current tab and cleared on reload.

## Drop-in options

The model selector switches between all three without retraining:

| Option | Artifact | Tradeoff |
| --- | --- | --- |
| Mean baseline | models/baseline.json | Always predicts the training mean; establishes a reference |
| Ridge regression | models/ridge.json | Small, inspectable standardized linear model |
| Random forest | models/forest.json | 60 trees, max depth 9, nonlinear interactions; larger download |

Change the default using the order/selected option in index.html. Change branding in index.html and the color variables in style.css. app.js handles the UI; inference.js is the reusable pure prediction engine. No UI framework is required.

To replace a model: modify scripts/train.py, keep the 11-feature order and matching preprocessing, regenerate assets, run the parity tests, and document the new evaluation. The exported kinds are constant, linear, and forest. Adding a new model kind requires an inference implementation and parity fixtures.

## Train and verify

Python 3.11+ and Node 20+ recommended.

```sh
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python scripts/train.py
npm test
```

The training script regenerates all models, schema/default values, descriptive statistics, validation metrics, and Python-to-JavaScript parity fixtures. Commit those generated files together. Tests compare 90 predictions against sklearn within 1e-9 and reject invalid/target-inclusive inputs.

### Recorded holdout results

| Model | MAE | RMSE | R² |
| --- | ---: | ---: | ---: |
| Mean baseline | 0.670 | 0.786 | -0.010 |
| Ridge | 0.505 | 0.630 | 0.351 |
| Random forest | 0.499 | 0.639 | 0.333 |

Lower MAE/RMSE and higher R² are better. Forest has slightly lower MAE here; ridge has lower RMSE. No universal winner is claimed. Scores are from one fixed grouped holdout, not cross-validation or a confidence interval. See MODEL_CARD.md.

## Publish on GitHub Pages

Public app URL: https://jzzyla.github.io/talentsource-demo/ (expected address from the guide; deployment has not yet been verified).

Registered repository: https://github.com/jzzyla/talentsource-demo . Default publishing branch: `main`.

1. In this repository’s **Settings → Pages**, select **GitHub Actions**.
2. Push to `main` to run `.github/workflows/pages.yml`, or run it manually in Actions. The workflow runs the inference checks, assembles `_site` from the frontend and model assets, and deploys it to Pages. No compilation or backend is required. `.nojekyll` is included.
3. Open the public URL in a fresh tab and verify model loading, all inputs, predictions, and the evidence tab. Relative paths support the `/talentsource-demo/` project path.

The challenge requires a public repository and a push before its cutoff. Local files and passing checks do not establish publication or submission timing. Repository visibility, Pages settings, the public deployment, and server-recorded submission timing require separate verification.

## Tools and source disclosure

Implemented and revised with OpenAI Codex through user prompts. This session began with an existing application and exported model assets; this documentation does not establish that all solution work was created during the official attempt. No third-party UI template is used. Training uses NumPy and scikit-learn; the frontend uses native browser APIs. Data attribution is below. The hosting workflow uses the official GitHub Actions for checkout, Node, and Pages.

## Project map

- index.html / style.css / app.js: responsive predictor and evidence view
- inference.js: framework-independent browser/Node inference
- models/: frozen JSON models and reproducibility summary
- scripts/train.py: deterministic training and export
- data/winequality-red.csv: original UCI red-wine file
- tests/: inference parity and validation checks
- .github/workflows/: automated checks and Pages publishing
- MODEL_CARD.md: methodology and limits
- PUBLIC_BRIEF.md: supplied guide requirements and implementation evidence

## Data and attribution

Cortez, P., Cerdeira, A., Almeida, F., Matos, T., & Reis, J. (2009). Wine Quality [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C56S3T

Dataset: https://archive.ics.uci.edu/dataset/186/wine+quality . Distributed under CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ . The original red-wine CSV is included unchanged; models and summary JSON are derived from it. See data/NOTICE.md. Application code is MIT licensed; this does not relicense the dataset.

## Limitations and next steps

No confidence intervals, causal explanations, external validation, or completed user research are claimed. Inputs are raw measurements, not grape varieties or brands. Out-of-range measurements are flagged; chemically implausible combinations within marginal ranges may still be accepted. Output is not clipped: linear regression can extrapolate beyond the target scale. The visual marker is bounded to the display range, while the numeric estimate remains raw.

If extending the project, use cross-validation within the training partition, keep an untouched final test set, and add stakeholder-specific workflows. Do not tune against the bundled holdout repeatedly and continue calling it unbiased.
