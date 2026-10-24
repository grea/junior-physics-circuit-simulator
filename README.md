const state = {
  preset: 'series',
  batteryVoltage: 9,
  bulbResistance: 12,
  switchClosed: true,
};

const els = {
  batteryVoltage: document.getElementById('batteryVoltage'),
  bulbResistance: document.getElementById('bulbResistance'),
  switchClosed: document.getElementById('switchClosed'),
  batteryVoltageValue: document.getElementById('batteryVoltageValue'),
  bulbResistanceValue: document.getElementById('bulbResistanceValue'),
  currentReading: document.getElementById('currentReading'),
  powerReading: document.getElementById('powerReading'),
  brightnessReading: document.getElementById('brightnessReading'),
  resistanceReading: document.getElementById('resistanceReading'),
  physicalSvg: document.getElementById('physicalSvg'),
  schematicSvg: document.getElementById('schematicSvg'),
  physicalLabel: document.getElementById('physicalLabel'),
  schematicLabel: document.getElementById('schematicLabel'),
  buttons: Array.from(document.querySelectorAll('.preset-btn')),
};

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const A = matrix.map((row) => [...row]);
  const b = [...vector];

  for (let i = 0; i < n; i += 1) {
    let pivotRow = i;
    let maxValue = Math.abs(A[i][i] || 0);

    for (let r = i + 1; r < n; r += 1) {
      const v = Math.abs(A[r][i] || 0);
      if (v > maxValue) {
        maxValue = v;
        pivotRow = r;
      }
    }

    if (Math.abs(A[pivotRow][i] || 0) < 1e-12) {
      throw new Error('矩阵奇异，无法求解该电路。');
    }

    if (pivotRow !== i) {
      [A[i], A[pivotRow]] = [A[pivotRow], A[i]];
      [b[i], b[pivotRow]] = [b[pivotRow], b[i]];
    }

    const pivot = A[i][i];
    for (let j = i; j < n; j += 1) {
      A[i][j] /= pivot;
    }
    b[i] /= pivot;

    for (let r = 0; r < n; r += 1) {
      if (r === i) continue;
      const factor = A[r][i];
      if (Math.abs(factor) < 1e-12) continue;
      for (let j = i; j < n; j += 1) {
        A[r][j] -= factor * A[i][j];
      }
      b[r] -= factor * b[i];
    }
  }

  return b;
}

function createCircuit(preset, batteryVoltage, bulbResistance, switchClosed) {
  if (!switchClosed) {
    return {
      open: true,
      label: preset === 'series' ? '串联电路（开路）' : preset === 'parallel' ? '并联电路（开路）' : '混合电路（开路）',
      totalResistance: Infinity,
      totalCurrent: 0,
      totalPower: 0,
      brightness: 0,
      nodeVoltages: { g: 0 },
      branchCurrents: [],
      sourceCurrent: 0,
    };
  }

  const sourceValue = batteryVoltage;
  let nodeList = ['g'];
  let voltageSources = [];
  let resistors = [];

  if (preset === 'series') {
    nodeList = ['n1', 'n2', 'g'];
    voltageSources.push({ a: 'n1', b: 'g', value: sourceValue });
    resistors.push(
      { name: '灯泡1', a: 'n1', b: 'n2', r: bulbResistance },
      { name: '灯泡2', a: 'n2', b: 'g', r: bulbResistance },
    );
  } else if (preset === 'parallel') {
    nodeList = ['n1', 'g'];
    voltageSources.push({ a: 'n1', b: 'g', value: sourceValue });
    resistors.push(
      { name: '灯泡A', a: 'n1', b: 'g', r: bulbResistance },
      { name: '灯泡B', a: 'n1', b: 'g', r: bulbResistance },
    );
  } else {
    nodeList = ['n1', 'n2', 'g'];
    voltageSources.push({ a: 'n1', b: 'g', value: sourceValue });
    resistors.push(
      { name: '灯泡A', a: 'n1', b: 'n2', r: bulbResistance },
      { name: '灯泡B', a: 'n2', b: 'g', r: bulbResistance },
      { name: '灯泡C', a: 'n1', b: 'g', r: bulbResistance * 2 },
    );
  }

  const nodes = nodeList.filter((n) => n !== 'g');
  const nodeIndex = new Map(nodes.map((node, idx) => [node, idx]));
  const size = nodes.length + voltageSources.length;
  const A = Array.from({ length: size }, () => Array(size).fill(0));
  const z = Array(size).fill(0);

  for (const res of resistors) {
    const aIndex = nodeIndex.get(res.a);
    const bIndex = nodeIndex.get(res.b);
    const g = 1 / res.r;

    if (aIndex !== undefined && bIndex !== undefined) {
      A[aIndex][aIndex] += g;
      A[bIndex][bIndex] += g;
      A[aIndex][bIndex] -= g;
      A[bIndex][aIndex] -= g;
    } else if (aIndex !== undefined) {
      A[aIndex][aIndex] += g;
    } else if (bIndex !== undefined) {
      A[bIndex][bIndex] += g;
    }
  }

  voltageSources.forEach((src, idx) => {
    const row = nodes.length + idx;
    const aIndex = nodeIndex.get(src.a);
    const bIndex = nodeIndex.get(src.b);

    if (aIndex !== undefined) {
      A[aIndex][row] += 1;
      A[row][aIndex] += 1;
    }
    if (bIndex !== undefined) {
      A[bIndex][row] -= 1;
      A[row][bIndex] -= 1;
    }
    z[row] = src.value;
  });

  const x = solveLinearSystem(A, z);
  const nodeVoltages = Object.fromEntries(nodes.map((node, idx) => [node, x[idx] ?? 0]));
  const branchCurrents = resistors.map((res) => {
    const aV = res.a === 'g' ? 0 : (nodeVoltages[res.a] ?? 0);
    const bV = res.b === 'g' ? 0 : (nodeVoltages[res.b] ?? 0);
    const current = (aV - bV) / res.r;
    return {
      ...res,
      current,
      voltageDrop: aV - bV,
    };
  });

  const sourceCurrent = voltageSources.reduce((sum, src, idx) => {
    const sourceFlow = x[nodes.length + idx] ?? 0;
    return sum + sourceFlow;
  }, 0);

  const totalResistance = Math.abs(sourceValue / (sourceCurrent || 1e-9));
  const totalCurrent = Math.abs(sourceCurrent);
  const totalPower = sourceValue * totalCurrent;

  const brightness = (() => {
    const reference = sourceValue / Math.max(bulbResistance, 1);
    const currentRatio = totalCurrent / Math.max(reference, 1e-6);
    return Math.min(100, Math.max(0, currentRatio * 100));
  })();

  return {
    open: false,
    label: preset === 'series' ? '串联电路' : preset === 'parallel' ? '并联电路' : '混合电路',
    totalResistance,
    totalCurrent,
    totalPower,
    brightness,
    nodeVoltages,
    branchCurrents,
    sourceCurrent,
  };
}

function updateReadings() {
  const result = createCircuit(state.preset, state.batteryVoltage, state.bulbResistance, state.switchClosed);

  const currentText = result.open ? '0.00 A' : `${formatNumber(result.totalCurrent, 2)} A`;
  const powerText = result.open ? '0.00 W' : `${formatNumber(result.totalPower, 2)} W`;
  const brightnessText = result.open ? '0%' : `${Math.round(result.brightness)}%`;
  const resistanceText = result.open ? '∞ Ω' : `${formatNumber(result.totalResistance, 2)} Ω`;

  els.currentReading.textContent = currentText;
  els.powerReading.textContent = powerText;
  els.brightnessReading.textContent = brightnessText;
  els.resistanceReading.textContent = resistanceText;

  const physicalStatus = result.open ? `${state.preset === 'series' ? '串联电路' : state.preset === 'parallel' ? '并联电路' : '混合电路'}（开路）` : result.label;
  els.physicalLabel.textContent = physicalStatus;
  els.schematicLabel.textContent = physicalStatus;

  renderPhysicalDiagram(result, state);
  renderSchematicDiagram(result, state);
}

function setPreset(nextPreset) {
  state.preset = nextPreset;
  els.buttons.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.preset === nextPreset);
  });
  updateReadings();
}

function line(x1, y1, x2, y2, color = '#dfe9f8', strokeWidth = 4) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" />`;
}

function bulb(x, y, active, label) {
  const glow = active ? '#ffd76a' : '#8ba3bd';
  const outer = active ? '#ffe38b' : '#c4d0df';
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="18" fill="${glow}" opacity="${active ? 0.45 : 0.1}" />
      <circle cx="${x}" cy="${y}" r="12" fill="${outer}" stroke="#f7f3d8" stroke-width="2" />
      <path d="M ${x - 8} ${y + 22} L ${x} ${y + 34} L ${x + 8} ${y + 22}" stroke="#dfe9f8" stroke-width="3" fill="none" />
      <text x="${x}" y="${y + 48}" text-anchor="middle" fill="#eaf5ff" font-size="10">${label}</text>
    </g>
  `;
}

function battery(x, y, voltage, active) {
  const color = active ? '#86efac' : '#bfcfe6';
  return `
    <g>
      <rect x="${x}" y="${y - 30}" width="18" height="60" fill="none" stroke="#dfe9f8" stroke-width="3" rx="4" />
      <line x1="${x + 18}" y1="${y - 14}" x2="${x + 18}" y2="${y + 14}" stroke="${color}" stroke-width="4" />
      <line x1="${x + 26}" y1="${y - 22}" x2="${x + 26}" y2="${y + 22}" stroke="${color}" stroke-width="4" />
      <text x="${x + 46}" y="${y + 4}" fill="#eaf5ff" font-size="12">${voltage} V</text>
    </g>
  `;
}

function switchSymbol(x, y, openState) {
  const onX = openState ? x + 18 : x + 28;
  const gap = openState ? 22 : 0;
  return `
    <g>
      <circle cx="${x}" cy="${y}" r="5" fill="#dfe9f8" />
      <circle cx="${x + 44}" cy="${y}" r="5" fill="#dfe9f8" />
      <line x1="${x + 5}" y1="${y}" x2="${x + 20}" y2="${y}" stroke="#dfe9f8" stroke-width="3" />
      <line x1="${x + 20}" y1="${y}" x2="${onX}" y2="${y + (openState ? -10 : 0)}" stroke="#dfe9f8" stroke-width="3" />
      <line x1="${x + 28}" y1="${y}" x2="${x + 40}" y2="${y}" stroke="#dfe9f8" stroke-width="3" />
      <text x="${x + 22}" y="${y - 18}" fill="#eaf5ff" font-size="11">${openState ? '开' : '合'}</text>
    </g>
  `;
}

function renderPhysicalDiagram(result, settings) {
  const svg = els.physicalSvg;
  const active = !result.open;
  const v = settings.batteryVoltage;

  if (settings.preset === 'series') {
    svg.innerHTML = `
      ${line(40, 120, 90, 120)}
      ${battery(90, 120, v, active)}
      ${line(140, 120, 210, 120)}
      ${switchSymbol(200, 120, !settings.switchClosed)}
      ${line(260, 120, 310, 120)}
      ${bulb(350, 120, active, 'L1')}
      ${line(390, 120, 470, 120)}
      ${bulb(510, 120, active, 'L2')}
      ${line(550, 120, 590, 120)}
      ${line(590, 120, 590, 165, '#8fb4da', 2)}
      ${line(40, 120, 40, 175, '#8fb4da', 2)}
      ${line(40, 175, 590, 175, '#8fb4da', 2)}
      ${line(590, 175, 590, 120, '#8fb4da', 2)}
    `;
    return;
  }

  if (settings.preset === 'parallel') {
    svg.innerHTML = `
      ${line(40, 120, 90, 120)}
      ${battery(90, 120, v, active)}
      ${line(140, 120, 220, 120)}
      ${switchSymbol(220, 120, !settings.switchClosed)}
      ${line(275, 120, 330, 120)}
      ${line(330, 120, 330, 80)}
      ${line(330, 80, 440, 80)}
      ${bulb(440, 80, active, 'L1')}
      ${line(470, 80, 540, 80)}
      ${line(540, 80, 540, 120)}
      ${line(330, 120, 330, 160)}
      ${line(330, 160, 440, 160)}
      ${bulb(440, 160, active, 'L2')}
      ${line(470, 160, 540, 160)}
      ${line(540, 160, 540, 120)}
      ${line(540, 120, 590, 120)}
      ${line(40, 120, 40, 180, '#8fb4da', 2)}
      ${line(40, 180, 590, 180, '#8fb4da', 2)}
      ${line(590, 180, 590, 120, '#8fb4da', 2)}
    `;
    return;
  }

  svg.innerHTML = `
    ${line(40, 120, 90, 120)}
    ${battery(90, 120, v, active)}
    ${line(140, 120, 220, 120)}
    ${switchSymbol(220, 120, !settings.switchClosed)}
    ${line(275, 120, 330, 120)}
    ${line(330, 120, 330, 90)}
    ${bulb(390, 90, active, 'L1')}
    ${line(420, 90, 500, 90)}
    ${line(500, 90, 500, 120)}
    ${line(330, 120, 330, 150)}
    ${bulb(390, 150, active, 'L2')}
    ${line(420, 150, 500, 150)}
    ${line(500, 150, 500, 120)}
    ${line(500, 120, 590, 120)}
    ${line(330, 120, 330, 60)}
    ${line(330, 60, 495, 60)}
    ${bulb(495, 60, active, 'L3')}
    ${line(525, 60, 590, 60)}
    ${line(590, 60, 590, 120)}
    ${line(40, 120, 40, 175, '#8fb4da', 2)}
    ${line(40, 175, 590, 175, '#8fb4da', 2)}
    ${line(590, 175, 590, 120, '#8fb4da', 2)}
  `;
}

function renderSchematicDiagram(result, settings) {
  const svg = els.schematicSvg;
  const active = !result.open;
  const wire = '#dfe9f8';

  if (settings.preset === 'series') {
    svg.innerHTML = `
      ${line(60, 120, 130, 120, wire, 3)}
      ${battery(130, 120, settings.batteryVoltage, active)}
      ${line(180, 120, 230, 120, wire, 3)}
      ${line(230, 120, 230, 80, wire, 3)}
      ${bulb(280, 80, active, 'R1')}
      ${line(320, 80, 400, 80, wire, 3)}
      ${line(400, 80, 400, 120, wire, 3)}
      ${bulb(440, 120, active, 'R2')}
      ${line(480, 120, 560, 120, wire, 3)}
      ${line(560, 120, 560, 170, wire, 3)}
      ${line(60, 170, 560, 170, wire, 3)}
      ${switchSymbol(185, 120, !settings.switchClosed)}
    `;
    return;
  }

  if (settings.preset === 'parallel') {
    svg.innerHTML = `
      ${line(60, 120, 130, 120, wire, 3)}
      ${battery(130, 120, settings.batteryVoltage, active)}
      ${line(180, 120, 220, 120, wire, 3)}
      ${switchSymbol(220, 120, !settings.switchClosed)}
      ${line(275, 120, 330, 120, wire, 3)}
      ${line(330, 120, 330, 70, wire, 3)}
      ${bulb(390, 70, active, 'R1')}
      ${line(430, 70, 500, 70, wire, 3)}
      ${line(500, 70, 500, 120, wire, 3)}
      ${line(330, 120, 330, 170, wire, 3)}
      ${bulb(390, 170, active, 'R2')}
      ${line(430, 170, 500, 170, wire, 3)}
      ${line(500, 170, 500, 120, wire, 3)}
      ${line(500, 120, 560, 120, wire, 3)}
      ${line(60, 170, 560, 170, wire, 3)}
    `;
    return;
  }

  svg.innerHTML = `
    ${line(60, 120, 130, 120, wire, 3)}
    ${battery(130, 120, settings.batteryVoltage, active)}
    ${line(180, 120, 220, 120, wire, 3)}
    ${switchSymbol(220, 120, !settings.switchClosed)}
    ${line(275, 120, 330, 120, wire, 3)}
    ${line(330, 120, 330, 70, wire, 3)}
    ${bulb(390, 70, active, 'R1')}
    ${line(430, 70, 510, 70, wire, 3)}
    ${line(510, 70, 510, 120, wire, 3)}
    ${line(330, 120, 330, 170, wire, 3)}
    ${bulb(390, 170, active, 'R2')}
    ${line(430, 170, 510, 170, wire, 3)}
    ${line(510, 170, 510, 120, wire, 3)}
    ${line(510, 120, 560, 120, wire, 3)}
    ${line(330, 120, 330, 40, wire, 3)}
    ${line(330, 40, 460, 40, wire, 3)}
    ${bulb(500, 40, active, 'R3')}
    ${line(540, 40, 560, 40, wire, 3)}
    ${line(560, 40, 560, 120, wire, 3)}
    ${line(60, 170, 560, 170, wire, 3)}
  `;
}

function bindControls() {
  els.batteryVoltage.addEventListener('input', (event) => {
    state.batteryVoltage = Number(event.target.value);
    els.batteryVoltageValue.textContent = `${state.batteryVoltage} V`;
    updateReadings();
  });

  els.bulbResistance.addEventListener('input', (event) => {
    state.bulbResistance = Number(event.target.value);
    els.bulbResistanceValue.textContent = `${state.bulbResistance} Ω`;
    updateReadings();
  });

  els.switchClosed.addEventListener('change', (event) => {
    state.switchClosed = event.target.checked;
    updateReadings();
  });

  els.buttons.forEach((button) => {
    button.addEventListener('click', () => setPreset(button.dataset.preset));
  });
}

function initialize() {
  els.batteryVoltageValue.textContent = `${state.batteryVoltage} V`;
  els.bulbResistanceValue.textContent = `${state.bulbResistance} Ω`;
  bindControls();
  updateReadings();
}

initialize();
