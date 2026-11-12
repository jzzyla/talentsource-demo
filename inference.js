function finitePrediction(value) {
  if (!Number.isFinite(value)) throw new RangeError('Measurements are too large to calculate a reliable estimate. Check the values and units.');
  return value;
}

export function predict(model, inputs) {
  if (!Array.isArray(inputs) || inputs.length !== model.features.length || inputs.some(v => typeof v !== 'number' || !Number.isFinite(v))) {
    throw new Error(`Supply ${model.features.length} finite numeric inputs in the documented feature order.`);
  }
  if (model.kind === 'constant') return finitePrediction(model.value);
  if (model.kind === 'linear') return finitePrediction(model.intercept + inputs.reduce((sum, v, i) => sum + ((v - model.mean[i]) / model.scale[i]) * model.coefficients[i], 0));
  if (model.kind === 'forest') {
    // sklearn trees cast inputs to float32 before traversing.
    const x = inputs.map(Math.fround);
    if (x.some(v => !Number.isFinite(v))) throw new RangeError('Measurements are too large to calculate a reliable estimate. Check the values and units.');
    return finitePrediction(model.trees.reduce((sum, tree) => {
      let node = 0;
      while (tree.left[node] !== -1) node = x[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
      return sum + tree.value[node];
    }, 0) / model.trees.length);
  }
  throw new Error('Unsupported model kind.');
}
