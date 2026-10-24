* {
  box-sizing: border-box;
}

:root {
  --bg: #081522;
  --bg2: #0f1f2f;
  --panel: #13273f;
  --panel-strong: #193553;
  --border: rgba(255, 255, 255, 0.08);
  --text: #eaf5ff;
  --muted: #b4c7db;
  --primary: #4ec7f5;
  --secondary: #f5d76d;
  --danger: #ff7f7f;
  --success: #86efac;
  --wire: #dfe9f8;
  --bulb: #ffd76a;
  --component: #9ad7ff;
  --shadow: 0 14px 34px rgba(5, 12, 20, 0.38);
}

body {
  margin: 0;
  min-height: 100vh;
  background: radial-gradient(circle at top, #163252 0%, var(--bg) 44%, #050b12 100%);
  color: var(--text);
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

button,
input {
  font: inherit;
}

.page-shell {
  max-width: 1400px;
  margin: 0 auto;
  padding: 26px 18px 40px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 6px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--primary);
  font-size: 0.7rem;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 2.5vw, 2.8rem);
}

.badge {
  border: 1px solid rgba(78, 199, 245, 0.5);
  background: rgba(78, 199, 245, 0.08);
  color: var(--primary);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 600;
}

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 20px;
}

.panel {
  background: rgba(19, 39, 63, 0.9);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.sidebar {
  padding: 22px 18px;
}

.sidebar h2 {
  margin: 0 0 18px;
  font-size: 1.2rem;
}

.preset-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
  margin-bottom: 18px;
}

.preset-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.preset-btn:hover,
.preset-btn.active {
  transform: translateY(-1px);
  border-color: rgba(78, 199, 245, 0.7);
  background: rgba(78, 199, 245, 0.12);
}

.control-group {
  margin-top: 20px;
}

.control-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--muted);
}

.range-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 68px;
  align-items: center;
  gap: 10px;
}

input[type='range'] {
  width: 100%;
  accent-color: var(--primary);
}

#batteryVoltageValue,
#bulbResistanceValue {
  text-align: right;
  font-weight: 700;
  color: var(--secondary);
}

.checkbox-wrap {
  margin-top: 18px;
}

.check-row {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text) !important;
}

.check-row input {
  width: 18px;
  height: 18px;
  accent-color: var(--success);
}

.formula-box {
  margin-top: 26px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px 14px 8px;
}

.formula-box h3 {
  margin: 0 0 10px;
  font-size: 1rem;
}

.formula-box p {
  margin: 0 0 8px;
  color: var(--muted);
  line-height: 1.5;
}

.content {
  padding: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 14px 16px;
}

.stat-card .label {
  display: block;
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 8px;
}

.stat-card strong {
  font-size: clamp(1.2rem, 2vw, 1.9rem);
  color: var(--text);
}

.drawings {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.diagram-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 12px 12px 8px;
}

.diagram-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 10px;
}

.diagram-header h2 {
  margin: 0;
  font-size: 1.05rem;
}

.diagram-header span {
  color: var(--primary);
  font-size: 0.84rem;
}

svg {
  width: 100%;
  height: 260px;
  display: block;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,0.04);
}

@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .drawings,
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
