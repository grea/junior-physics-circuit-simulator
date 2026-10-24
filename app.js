<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>初中物理电路模拟器</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="page-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">教学演示工具</p>
          <h1>初中物理电路模拟器</h1>
        </div>
        <div class="badge">MNA 求解器</div>
      </header>

      <main class="layout">
        <aside class="sidebar panel">
          <h2>电路类型</h2>
          <div class="preset-grid">
            <button class="preset-btn active" data-preset="series">串联电路</button>
            <button class="preset-btn" data-preset="parallel">并联电路</button>
            <button class="preset-btn" data-preset="mixed">混合电路</button>
          </div>

          <div class="control-group">
            <label for="batteryVoltage">电池电压</label>
            <div class="range-wrap">
              <input id="batteryVoltage" type="range" min="1" max="24" step="1" value="9" />
              <span id="batteryVoltageValue">9 V</span>
            </div>
          </div>

          <div class="control-group">
            <label for="bulbResistance">灯泡电阻</label>
            <div class="range-wrap">
              <input id="bulbResistance" type="range" min="4" max="60" step="1" value="12" />
              <span id="bulbResistanceValue">12 Ω</span>
            </div>
          </div>

          <div class="control-group checkbox-wrap">
            <label class="check-row">
              <input id="switchClosed" type="checkbox" checked />
              <span>开关闭合</span>
            </label>
          </div>

          <div class="formula-box">
            <h3>关键公式</h3>
            <p>欧姆定律：V = I × R</p>
            <p>串联：R 总 = R1 + R2 + ...</p>
            <p>并联：1/R 总 = 1/R1 + 1/R2 + ...</p>
          </div>
        </aside>

        <section class="content panel">
          <div class="stats-grid">
            <div class="stat-card">
              <span class="label">总电流</span>
              <strong id="currentReading">0.00 A</strong>
            </div>
            <div class="stat-card">
              <span class="label">总功率</span>
              <strong id="powerReading">0.00 W</strong>
            </div>
            <div class="stat-card">
              <span class="label">亮度</span>
              <strong id="brightnessReading">0%</strong>
            </div>
            <div class="stat-card">
              <span class="label">总电阻</span>
              <strong id="resistanceReading">0 Ω</strong>
            </div>
          </div>

          <div class="drawings">
            <article class="diagram-card">
              <div class="diagram-header">
                <h2>实物图</h2>
                <span id="physicalLabel">串联电路</span>
              </div>
              <svg id="physicalSvg" viewBox="0 0 620 260" aria-label="实物图"></svg>
            </article>

            <article class="diagram-card">
              <div class="diagram-header">
                <h2>电路图</h2>
                <span id="schematicLabel">串联电路</span>
              </div>
              <svg id="schematicSvg" viewBox="0 0 620 260" aria-label="电路图"></svg>
            </article>
          </div>
        </section>
      </main>
    </div>

    <script src="app.js"></script>
  </body>
</html>
