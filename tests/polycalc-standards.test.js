const assert = require('node:assert/strict');
const formulas = require('../js/formulas.js');

function approx(actual, expected, tolerance, label) {
  const delta = Math.abs(actual - expected);
  assert.ok(delta <= tolerance, `${label}: expected ${expected}, got ${actual}, delta ${delta}`);
}

function resultValue(output, label) {
  return output.results.find((row) => row.label === label).value;
}

function poundsPerMsf(widthIn, footageFt, totalWeightLb) {
  const areaSquareFeet = (widthIn / 12) * footageFt;
  return totalWeightLb / (areaSquareFeet / 1000);
}

const gauge = formulas.gaugeParts(1, 'mil');
approx(gauge.decimalIn, 0.001, 1e-12, '1 mil to decimal inches');
approx(gauge.microns, 25.4, 1e-12, '1 mil to microns');

const roundTrip = formulas.gaugeParts(gauge.microns, 'microns');
approx(roundTrip.mil, 1, 1e-12, 'micron round-trip to mil');

const density = formulas.densityGccToLbIn3(0.92);
approx(density, 0.03323710864, 1e-10, '0.920 g/cm3 to lb/in3');

const bag = formulas.bagsCalc({
  width: 38,
  length: 64,
  count: 100,
  gaugeInput: 3,
  gaugeUnit: 'mil',
  material: 'LDPE',
  customDensity: 0.92
});
approx(resultValue(bag, 'Weight per item'), 0.484996, 0.00001, 'bag density-based sample');

const sheeting = formulas.sheetingCalc({
  width: 144,
  footage: 400,
  gaugeInput: 1,
  gaugeUnit: 'mil',
  material: 'LDPE',
  customDensity: 0.92
});
approx(resultValue(sheeting, 'Weight per roll'), 22.9735, 0.0002, 'sheeting roll weight');
approx(poundsPerMsf(144, 400, resultValue(sheeting, 'Weight per roll')), 4.7861, 0.02, 'sheeting lb/MSF vs LDPE yield tables');

const tubing = formulas.tubingCalc({
  width: 17.375,
  footage: 1000,
  gaugeInput: 4.5,
  gaugeUnit: 'mil',
  material: 'LDPE',
  customDensity: 0.92
});
approx(resultValue(tubing, 'Weight per 1,000 ft'), 62.37, 0.05, 'tubing density-based sample');
approx(resultValue(tubing, 'Weight per 1,000 ft'), 62.55, 0.25, 'tubing shorthand comparison');

const palletGeometry = formulas.palletGeometry(48, 40, 60, 6, 4);
assert.equal(palletGeometry.bagWidth, 92, 'pallet bag width');
assert.equal(palletGeometry.bagLength, 86, 'pallet bag length');

const drumGeometry = formulas.drumGeometry(24, 40, 6, 4);
approx(drumGeometry.bagWidth, 79.3982236862, 1e-9, 'drum bag width');
assert.equal(drumGeometry.bagLength, 58, 'drum bag length');

const conversion = formulas.conversionsCalc({ value: 0.001, unit: 'decimal' });
approx(resultValue(conversion, 'Mils'), 1, 1e-12, 'decimal to mil');

console.log('polycalc standards tests: ok');