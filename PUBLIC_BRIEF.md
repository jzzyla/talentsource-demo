# Challenge guide alignment

Reviewed against the supplied Talent-Source-AI-Wine-Challenge.pdf, rules version talent-wine-5.0, on November 12, 2026. Guide requirements are assessed below; timing and publication are not inferred from local implementation.

| Requirement | Implementation / evidence |
| --- | --- |
| Red-wine quality from 11 attributes; exclude target | scripts/train.py selects every CSV column except quality; inference enforces feature count and order. |
| Baseline and held-out comparison; MAE, seed, validation approach | Training mean, ridge, and forest; duplicate-grouped holdout, seed 42; metrics and split visible in Data & evidence and MODEL_CARD.md. |
| Useful audience and decision workflow | Wine analysts enter laboratory measurements and compare sensory estimates with observed validation errors. |
| Patterns, model errors, limitations | Quality distribution, signed Pearson correlations, MAE/RMSE/R² explanations, observed-range warnings, and population/causality limitations are visible. |
| Training-only preprocessing | Ridge scaler and every estimator fit only training rows; defaults are training medians. |
| Browser predictions from static exports | inference.js evaluates models/*.json locally; no backend or external API. |
| Reproducibility | Training script, pinned Python dependencies, dataset, exported models, and 90 parity fixtures are included. |
| Pages publishing | .github/workflows/pages.yml validates and packages static assets; .nojekyll included; relative URLs used. Deployment remains unverified. |
| README URL, source, training, disclosure | README.md contains registered URL, publishing instructions, training steps, and Codex/source disclosure. |
| Public repository, pushed default branch, timed creation and submission | Not established by local files. Existing solution assets predated this review; no claim of timing eligibility is made. |

Expected public URL: https://jzzyla.github.io/talentsource-demo/ . The guide explicitly describes it as derived, not a verified deployment.

The supplied guide records the official start as November 12, 2026 at 5:51:10 PM EST, the 60-minute limit as 6:51:10 PM EST, and the cutoff as 7:01:10 PM EST (push before cutoff). GitHub-recorded pushes determine submission timing; local commits do not.
