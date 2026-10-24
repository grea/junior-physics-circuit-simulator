:root {
  --bg: #071522;
  --bg2: #112136;
  --panel: rgba(14, 34, 52, 0.9);
  --panel-strong: rgba(19, 42, 63, 0.95);
  --border: rgba(255, 255, 255, 0.1);
  --text: #edf8ff;
  --muted: #b8cfe7;
  --blue: #67d5ff;
  --blue-strong: #3fc4ef;
  --gold: #ffd76a;
  --green: #7ae7a0;
  --red: #ff7a7a;
  --grid: rgba(255, 255, 255, 0.05);
  --wire: #e8f2ff;
  --shadow: 0 24px 48px rgba(0, 0, 0, 0.28);
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  min-height: 100%;
  background: radial-gradient(circle at top, #163958 0%, var(--bg) 42%, #050b12 100%);
  color: var(--text);
  font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
}

button {
  font: inherit;
}

.app-shell {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  min-height: 100vh;
  gap: 20px;
  padding: 18px;
}

.sidebar {
  display: flex;
}

.panel {
  width: 100%;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: var(--shadow);
  padding: 20px 18px;
}

h1 {
  margin: 0;
  font-size: 2rem;
  letter-spacing: 0.04em;
}

.subtitle {
  margin: 6px 0 18px;
  color: var(--muted);
}

.tool-group,
.palette {
  display: grid;
  gap: 10px;
  margin-bottom: 20px;
}

.tool-group {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.palette {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.tool-button,
.component-button,
.primary-button {
  border: 1px solid var(--border);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  cursor: pointer;
  transition: transform 0.16s ease, border-color 0.16s ease, background 0.16s ease;
}

.tool-button,
.component-button {
  padding: 12px 10px;
}

.tool-button:hover,
.component-button:hover,
.primary-button:hover {
  transform: translateY(-1px);
  border-color: rgba(103, 213, 255, 0.8);
  background: rgba(103, 213, 255, 0.12);
}

.tool-button.active {
  background: rgba(103, 213, 255, 0.2);
  border-color: rgba(103, 213, 255, 0.8);
}

.primary-button {
  width: 100%;
  margin-top: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(93, 189, 255, 0.15), rgba(122, 231, 160, 0.12));
}

.panel-block {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 12px;
  margin-bottom: 18px;
}

.line-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  padding: 7px 2px;
  color: var(--muted);
}

.line-row strong {
  color: var(--text);
}

.formula-box h2 {
  margin: 0 0 10px;
  font-size: 1.05rem;
}

.formula-box p {
  margin: 6px 0;
  color: var(--muted);
}

.board-wrap {
  background: rgba(11, 27, 39, 0.8);
  border: 1px solid var(--border);
  border-radius: 22px;
  box-shadow: var(--shadow);
  overflow: hidden;
}

#board {
  width: 100%;
  height: 100%;
  min-height: 560px;
  display: block;
  background:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px),
    linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.02));
  background-size: 20px 20px, 20px 20px, 100% 100%;
}

.component {
  cursor: grab;
}

.component:active {
  cursor: grabbing;
}

.terminal {
  cursor: crosshair;
}

.wire {
  stroke: var(--wire);
  stroke-linecap: round;
  stroke-width: 5;
  fill: none;
}

.wire.glow {
  stroke: var(--blue);
  stroke-width: 7;
  opacity: 0.9;
}

text {
  font-size: 12px;
  fill: var(--text);
}

@media (max-width: 980px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
}

