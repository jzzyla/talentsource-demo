# Validation record

- Trained all three models from the bundled CSV; 1,599 rows and 11 inputs confirmed.
- Asserted disjoint exact-feature groups across training and test partitions.
- All three Node test suites passed, including 90 browser-engine/sklearn prediction comparisons, invalid inputs, and target exclusion.
- app.js passed Node syntax checking.
- Headless Chrome verified local static loading, all 11 measurement inputs, and an initial forest prediction of 5.73.
- Changing alcohol to 12 automatically updates the forest prediction to 6.03.
- The evidence tab displayed the split counts, seed, correlations, distribution, and all three metric rows.
- At a 390px emulated mobile viewport the document width was 390px, with no horizontal overflow; the full evidence screenshot was inspected for readable, unclipped text.
- This local browser check does not establish public Pages deployment, accessibility conformance, or cross-browser support.


## Manual browser checklist

1. Run python3 -m http.server 8080; load localhost:8080 and see Models ready.
2. Switch each model and change alcohol; ridge/forest should respond, while the baseline stays constant.
3. Clear a required input: the score should clear and ask for valid measurements.
4. Enter an out-of-range measurement: see the extrapolation warning; reset clears it.
5. Switch to Data & evidence: see six score bars, 11 correlations, and three model rows.
6. Use tab navigation and arrow keys on the workspace tabs; check keyboard focus.
7. Check a narrow mobile viewport and a repository-subpath Pages deployment for overflow/missing assets.
8. Confirm the Network panel makes only static model/asset requests; no input measurements are sent to an API.
