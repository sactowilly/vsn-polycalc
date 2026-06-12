(function () {
  const formulas = window.PolycalcFormulas;

  function byId(id) {
    return document.getElementById(id);
  }

  function fmt(value, digits) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return String(value);
    }
    return value.toFixed(digits);
  }

  const railButtons = Array.from(document.querySelectorAll('.product-link'));
  const panels = Array.from(document.querySelectorAll('.panel'));
  const activeResults = byId('activeResults');
  const activeAssumptions = byId('activeAssumptions');
  const resultKicker = byId('resultKicker');
  const resultTitle = byId('resultTitle');
  const standardsNote = byId('standardsNote');

  const NOTES = {
    general: 'Use General for rapid quoting comparisons. Switch to the product-specific screen when you need a tighter readout or a customer-facing explanation.',
    bags: 'Bag weight is theoretical film only. If seals, venting, or additive packages materially change weight, move to Custom density or add a quoting adjustment outside the calculator.',
    sheeting: 'Sheeting is modeled as a single-ply web. Pounds per 1,000 ft are surfaced for compatibility with traditional film yield references.',
    tubing: 'Tubing uses a double-wall layflat model. Pounds per 1,000 ft make it easy to compare against shorthand market calculators.',
    pallet: 'Derived bag dimensions are surfaced before the weight result because geometry mistakes are more common than density mistakes on pallet cover quotes.',
    drum: 'Drum liners derive bag width from circumference and bag length from height plus radius. Validate the derived dimensions against the actual liner style when quoting specialty tops.',
    conversions: 'Use conversions as a reference tool. Production weight calculations elsewhere in the app always use converted decimal-inch thickness internally.'
  };

  const panelConfigs = {
    general: {
      title: 'General Workbench',
      noteTarget: 'generalNote',
      compute: function () {
        return formulas.generalCalc({
          productType: byId('generalType').value,
          width: byId('gWidth').value,
          length: byId('gLength').value,
          height: byId('gHeight').value,
          diameter: byId('gDiameter').value,
          footage: byId('gFootage').value,
          count: byId('gCount').value,
          overhang: byId('gOverhang').value,
          slack: byId('gSlack').value,
          gaugeInput: byId('gGauge').value,
          gaugeUnit: byId('gGaugeUnit').value,
          material: byId('gMaterial').value,
          customDensity: byId('gCustomDensity').value
        });
      }
    },
    bags: {
      title: 'Bags',
      noteTarget: 'bagNote',
      compute: function () {
        return formulas.bagsCalc({
          width: byId('bWidth').value,
          length: byId('bLength').value,
          count: byId('bCount').value,
          gaugeInput: byId('bGauge').value,
          gaugeUnit: byId('bGaugeUnit').value,
          material: byId('bMaterial').value,
          customDensity: byId('bCustomDensity').value
        });
      }
    },
    sheeting: {
      title: 'Sheeting',
      noteTarget: 'sheetingNote',
      compute: function () {
        return formulas.sheetingCalc({
          width: byId('sWidth').value,
          footage: byId('sFootage').value,
          gaugeInput: byId('sGauge').value,
          gaugeUnit: byId('sGaugeUnit').value,
          material: byId('sMaterial').value,
          customDensity: byId('sCustomDensity').value
        });
      }
    },
    tubing: {
      title: 'Tubing',
      noteTarget: 'tubingNote',
      compute: function () {
        return formulas.tubingCalc({
          width: byId('tWidth').value,
          footage: byId('tFootage').value,
          gaugeInput: byId('tGauge').value,
          gaugeUnit: byId('tGaugeUnit').value,
          material: byId('tMaterial').value,
          customDensity: byId('tCustomDensity').value
        });
      }
    },
    pallet: {
      title: 'Pallet Cover',
      noteTarget: 'palletNote',
      compute: function () {
        return formulas.palletCalc({
          length: byId('pLength').value,
          width: byId('pWidth').value,
          height: byId('pHeight').value,
          overhang: byId('pOverhang').value,
          slack: byId('pSlack').value,
          gaugeInput: byId('pGauge').value,
          gaugeUnit: byId('pGaugeUnit').value,
          material: byId('pMaterial').value,
          customDensity: byId('pCustomDensity').value
        });
      }
    },
    drum: {
      title: 'Drum Liner',
      noteTarget: 'drumNote',
      compute: function () {
        return formulas.drumCalc({
          diameter: byId('dDiameter').value,
          height: byId('dHeight').value,
          overhang: byId('dOverhang').value,
          slack: byId('dSlack').value,
          gaugeInput: byId('dGauge').value,
          gaugeUnit: byId('dGaugeUnit').value,
          material: byId('dMaterial').value,
          customDensity: byId('dCustomDensity').value
        });
      }
    },
    conversions: {
      title: 'Gauge Conversions',
      noteTarget: 'conversionNote',
      compute: function (changedField) {
        const selectedUnit = changedField === 'cMicrons' ? 'microns' : changedField === 'cDecimal' ? 'decimal' : 'mil';
        const selectedValue = changedField === 'cMicrons' ? byId('cMicrons').value : changedField === 'cDecimal' ? byId('cDecimal').value : byId('cMils').value;
        return formulas.conversionsCalc({ value: selectedValue, unit: selectedUnit });
      }
    }
  };

  let activePanel = 'general';

  function setPanelNote(panelId, output) {
    const target = byId(panelConfigs[panelId].noteTarget);
    if (!target) {
      return;
    }
    target.innerHTML = '<strong>Field note</strong>' + (output.note || NOTES[panelId]);
  }

  function renderRows(container, rows, digits) {
    container.innerHTML = rows.map(function (row) {
      const value = typeof row.value === 'number' ? fmt(row.value, digits[row.label] || 4) : row.value;
      const unit = row.unit ? ' ' + row.unit : '';
      const meta = row.meta ? '<small>' + row.meta + '</small>' : '';
      return '<div class="result-row"><span>' + row.label + '</span><strong>' + value + unit + '</strong>' + meta + '</div>';
    }).join('');
  }

  function assumptionRows(output) {
    const assumptions = output.assumptions;
    const rows = [];

    rows.push('<div class="assumption-row"><span>Material assumption used</span><strong>' + assumptions.materialLabel + '</strong></div>');
    if (assumptions.densityGcc !== null) {
      rows.push('<div class="assumption-row"><span>Density</span><strong>' + fmt(assumptions.densityGcc, 3) + ' g/cm3</strong><small>' + fmt(assumptions.densityLbIn3, 6) + ' lb/in3</small></div>');
    }
    rows.push('<div class="assumption-row"><span>Gauge</span><strong>' + fmt(assumptions.gauge.mil, 4) + ' mil</strong><small>' + fmt(assumptions.gauge.decimalIn, 6) + ' in / ' + fmt(assumptions.gauge.microns, 2) + ' microns</small></div>');
    if (assumptions.extras && assumptions.extras.length) {
      assumptions.extras.forEach(function (extra) {
        const extraValue = typeof extra.value === 'number' ? fmt(extra.value, 3) : extra.value;
        const unit = extra.unit ? ' ' + extra.unit : '';
        rows.push('<div class="assumption-row"><span>' + extra.label + '</span><strong>' + extraValue + unit + '</strong></div>');
      });
    }
    rows.push('<div class="assumption-row"><span>Method note</span><strong>' + assumptions.note + '</strong></div>');

    return rows.join('');
  }

  function syncConversionInputs(output) {
    if (activePanel !== 'conversions') {
      return;
    }
    byId('cMicrons').value = fmt(output.assumptions.gauge.microns, 2);
    byId('cMils').value = fmt(output.assumptions.gauge.mil, 4);
    byId('cDecimal').value = fmt(output.assumptions.gauge.decimalIn, 6);
  }

  function renderActivePanel(changedField) {
    const output = panelConfigs[activePanel].compute(changedField);
    const digits = {
      'Weight per item': 4,
      'Weight per 1,000': 2,
      'Weight per roll / case': 4,
      'Weight per roll': 4,
      'Weight per 1,000 ft': 2,
      'Weight per ft': 4,
      'Effective film area': 2,
      'Derived bag width': 2,
      'Derived bag length': 2,
      'Microns': 2,
      'Mils': 4,
      'Decimal inches': 6
    };

    resultKicker.textContent = panelConfigs[activePanel].title;
    resultTitle.textContent = output.title;
    renderRows(activeResults, output.results, digits);
    activeAssumptions.innerHTML = assumptionRows(output);
    standardsNote.textContent = output.note;
    setPanelNote(activePanel, output);
    syncConversionInputs(output);
  }

  function switchPanel(panelId) {
    activePanel = panelId;
    railButtons.forEach(function (button) {
      button.classList.toggle('active', button.getAttribute('data-panel') === panelId);
    });
    panels.forEach(function (panel) {
      panel.classList.toggle('active', panel.id === 'panel-' + panelId);
    });
    renderActivePanel();
  }

  function bindRail() {
    railButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        switchPanel(button.getAttribute('data-panel'));
      });
    });
  }

  function bindInputs() {
    document.querySelectorAll('input, select').forEach(function (element) {
      element.addEventListener('input', function (event) {
        renderActivePanel(event.target.id);
      });
      element.addEventListener('change', function (event) {
        renderActivePanel(event.target.id);
      });
    });
  }

  function bindAdvancedToggles() {
    document.querySelectorAll('.toggle-advanced').forEach(function (button) {
      button.addEventListener('click', function () {
        const target = byId(button.getAttribute('data-target'));
        const hidden = target.hasAttribute('hidden');
        if (hidden) {
          target.removeAttribute('hidden');
        } else {
          target.setAttribute('hidden', 'hidden');
        }
        button.setAttribute('aria-expanded', hidden ? 'true' : 'false');
      });
    });
  }

  bindRail();
  bindInputs();
  bindAdvancedToggles();
  renderActivePanel();
})();