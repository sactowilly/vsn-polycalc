(function () {
  function toNumber(value) {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function gaugeParts(input, unit) {
    const raw = toNumber(input);

    if (unit === 'decimal') {
      return { mil: raw * 1000, decimalIn: raw, microns: raw * 25400 };
    }

    if (unit === 'microns') {
      const mil = raw / 25.4;
      return { mil, decimalIn: mil / 1000, microns: raw };
    }

    return { mil: raw, decimalIn: raw / 1000, microns: raw * 25.4 };
  }

  function fmt(value, digits) {
    return Number(value).toFixed(digits);
  }

  function writeResults(target, rows) {
    target.innerHTML = rows
      .map(function (row) {
        return '<div class="result-row"><span>' + row.label + '</span><strong>' + row.value + '</strong></div>';
      })
      .join('');
  }

  function bagsCalc(width, length, gaugeInput, gaugeUnit, count) {
    const g = gaugeParts(gaugeInput, gaugeUnit);
    const perBag = (width * length * g.decimalIn) / 15;

    return {
      gaugeMil: g.mil,
      gaugeDecimalIn: g.decimalIn,
      weightPerBag: perBag,
      weightPer1000: perBag * 1000,
      weightPerRoll: perBag * count
    };
  }

  function sheetingCalc(width, footage, gaugeInput, gaugeUnit) {
    const g = gaugeParts(gaugeInput, gaugeUnit);
    const per1000 = (width * 12 * g.mil) / 30;
    return {
      gaugeMil: g.mil,
      gaugeDecimalIn: g.decimalIn,
      weightPer1000: per1000,
      weightPerFt: per1000 / 1000,
      weightPerRoll: per1000 * (footage / 1000)
    };
  }

  function tubingCalc(width, footage, gaugeInput, gaugeUnit) {
    const g = gaugeParts(gaugeInput, gaugeUnit);
    const per1000 = (width * 12 * g.mil) / 15;
    return {
      gaugeMil: g.mil,
      gaugeDecimalIn: g.decimalIn,
      weightPer1000: per1000,
      weightPerFt: per1000 / 1000,
      weightPerRoll: per1000 * (footage / 1000)
    };
  }

  function palletCalc(length, width, height, overhang, gaugeInput, gaugeUnit) {
    const g = gaugeParts(gaugeInput, gaugeUnit);
    const bagWidth = length + width + 4;
    const bagLength = height + (width / 2) + overhang;
    const perBag = (bagWidth * bagLength * g.decimalIn) / 15;

    return {
      bagWidth,
      bagLength,
      gaugeDecimalIn: g.decimalIn,
      weightPerBag: perBag,
      weightPer1000: perBag * 1000
    };
  }

  function drumCalc(diameter, height, overhang, gaugeInput, gaugeUnit) {
    const g = gaugeParts(gaugeInput, gaugeUnit);
    const bagWidth = diameter * 3.14 + 4;
    const bagLength = height + diameter + overhang;
    const perBag = (bagWidth * bagLength * g.decimalIn) / 15;

    return {
      bagWidth,
      bagLength,
      gaugeDecimalIn: g.decimalIn,
      weightPerBag: perBag,
      weightPer1000: perBag * 1000
    };
  }

  function renderBags() {
    const result = bagsCalc(
      toNumber(document.getElementById('bWidth').value),
      toNumber(document.getElementById('bLength').value),
      document.getElementById('bGauge').value,
      document.getElementById('bGaugeUnit').value,
      toNumber(document.getElementById('bCount').value)
    );

    writeResults(document.getElementById('bagResults'), [
      { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
      { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
      { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
      { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) },
      { label: 'Weight per roll/case (lb)', value: fmt(result.weightPerRoll, 4) }
    ]);
  }

  function renderSheeting() {
    const result = sheetingCalc(
      toNumber(document.getElementById('sWidth').value),
      toNumber(document.getElementById('sFootage').value),
      document.getElementById('sGauge').value,
      document.getElementById('sGaugeUnit').value
    );

    writeResults(document.getElementById('sheetingResults'), [
      { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
      { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
      { label: 'Weight per 1,000 ft (lb)', value: fmt(result.weightPer1000, 4) },
      { label: 'Weight per ft (lb)', value: fmt(result.weightPerFt, 4) },
      { label: 'Weight per roll (lb)', value: fmt(result.weightPerRoll, 4) }
    ]);
  }

  function renderTubing() {
    const result = tubingCalc(
      toNumber(document.getElementById('tWidth').value),
      toNumber(document.getElementById('tFootage').value),
      document.getElementById('tGauge').value,
      document.getElementById('tGaugeUnit').value
    );

    writeResults(document.getElementById('tubingResults'), [
      { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
      { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
      { label: 'Weight per 1,000 ft (lb)', value: fmt(result.weightPer1000, 4) },
      { label: 'Weight per ft (lb)', value: fmt(result.weightPerFt, 4) },
      { label: 'Weight per roll (lb)', value: fmt(result.weightPerRoll, 4) }
    ]);
  }

  function renderPallet() {
    const result = palletCalc(
      toNumber(document.getElementById('pLength').value),
      toNumber(document.getElementById('pWidth').value),
      toNumber(document.getElementById('pHeight').value),
      toNumber(document.getElementById('pOverhang').value),
      document.getElementById('pGauge').value,
      document.getElementById('pGaugeUnit').value
    );

    writeResults(document.getElementById('palletResults'), [
      { label: 'Bag width (in)', value: fmt(result.bagWidth, 2) },
      { label: 'Bag length (in)', value: fmt(result.bagLength, 2) },
      { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
      { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
      { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) }
    ]);
  }

  function renderDrum() {
    const result = drumCalc(
      toNumber(document.getElementById('dDiameter').value),
      toNumber(document.getElementById('dHeight').value),
      toNumber(document.getElementById('dOverhang').value),
      document.getElementById('dGauge').value,
      document.getElementById('dGaugeUnit').value
    );

    writeResults(document.getElementById('drumResults'), [
      { label: 'Bag width (in)', value: fmt(result.bagWidth, 2) },
      { label: 'Bag length (in)', value: fmt(result.bagLength, 2) },
      { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
      { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
      { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) }
    ]);
  }

  function renderConversions(changedField) {
    const micronsInput = document.getElementById('cMicrons');
    const milsInput = document.getElementById('cMils');
    const decimalInput = document.getElementById('cDecimal');

    let gauge;

    if (changedField === 'microns') {
      gauge = gaugeParts(micronsInput.value, 'microns');
      milsInput.value = fmt(gauge.mil, 4);
      decimalInput.value = fmt(gauge.decimalIn, 6);
    } else if (changedField === 'decimal') {
      gauge = gaugeParts(decimalInput.value, 'decimal');
      milsInput.value = fmt(gauge.mil, 4);
      micronsInput.value = fmt(gauge.microns, 2);
    } else if (changedField === 'mils') {
      gauge = gaugeParts(milsInput.value, 'mil');
      micronsInput.value = fmt(gauge.microns, 2);
      decimalInput.value = fmt(gauge.decimalIn, 6);
    } else {
      gauge = gaugeParts(milsInput.value, 'mil');
    }

    writeResults(document.getElementById('conversionResults'), [
      { label: 'Microns → mils', value: 'mils = microns ÷ 25.4' },
      { label: 'Mils → microns', value: 'microns = mils × 25.4' },
      { label: 'Mils → decimal inches', value: 'decimal in = mils ÷ 1000' },
      { label: 'Decimal inches → mils', value: 'mils = decimal in × 1000' }
    ]);
  }

  function renderGeneral() {
    const type = document.getElementById('generalType').value;
    const gaugeInput = document.getElementById('gGauge').value;
    const gaugeUnit = document.getElementById('gGaugeUnit').value;

    const width = toNumber(document.getElementById('gWidth').value);
    const length = toNumber(document.getElementById('gLength').value);
    const height = toNumber(document.getElementById('gHeight').value);
    const diameter = toNumber(document.getElementById('gDiameter').value);
    const footage = toNumber(document.getElementById('gFootage').value);
    const count = toNumber(document.getElementById('gCount').value);
    const overhang = toNumber(document.getElementById('gOverhang').value);

    let rows = [];

    if (type === 'sheeting') {
      const result = sheetingCalc(width, footage, gaugeInput, gaugeUnit);
      rows = [
        { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
        { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
        { label: 'Weight per 1,000 ft (lb)', value: fmt(result.weightPer1000, 4) },
        { label: 'Weight per roll (lb)', value: fmt(result.weightPerRoll, 4) }
      ];
    } else if (type === 'tubing') {
      const result = tubingCalc(width, footage, gaugeInput, gaugeUnit);
      rows = [
        { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
        { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
        { label: 'Weight per 1,000 ft (lb)', value: fmt(result.weightPer1000, 4) },
        { label: 'Weight per roll (lb)', value: fmt(result.weightPerRoll, 4) }
      ];
    } else if (type === 'pallet') {
      const result = palletCalc(length, width, height, overhang, gaugeInput, gaugeUnit);
      rows = [
        { label: 'Bag width (in)', value: fmt(result.bagWidth, 2) },
        { label: 'Bag length (in)', value: fmt(result.bagLength, 2) },
        { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
        { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) }
      ];
    } else if (type === 'drum') {
      const result = drumCalc(diameter, height, overhang, gaugeInput, gaugeUnit);
      rows = [
        { label: 'Bag width (in)', value: fmt(result.bagWidth, 2) },
        { label: 'Bag length (in)', value: fmt(result.bagLength, 2) },
        { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
        { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) }
      ];
    } else {
      const result = bagsCalc(width, length, gaugeInput, gaugeUnit, count);
      rows = [
        { label: 'Gauge (mil)', value: fmt(result.gaugeMil, 4) },
        { label: 'Gauge (decimal in)', value: fmt(result.gaugeDecimalIn, 6) },
        { label: 'Weight per bag (lb)', value: fmt(result.weightPerBag, 4) },
        { label: 'Weight per 1,000 bags (lb)', value: fmt(result.weightPer1000, 4) },
        { label: 'Weight per roll/case (lb)', value: fmt(result.weightPerRoll, 4) }
      ];
    }

    writeResults(document.getElementById('generalResults'), rows);
  }

  function initTabs() {
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        const tabId = tab.getAttribute('data-tab');

        tabs.forEach(function (item) {
          item.classList.remove('active');
        });
        panels.forEach(function (panel) {
          panel.classList.remove('active');
        });

        tab.classList.add('active');
        document.getElementById('panel-' + tabId).classList.add('active');
      });
    });
  }

  function bindLiveUpdates() {
    document.querySelectorAll('input, select').forEach(function (element) {
      element.addEventListener('input', function (event) {
        const id = event.target.id;

        renderGeneral();
        renderBags();
        renderSheeting();
        renderTubing();
        renderPallet();
        renderDrum();

        if (id === 'cMicrons') {
          renderConversions('microns');
        } else if (id === 'cDecimal') {
          renderConversions('decimal');
        } else if (id === 'cMils') {
          renderConversions('mils');
        }
      });
    });
  }

  initTabs();
  bindLiveUpdates();
  renderGeneral();
  renderBags();
  renderSheeting();
  renderTubing();
  renderPallet();
  renderDrum();
  renderConversions('mils');
})();
