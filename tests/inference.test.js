import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {predict} from '../inference.js';
const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const models = Object.fromEntries(['baseline','ridge','forest'].map(name=>[name, read(`../models/${name}.json`)]));
test('exported browser predictions match sklearn on 90 holdout fixtures',()=>{
  for (const f of read('./parity-fixtures.json')) assert.ok(Math.abs(predict(models[f.model], f.inputs)-f.expected)<1e-9, f.model);
});
test('invalid and target-inclusive inputs are rejected',()=>{
  const good=read('./parity-fixtures.json')[0].inputs;
  for(const bad of [[],[...good,5],good.map(()=>NaN),good.map(()=>Infinity),good.map(()=> '1')]) assert.throws(()=>predict(models.forest,bad));
});
test('target is excluded and artifacts have matching feature order',()=>{
  assert.equal(models.forest.features.length,11);
  assert.ok(!models.forest.features.includes('quality'));
  for(const model of Object.values(models)) assert.deepEqual(model.features,models.forest.features);
});

test('overflowing calculations and float32 inputs are rejected',()=>{
  const extreme=Array(11).fill(Number.MAX_VALUE);
  assert.throws(()=>predict(models.ridge,extreme),RangeError);
  assert.throws(()=>predict(models.forest,extreme),RangeError);
  assert.throws(()=>predict({...models.baseline,value:Infinity},Array(11).fill(0)),RangeError);
});
