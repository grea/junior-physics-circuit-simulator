const svg = document.getElementById('board');
const solveBtn = document.getElementById('solveBtn');
const currentDisplay = document.getElementById('currentDisplay');
const resistanceDisplay = document.getElementById('resistanceDisplay');
const powerDisplay = document.getElementById('powerDisplay');
const brightnessDisplay = document.getElementById('brightnessDisplay');

const state = {
  tool: 'select',
  components: [],
  wires: [],
  selectedComponentId: null,
  pendingTerminal: null,
  drag: null,
  lastSolved: null,
};

const typeMeta = {
  battery: { label: '电池', voltage: 9, terminals: 2 },
  bulb: { label: '灯泡', resistance: 12, terminals: 2 },
  resistor: { label: '电阻', resistance: 20, terminals: 2 },
  switch: { label: '开关', resistance: 0.01, terminals: 2, closed: true },
};

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function createComponent(type, x, y) {
  const meta = typeMeta[type];
  const component = {
    id: uid(type),
    type,
    x,
    y,
    voltage: type === 'battery' ? 9 : undefined,
    resistance: meta.resistance ?? 12,
    closed: type === 'switch' ? true : undefined,
  };

  if (type === 'switch') {
    component.closed = true;
    component.resistance = 0.01;
  }

  if (type === 'bulb') {
    component.resistance = 12;
  }

  if (type === 'resistor') {
    component.resistance = 20;
  }

  return component;
}

function makeDefaultCircuit() {
  const battery = createComponent('battery', 120, 260);
  battery.voltage = 9;

  const switchComponent = createComponent('switch', 300, 260);
  switchComponent.closed = true;

  const bulb = createComponent('bulb', 500, 260);
  bulb.resistance = 12;

  const resistor = createComponent('resistor', 680, 260);
  resistor.resistance = 30;

  state.components = [battery, switchComponent, bulb, resistor];
  state.wires = [
    { a: `${battery.id}:0`, b: `${switchComponent.id}:0` },
    { a: `${switchComponent.id}:1`, b: `${bulb.id}:0` },
    { a: `${bulb.id}:1`, b: `${resistor.id}:0` },
    { a: `${resistor.id}:1`, b: `${battery.id}:1` },
  ];
}

function getComponentTerminalPoints(component) {
  const { x, y } = component;
  if (component.type === 'battery') {
    return [
      { x: x - 48, y },
      { x: x + 48, y },
    ];
  }
  if (component.type === 'switch') {
    return [
      { x: x - 42, y },
      { x: x + 42, y },
    ];
  }
  return [
    { x: x - 40, y },
    { x: x + 40, y },
  ];
}

function terminalId(componentId, index) {
  return `${componentId}:${index}`;
}

function getTerminalPosition(component, index) {
  const points = getComponentTerminalPoints(component);
  return points[index];
}

function findComponentById(componentId) {
  return state.components.find((component) => component.id === componentId) || null;
}

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits);
}

function solveLinearSystem(matrix, vector) {
  const n = vector.length;
  const A = matrix.map((row) => [...row]);
  const b = [...vector];

  for (let i = 0; i < n; i += 1) {
    let piv = i;
    let maxAbs = Math.abs(A[i][i] || 0);

    for (let row = i + 1; row < n; row += 1) {
      const val = Math.abs(A[row][i] || 0);
      if (val > maxAbs) {
        maxAbs = val;
        piv = row;
      }
    }

    if (Math.abs(A[piv][i] || 0) < 1e-12) {
      throw new Error('电路矩阵奇异，无法求解。');
    }

    if (piv !== i) {
      [A[i], A[piv]] = [A[piv], A[i]];
      [b[i], b[piv]] = [b[piv], b[i]];
    }

    const pivot = A[i][i];
    for (let col = i; col < n; col += 1) {
      A[i][col] /= pivot;
    }
    b[i] /= pivot;

    for (let row = 0; row < n; row += 1) {
      if (row === i) continue;
      const factor = A[row][i];
      if (Math.abs(factor) < 1e-12) continue;
      for (let col = i; col < n; col += 1) {
        A[row][col] -= factor * A[i][col];
      }
      b[row] -= factor * b[i];
    }
  }

  return b;
}

class DisjointSet {
  constructor() {
    this.parent = new Map();
    this.rank = new Map();
  }

  ensure(value) {
    if (!this.parent.has(value)) {
      this.parent.set(value, value);
      this.rank.set(value, 0);
    }
  }

  find(value) {
    this.ensure(value);
    if (this.parent.get(value) !== value) {
      this.parent.set(value, this.find(this.parent.get(value)));
    }
    return this.parent.get(value);
  }

  union(a, b) {
    this.ensure(a);
    this.ensure(b);
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    const rankA = this.rank.get(ra) || 0;
    const rankB = this.rank.get(rb) || 0;
    if (rankA < rankB) {
      this.parent.set(ra, rb);
    } else if (rankA > rankB) {
      this.parent.set(rb, ra);
    } else {
      this.parent.set(rb, ra);
      this.rank.set(ra, rankA + 1);
    }
  }
}

function addConductance(matrix, nodeIndex, aNode, bNode, conductance) {
  if (aNode === null && bNode === null) return;

  const aIdx = aNode !== null ? nodeIndex.get(aNode) : null;
  const bIdx = bNode !== null ? nodeIndex.get(bNode) : null;

  if (aIdx !== null && bIdx !== null) {
    matrix[aIdx][aIdx] += conductance;
    matrix[bIdx][bIdx] += conductance;
    matrix[aIdx][bIdx] -= conductance;
    matrix[bIdx][aIdx] -= conductance;
    return;
  }

  if (aIdx !== null) {
    matrix[aIdx][aIdx] += conductance;
  }

  if (bIdx !== null) {
    matrix[bIdx][bIdx] += conductance;
  }
}

function solveCircuit() {
  if (!state.components.length) {
    return {
      status: '空电路',
      totalCurrent: 0,
      totalResistance: Infinity,
      power: 0,
      brightness: 0,
      open: true,
      messages: [],
    };
  }

  const terminals = [];
  const ds = new DisjointSet();

  state.components.forEach((component) => {
    for (let i = 0; i < 2; i += 1) {
      const key = terminalId(component.id, i);
      terminals.push({ componentId: component.id, index: i, key });
      ds.ensure(key);
    }
  });

  state.wires.forEach((wire) => {
    ds.union(wire.a, wire.b);
  });

  const rootMap = new Map();
  terminals.forEach((terminal) => {
    const root = ds.find(terminal.key);
    if (!rootMap.has(root)) rootMap.set(root, []);
    rootMap.get(root).push(terminal);
  });

  const roots = [...rootMap.keys()];
  let groundRoot = null;

  for (const component of state.components) {
    if (component.type === 'battery') {
      const pos = terminalId(component.id, 0);
      const neg = terminalId(component.id, 1);
      const posRoot = ds.find(pos);
      const negRoot = ds.find(neg);
      if (posRoot !== negRoot) {
        groundRoot = negRoot;
        break;
      }
    }
  }

  if (!groundRoot && roots.length) {
    groundRoot = roots[0];
  }

  const activeNodes = roots.filter((root) => root !== groundRoot);
  const nodeIndex = new Map(activeNodes.map((root, index) => [root, index]));

  const voltageSources = [];
  state.components.forEach((component) => {
    if (component.type !== 'battery') return;
    const a = terminalId(component.id, 0);
    const b = terminalId(component.id, 1);
    const rootA = ds.find(a);
    const rootB = ds.find(b);
    if (rootA === rootB) return;
    voltageSources.push({
      componentId: component.id,
      a: rootA,
      b: rootB,
      value: component.voltage,
    });
  });

  const totalSize = activeNodes.length + voltageSources.length;
  const A = Array.from({ length: totalSize }, () => Array(totalSize).fill(0));
  const z = Array(totalSize).fill(0);

  state.components.forEach((component) => {
    const termA = terminalId(component.id, 0);
    const termB = terminalId(component.id, 1);
    const rootA = ds.find(termA);
    const rootB = ds.find(termB);

    let conductance = 0;
    if (component.type === 'bulb' || component.type === 'resistor') {
      conductance = 1 / Math.max(component.resistance, 1e-6);
    }
    if (component.type === 'switch' && component.closed) {
      conductance = 1 / Math.max(component.resistance, 1e-6);
    }

    if (conductance > 0 && rootA !== rootB) {
      const nodeA = rootA !== groundRoot ? nodeIndex.get(rootA) : null;
      const nodeB = rootB !== groundRoot ? nodeIndex.get(rootB) : null;
      addConductance(A, nodeIndex, rootA, rootB, conductance);
    }
  });

  voltageSources.forEach((source, index) => {
    const sourceIndex = activeNodes.length + index;
    const nodeA = source.a !== groundRoot ? nodeIndex.get(source.a) : null;
    const nodeB = source.b !== groundRoot ? nodeIndex.get(source.b) : null;

    if (nodeA !== null) {
      A[nodeA][sourceIndex] += 1;
      A[sourceIndex][nodeA] += 1;
    }
    if (nodeB !== null) {
      A[nodeB][sourceIndex] -= 1;
      A[sourceIndex][nodeB] -= 1;
    }
    z[sourceIndex] = source.value;
  });

  if (totalSize === 0) {
    return {
      status: '未形成闭合回路',
      totalCurrent: 0,
      totalResistance: Infinity,
      power: 0,
      brightness: 0,
      open: true,
      messages: ['请至少连接一个电池和一条闭合回路。'],
    };
  }

  try {
    const solution = solveLinearSystem(A, z);
    const nodeVoltages = new Map();
    activeNodes.forEach((root) => {
      const idx = nodeIndex.get(root);
      nodeVoltages.set(root, solution[idx] ?? 0);
    });

    let totalSourceCurrent = 0;
    voltageSources.forEach((source, index) => {
      const sourceIndex = activeNodes.length + index;
      totalSourceCurrent += Math.abs(solution[sourceIndex] ?? 0);
    });

    const batterySource = voltageSources[0];
    const sourceVoltage = batterySource ? batterySource.value : 0;
    const totalCurrent = totalSourceCurrent || 0;
    const totalResistance = totalCurrent > 1e-9 ? sourceVoltage / totalCurrent : Infinity;
    const totalPower = sourceVoltage * totalCurrent;

    const bulbCurrents = state.components
      .filter((component) => component.type === 'bulb')
      .map((component) => {
        const a = terminalId(component.id, 0);
        const b = terminalId(component.id, 1);
        const rootA = ds.find(a);
        const rootB = ds.find(b);
        const va = rootA === groundRoot ? 0 : (nodeVoltages.get(rootA) ?? 0);
        const vb = rootB === groundRoot ? 0 : (nodeVoltages.get(rootB) ?? 0);
        const current = (va - vb) / Math.max(component.resistance, 1e-6);
        return { current, power: Math.pow(current, 2) * component.resistance };
      });

    const bulbTotalPower = bulbCurrents.reduce((sum, item) => sum + item.power, 0);
    const brightness = Math.min(100, Math.max(0, (bulbTotalPower / 30) * 100));

    return {
      status: totalCurrent > 0 ? '回路已闭合' : '回路无电流',
      totalCurrent,
      totalResistance,
      power: totalPower,
      brightness,
      open: totalCurrent <= 0.0001,
      messages: totalCurrent > 0 ? ['电路已形成闭合回路并成功求解。'] : ['当前回路尚未形成有效闭合。'],
    };
  } catch (error) {
    return {
      status: '求解失败',
      totalCurrent: 0,
      totalResistance: Infinity,
      power: 0,
      brightness: 0,
      open: true,
      messages: [error.message || '求解失败。'],
    };
  }
}

function updateReadings() {
  const result = solveCircuit();
  state.lastSolved = result;

  currentDisplay.textContent = `${formatNumber(result.totalCurrent, 2)} A`;
  resistanceDisplay.textContent = Number.isFinite(result.totalResistance) ? `${formatNumber(result.totalResistance, 2)} Ω` : '∞ Ω';
  powerDisplay.textContent = `${formatNumber(result.power, 2)} W`;
  brightnessDisplay.textContent = `${Math.round(result.brightness)}%`;
  renderBoard();
}

function renderBoard() {
  const wiresMarkup = state.wires
    .map((wire) => {
      const aComp = findComponentById(wire.a.split(':')[0]);
      const bComp = findComponentById(wire.b.split(':')[0]);
      if (!aComp || !bComp) return '';
      const aIndex = Number(wire.a.split(':')[1]);
      const bIndex = Number(wire.b.split(':')[1]);
      const aPos = getTerminalPosition(aComp, aIndex);
      const bPos = getTerminalPosition(bComp, bIndex);
      const isActive = state.lastSolved && !state.lastSolved.open;
      return `<line class="wire ${isActive ? 'glow' : ''}" x1="${aPos.x}" y1="${aPos.y}" x2="${bPos.x}" y2="${bPos.y}" />`;
    })
    .join('');

  const componentMarkup = state.components
    .map((component) => {
      const terminals = getComponentTerminalPoints(component);
      const terminalsMarkup = terminals
        .map((point, index) => `
          <circle
            class="terminal"
            data-component-id="${component.id}"
            data-terminal-index="${index}"
            cx="${point.x}"
            cy="${point.y}"
            r="7"
            fill="rgba(255,255,255,0.2)"
            stroke="rgba(255,255,255,0.9)"
            stroke-width="1.5"
          />
        `)
        .join('');

      const isSelected = component.id === state.selectedComponentId;
      const isBattery = component.type === 'battery';
      const isBulb = component.type === 'bulb';
      const isSwitch = component.type === 'switch';
      const isResistor = component.type === 'resistor';

      let body = '';
      if (isBattery) {
        const active = state.lastSolved && !state.lastSolved.open;
        body = `
          <rect x="${component.x - 28}" y="${component.y - 18}" width="56" height="36" rx="8" fill="rgba(122,231,160,0.22)" stroke="${active ? '#7ae7a0' : '#dfefff'}" stroke-width="2.2" />
          <line x1="${component.x - 10}" y1="${component.y - 18}" x2="${component.x - 10}" y2="${component.y + 18}" stroke="${active ? '#7ae7a0' : '#dfefff'}" stroke-width="4" />
          <line x1="${component.x + 10}" y1="${component.y - 24}" x2="${component.x + 10}" y2="${component.y + 24}" stroke="${active ? '#7ae7a0' : '#dfefff'}" stroke-width="4" />
          <text x="${component.x}" y="${component.y + 36}" text-anchor="middle">${component.voltage}V</text>
        `;
      } else if (isBulb) {
        const active = state.lastSolved && !state.lastSolved.open;
        body = `
          <circle cx="${component.x}" cy="${component.y}" r="22" fill="${active ? 'rgba(255,215,106,0.66)' : 'rgba(255,255,255,0.14)'}" stroke="${active ? '#ffd76a' : '#dfefff'}" stroke-width="2.6" />
          <path d="M ${component.x - 10} ${component.y + 18} L ${component.x} ${component.y + 30} L ${component.x + 10} ${component.y + 18}" stroke="${active ? '#ffd76a' : '#dfefff'}" stroke-width="3" fill="none" />
          <text x="${component.x}" y="${component.y + 46}" text-anchor="middle">${component.resistance}Ω</text>
        `;
      } else if (isSwitch) {
        body = `
          <circle cx="${component.x - 16}" cy="${component.y}" r="5" fill="#dfefff" />
          <circle cx="${component.x + 16}" cy="${component.y}" r="5" fill="#dfefff" />
          <line x1="${component.x - 11}" y1="${component.y}" x2="${component.x - 3}" y2="${component.y}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x + 3}" y1="${component.y}" x2="${component.x + 12}" y2="${component.y}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x - 2}" y1="${component.y}" x2="${component.x + 8}" y2="${component.y - 12}" stroke="#dfefff" stroke-width="3" />
          <text x="${component.x}" y="${component.y + 36}" text-anchor="middle">${component.closed ? '闭合' : '断开'}</text>
        `;
      } else if (isResistor) {
        body = `
          <rect x="${component.x - 36}" y="${component.y - 14}" width="72" height="28" rx="4" fill="rgba(103,213,255,0.18)" stroke="#67d5ff" stroke-width="2.5" />
          <line x1="${component.x - 34}" y1="${component.y}" x2="${component.x - 16}" y2="${component.y}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x - 16}" y1="${component.y}" x2="${component.x - 8}" y2="${component.y - 12}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x - 8}" y1="${component.y - 12}" x2="${component.x}" y2="${component.y + 12}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x}" y1="${component.y + 12}" x2="${component.x + 8}" y2="${component.y - 12}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x + 8}" y1="${component.y - 12}" x2="${component.x + 16}" y2="${component.y}" stroke="#dfefff" stroke-width="3" />
          <line x1="${component.x + 16}" y1="${component.y}" x2="${component.x + 34}" y2="${component.y}" stroke="#dfefff" stroke-width="3" />
          <text x="${component.x}" y="${component.y + 42}" text-anchor="middle">${component.resistance}Ω</text>
        `;
      }

      return `
        <g class="component ${isSelected ? 'selected' : ''}" data-component-id="${component.id}" style="transform-box: fill-box;">
          ${body}
          ${terminalsMarkup}
        </g>
      `;
    })
    .join('');

  svg.innerHTML = `${wiresMarkup}${componentMarkup}`;
}

function addComponent(type) {
  const x = 130 + state.components.length * 80;
  const y = 260 + (state.components.length % 2) * 80;
  const component = createComponent(type, x, y);
  state.components.push(component);
  updateReadings();
}

function connectTerminals(componentId, terminalIndex) {
  const target = `${componentId}:${terminalIndex}`;
  if (!state.pendingTerminal) {
    state.pendingTerminal = target;
    return;
  }

  if (state.pendingTerminal === target) {
    state.pendingTerminal = null;
    return;
  }

  const [sourceId, sourceIndex] = state.pendingTerminal.split(':');
  const source = `${sourceId}:${sourceIndex}`;
  const isDuplicate = state.wires.some((wire) => {
    const sameA = (wire.a === source && wire.b === target) || (wire.a === target && wire.b === source);
    return sameA;
  });

  if (!isDuplicate) {
    state.wires.push({ a: source, b: target });
  }
  state.pendingTerminal = null;
  updateReadings();
}

function deleteSelectedComponent() {
  if (!state.selectedComponentId) return;
  state.components = state.components.filter((component) => component.id !== state.selectedComponentId);
  state.wires = state.wires.filter((wire) => {
    const [aId] = wire.a.split(':');
    const [bId] = wire.b.split(':');
    return aId !== state.selectedComponentId && bId !== state.selectedComponentId;
  });
  state.selectedComponentId = null;
  updateReadings();
}

svg.addEventListener('pointerdown', (event) => {
  const terminalEl = event.target.closest('.terminal');
  if (terminalEl) {
    const componentId = terminalEl.dataset.componentId;
    const terminalIndex = Number(terminalEl.dataset.terminalIndex);
    if (state.tool === 'connect') {
      connectTerminals(componentId, terminalIndex);
      return;
    }
    if (state.tool === 'delete') {
      const component = findComponentById(componentId);
      if (component) {
        state.components = state.components.filter((item) => item.id !== componentId);
        state.wires = state.wires.filter((wire) => {
          const [aId] = wire.a.split(':');
          const [bId] = wire.b.split(':');
          return aId !== componentId && bId !== componentId;
        });
        updateReadings();
      }
      return;
    }
  }

  const componentEl = event.target.closest('.component');
  if (componentEl) {
    const componentId = componentEl.dataset.componentId;
    state.selectedComponentId = componentId;
    const component = findComponentById(componentId);
    if (!component) return;

    state.drag = {
      id: componentId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: component.x,
      originY: component.y,
    };
    componentEl.setPointerCapture?.(event.pointerId);
    renderBoard();
    return;
  }

  if (state.tool === 'delete' && !event.target.closest('.component')) {
    state.selectedComponentId = null;
    renderBoard();
  }
});

window.addEventListener('pointermove', (event) => {
  if (!state.drag) return;
  const { id, startX, startY, originX, originY } = state.drag;
  const component = findComponentById(id);
  if (!component) return;

  const dx = (event.clientX - startX) / 1.2;
  const dy = (event.clientY - startY) / 1.2;
  component.x = Math.max(65, Math.min(820, originX + dx));
  component.y = Math.max(80, Math.min(460, originY + dy));
  renderBoard();
});

window.addEventListener('pointerup', () => {
  state.drag = null;
  updateReadings();
});

window.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  const wireLine = event.target.closest('.wire');
  if (!wireLine) return;
  const index = state.wires.findIndex((wire) => {
    const aComp = findComponentById(wire.a.split(':')[0]);
    const bComp = findComponentById(wire.b.split(':')[0]);
    if (!aComp || !bComp) return false;
    const aPos = getTerminalPosition(aComp, Number(wire.a.split(':')[1]));
    const bPos = getTerminalPosition(bComp, Number(wire.b.split(':')[1]));
    const mx = (aPos.x + bPos.x) / 2;
    const my = (aPos.y + bPos.y) / 2;
    return Math.abs(event.offsetX - mx) < 18 && Math.abs(event.offsetY - my) < 18;
  });
  if (index >= 0) {
    state.wires.splice(index, 1);
    updateReadings();
  }
});

for (const button of document.querySelectorAll('.component-button')) {
  button.addEventListener('click', () => addComponent(button.dataset.type));
}

for (const button of document.querySelectorAll('.tool-button')) {
  button.addEventListener('click', () => {
    state.tool = button.dataset.tool;
    document.querySelectorAll('.tool-button').forEach((item) => item.classList.toggle('active', item === button));
    renderBoard();
  });
}

solveBtn.addEventListener('click', updateReadings);

makeDefaultCircuit();
updateReadings();
renderBoard();
