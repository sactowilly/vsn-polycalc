(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.PolycalcFormulas = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const MATERIALS = {
    LDPE: { label: 'LDPE', densityGcc: 0.92 },
    LLDPE: { label: 'LLDPE', densityGcc: 0.92 },
    MDPE: { label: 'MDPE', densityGcc: 0.93 },
    HDPE: { label: 'HDPE', densityGcc: 0.95 }
  };

  const G_PER_CC_TO_LB_PER_IN3 = 0.036127292;

  function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function round(value, digits) {
    return Number(Number(value).toFixed(digits));
  }

  function gaugeParts(input, unit) {
    const raw = toNumber(input);

    if (unit === 'decimal') {
      return { mil: raw * 1000, decimalIn: raw, microns: raw * 25400 };
    }

    if (unit === 'microns') {
      const mil = raw / 25.4;
      return { mil: mil, decimalIn: mil / 1000, microns: raw };
    }

    return { mil: raw, decimalIn: raw / 1000, microns: raw * 25.4 };
  }

  function densityGccToLbIn3(value) {
    return toNumber(value) * G_PER_CC_TO_LB_PER_IN3;
  }

  function resolveMaterial(materialKey, customDensityInput) {
    if (materialKey === 'CUSTOM') {
      const densityGcc = toNumber(customDensityInput) || 0.92;
      return {
        key: 'CUSTOM',
        label: 'Custom density',
        densityGcc: densityGcc,
        densityLbIn3: densityGccToLbIn3(densityGcc)
      };
    }

    const material = MATERIALS[materialKey] || MATERIALS.LDPE;
    return {
      key: materialKey in MATERIALS ? materialKey : 'LDPE',
      label: material.label,
      densityGcc: material.densityGcc,
      densityLbIn3: densityGccToLbIn3(material.densityGcc)
    };
  }

  function theoreticalWeight(areaIn2, thicknessIn, densityLbIn3) {
    return areaIn2 * thicknessIn * densityLbIn3;
  }

  function formatGaugeSummary(gauge) {
    return {
      mil: round(gauge.mil, 4),
      decimalIn: round(gauge.decimalIn, 6),
      microns: round(gauge.microns, 2)
    };
  }

  function makeAssumptions(material, gauge, note, extras) {
    return {
      materialLabel: material.label,
      densityGcc: round(material.densityGcc, 3),
      densityLbIn3: round(material.densityLbIn3, 6),
      gauge: formatGaugeSummary(gauge),
      note: note,
      extras: extras || []
    };
  }

  function bagsCalc(input) {
    const width = toNumber(input.width);
    const length = toNumber(input.length);
    const count = toNumber(input.count);
    const gauge = gaugeParts(input.gaugeInput, input.gaugeUnit);
    const material = resolveMaterial(input.material, input.customDensity);
    const areaIn2 = 2 * width * length;
    const weightPerItem = theoreticalWeight(areaIn2, gauge.decimalIn, material.densityLbIn3);

    return {
      title: 'Bag Weight',
      summary: 'Double-wall bag area model',
      note: 'Uses 2 x width x length x thickness x density.',
      results: [
        { label: 'Weight per item', value: round(weightPerItem, 4), unit: 'lb' },
        { label: 'Weight per 1,000', value: round(weightPerItem * 1000, 2), unit: 'lb' },
        { label: 'Weight per roll / case', value: round(weightPerItem * count, 4), unit: 'lb' },
        { label: 'Effective film area', value: round(areaIn2, 2), unit: 'in2' }
      ],
      assumptions: makeAssumptions(material, gauge, 'Theoretical bag film weight. Seals and additive packages are excluded.')
    };
  }

  function sheetingCalc(input) {
    const width = toNumber(input.width);
    const footage = toNumber(input.footage);
    const gauge = gaugeParts(input.gaugeInput, input.gaugeUnit);
    const material = resolveMaterial(input.material, input.customDensity);
    const linealInches = footage * 12;
    const areaIn2 = width * linealInches;
    const weightPerRoll = theoreticalWeight(areaIn2, gauge.decimalIn, material.densityLbIn3);
    const weightPer1000Ft = footage === 0 ? 0 : weightPerRoll * (1000 / footage);

    return {
      title: 'Sheeting Weight',
      summary: 'Single-ply roll model',
      note: 'Direct density-based result with pounds per 1,000 ft shown for legacy chart comparison.',
      results: [
        { label: 'Weight per roll', value: round(weightPerRoll, 4), unit: 'lb' },
        { label: 'Weight per 1,000 ft', value: round(weightPer1000Ft, 2), unit: 'lb' },
        { label: 'Weight per ft', value: round(weightPerRoll / Math.max(footage, 1), 4), unit: 'lb' },
        { label: 'Effective film area', value: round(areaIn2, 2), unit: 'in2' }
      ],
      assumptions: makeAssumptions(material, gauge, 'Sheeting uses a single-ply area model.', [
        { label: 'Lineal footage entered', value: round(footage, 2), unit: 'ft' }
      ])
    };
  }

  function tubingCalc(input) {
    const width = toNumber(input.width);
    const footage = toNumber(input.footage);
    const gauge = gaugeParts(input.gaugeInput, input.gaugeUnit);
    const material = resolveMaterial(input.material, input.customDensity);
    const linealInches = footage * 12;
    const areaIn2 = 2 * width * linealInches;
    const weightPerRoll = theoreticalWeight(areaIn2, gauge.decimalIn, material.densityLbIn3);
    const weightPer1000Ft = footage === 0 ? 0 : weightPerRoll * (1000 / footage);

    return {
      title: 'Tubing Weight',
      summary: 'Double-wall layflat model',
      note: 'Layflat tubing is treated as two film walls across the entered lineal footage.',
      results: [
        { label: 'Weight per roll', value: round(weightPerRoll, 4), unit: 'lb' },
        { label: 'Weight per 1,000 ft', value: round(weightPer1000Ft, 2), unit: 'lb' },
        { label: 'Weight per ft', value: round(weightPerRoll / Math.max(footage, 1), 4), unit: 'lb' },
        { label: 'Effective film area', value: round(areaIn2, 2), unit: 'in2' }
      ],
      assumptions: makeAssumptions(material, gauge, 'Tubing uses 2 x layflat width x lineal footage.', [
        { label: 'Effective width', value: round(2 * width, 2), unit: 'in' }
      ])
    };
  }

  function palletGeometry(length, width, height, overhang, slack) {
    return {
      bagWidth: length + width + slack,
      bagLength: height + (width / 2) + overhang
    };
  }

  function palletCalc(input) {
    const length = toNumber(input.length);
    const width = toNumber(input.width);
    const height = toNumber(input.height);
    const overhang = toNumber(input.overhang);
    const slack = toNumber(input.slack);
    const gauge = gaugeParts(input.gaugeInput, input.gaugeUnit);
    const material = resolveMaterial(input.material, input.customDensity);
    const geometry = palletGeometry(length, width, height, overhang, slack);
    const areaIn2 = 2 * geometry.bagWidth * geometry.bagLength;
    const weightPerItem = theoreticalWeight(areaIn2, gauge.decimalIn, material.densityLbIn3);

    return {
      title: 'Pallet Cover Weight',
      summary: 'Derived bag geometry',
      note: 'Derived bag dimensions are shown so the geometry can be sanity-checked before quoting.',
      results: [
        { label: 'Derived bag width', value: round(geometry.bagWidth, 2), unit: 'in' },
        { label: 'Derived bag length', value: round(geometry.bagLength, 2), unit: 'in' },
        { label: 'Weight per item', value: round(weightPerItem, 4), unit: 'lb' },
        { label: 'Weight per 1,000', value: round(weightPerItem * 1000, 2), unit: 'lb' }
      ],
      assumptions: makeAssumptions(material, gauge, 'Pallet cover derives bag geometry first, then applies double-wall bag area.', [
        { label: 'Seal / slack allowance', value: round(slack, 2), unit: 'in' },
        { label: 'Top overhang', value: round(overhang, 2), unit: 'in' }
      ]),
      geometry: geometry
    };
  }

  function drumGeometry(diameter, height, overhang, slack) {
    return {
      bagWidth: diameter * Math.PI + slack,
      bagLength: height + (diameter / 2) + overhang
    };
  }

  function drumCalc(input) {
    const diameter = toNumber(input.diameter);
    const height = toNumber(input.height);
    const overhang = toNumber(input.overhang);
    const slack = toNumber(input.slack);
    const gauge = gaugeParts(input.gaugeInput, input.gaugeUnit);
    const material = resolveMaterial(input.material, input.customDensity);
    const geometry = drumGeometry(diameter, height, overhang, slack);
    const areaIn2 = 2 * geometry.bagWidth * geometry.bagLength;
    const weightPerItem = theoreticalWeight(areaIn2, gauge.decimalIn, material.densityLbIn3);

    return {
      title: 'Drum Liner Weight',
      summary: 'Circumference-derived bag geometry',
      note: 'Derived bag width is based on drum circumference plus slack.',
      results: [
        { label: 'Derived bag width', value: round(geometry.bagWidth, 2), unit: 'in' },
        { label: 'Derived bag length', value: round(geometry.bagLength, 2), unit: 'in' },
        { label: 'Weight per item', value: round(weightPerItem, 4), unit: 'lb' },
        { label: 'Weight per 1,000', value: round(weightPerItem * 1000, 2), unit: 'lb' }
      ],
      assumptions: makeAssumptions(material, gauge, 'Drum liner geometry derives bag width from circumference and bag length from drum height plus radius.', [
        { label: 'Seal / slack allowance', value: round(slack, 2), unit: 'in' },
        { label: 'Top overhang', value: round(overhang, 2), unit: 'in' }
      ]),
      geometry: geometry
    };
  }

  function conversionsCalc(input) {
    const gauge = gaugeParts(input.value, input.unit);
    return {
      title: 'Gauge Conversion',
      summary: 'Thickness unit translation',
      note: 'All three thickness units are synchronized from the active field.',
      results: [
        { label: 'Microns', value: round(gauge.microns, 2), unit: 'microns' },
        { label: 'Mils', value: round(gauge.mil, 4), unit: 'mil' },
        { label: 'Decimal inches', value: round(gauge.decimalIn, 6), unit: 'in' }
      ],
      assumptions: {
        materialLabel: 'Reference only',
        densityGcc: null,
        densityLbIn3: null,
        gauge: formatGaugeSummary(gauge),
        note: '1 mil = 25.4 microns = 0.001 in.',
        extras: [
          { label: 'Microns to mils', value: 'microns / 25.4', unit: '' },
          { label: 'Mils to decimal', value: 'mils / 1000', unit: '' }
        ]
      }
    };
  }

  function generalCalc(input) {
    if (input.productType === 'sheeting') {
      return sheetingCalc(input);
    }
    if (input.productType === 'tubing') {
      return tubingCalc(input);
    }
    if (input.productType === 'pallet') {
      return palletCalc(input);
    }
    if (input.productType === 'drum') {
      return drumCalc(input);
    }
    return bagsCalc(input);
  }

  return {
    MATERIALS: MATERIALS,
    G_PER_CC_TO_LB_PER_IN3: G_PER_CC_TO_LB_PER_IN3,
    toNumber: toNumber,
    gaugeParts: gaugeParts,
    densityGccToLbIn3: densityGccToLbIn3,
    resolveMaterial: resolveMaterial,
    theoreticalWeight: theoreticalWeight,
    bagsCalc: bagsCalc,
    sheetingCalc: sheetingCalc,
    tubingCalc: tubingCalc,
    palletGeometry: palletGeometry,
    palletCalc: palletCalc,
    drumGeometry: drumGeometry,
    drumCalc: drumCalc,
    conversionsCalc: conversionsCalc,
    generalCalc: generalCalc
  };
});