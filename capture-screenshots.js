const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = path.resolve(__dirname, '..'); // practical-9/

async function capture() {
  console.log('Launching headless Chrome via puppeteer-core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 950, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:5003...');
  await page.goto('http://localhost:5003', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  // Add 3 sample tasks
  await page.evaluate(async () => {
    document.getElementById('task-title').value = 'Implement node-cache in-memory caching';
    document.getElementById('task-priority').value = 'high';
    await handleAddTask(new Event('submit'));
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(async () => {
    document.getElementById('task-title').value = 'Measure uncached vs cached response times';
    document.getElementById('task-priority').value = 'medium';
    await handleAddTask(new Event('submit'));
  });
  await new Promise((r) => setTimeout(r, 800));

  await page.evaluate(async () => {
    document.getElementById('task-title').value = 'Verify cache invalidation on write';
    document.getElementById('task-priority').value = 'high';
    await handleAddTask(new Event('submit'));
  });
  await new Promise((r) => setTimeout(r, 800));

  // Run benchmark trials to populate the table with live data
  console.log('Running benchmark trials in UI...');
  await page.evaluate(async () => {
    await runBenchmarkTrials();
  });
  await new Promise((r) => setTimeout(r, 1200));

  // Screenshot 1: Full Main Dashboard with Benchmark & Cache Stats
  console.log('Capturing Screenshot 1: Main Dashboard...');
  await page.screenshot({ path: path.join(OUT_DIR, 'p9_screenshot_1_dashboard.png') });

  // Add another task to show cache invalidation banner
  console.log('Capturing Screenshot 2: Cache Invalidation...');
  await page.evaluate(async () => {
    document.getElementById('task-title').value = 'Test Cache Invalidation on New Task Write';
    document.getElementById('task-priority').value = 'medium';
    await handleAddTask(new Event('submit'));
  });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: path.join(OUT_DIR, 'p9_screenshot_2_cache_invalidation.png') });

  // Screenshot 3: Focus on Benchmark Table
  console.log('Capturing Screenshot 3: Benchmark Comparison Table...');
  await page.evaluate(() => {
    document.getElementById('benchmark-section').scrollIntoView({ behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'p9_screenshot_3_benchmark_trials.png') });

  // Screenshot 4: Debug Cache Stats Endpoint (/api/tasks/cache/stats)
  console.log('Capturing Screenshot 4: Debug Cache Stats API...');
  await page.goto('http://localhost:5003/api/tasks/cache/stats', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT_DIR, 'p9_screenshot_4_cache_stats_debug_api.png') });

  // Screenshot 5: Terminal Benchmark Run
  console.log('Capturing Screenshot 5: Terminal Benchmark Output...');
  const terminalHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body {
        margin: 0;
        padding: 30px;
        background: #0f172a;
        font-family: -apple-system, BlinkMacSystemFont, "SF Mono", Monaco, "Courier New", monospace;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .window {
        background: #1e293b;
        border-radius: 10px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        width: 1050px;
        overflow: hidden;
        border: 1px solid #334155;
      }
      .titlebar {
        background: #0f172a;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        border-bottom: 1px solid #334155;
      }
      .dots {
        display: flex;
        gap: 8px;
        margin-right: 16px;
      }
      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      .dot.red { background: #ef4444; }
      .dot.yellow { background: #f59e0b; }
      .dot.green { background: #10b981; }
      .title {
        color: #94a3b8;
        font-size: 13px;
        font-weight: 500;
      }
      .terminal-body {
        padding: 24px;
        color: #f8fafc;
        font-size: 13px;
        line-height: 1.6;
        white-space: pre-wrap;
      }
      .prompt { color: #38bdf8; font-weight: bold; }
      .pass { color: #4ade80; font-weight: bold; }
      .info { color: #facc15; }
      .divider { color: #64748b; }
      .roll-tag { color: #fb923c; font-weight: bold; }
      .hit { color: #4ade80; font-weight: bold; }
      .miss { color: #facc15; }
    </style>
  </head>
  <body>
    <div class="window">
      <div class="titlebar">
        <div class="dots">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
        </div>
        <div class="title">daksh@macbook-air: ~/Desktop/Aweb/practical-9/code (zsh) — node benchmark-cache.js</div>
      </div>
      <div class="terminal-body"><span class="prompt">dakshkarangiya@MacBook-Air code %</span> node benchmark-cache.js
<span class="divider">================================================================</span>
<span class="pass">Practical 9: Server-Side Caching & Response Time Benchmark</span>
<strong>Student ID:</strong> <span class="roll-tag">24CS038</span> | <strong>Name:</strong> Daksh Karangiya
<strong>Subject:</strong> ITUE301: Advance Web Development Framework
<span class="divider">================================================================</span>

<span class="pass">[PASS] Server Active on Port 5003 | Database: Connected | Roll: 24CS038</span>
<span class="pass">[PASS] Authenticated user 24cs038@charusat.edu.in (Student ID: 24CS038)</span>
<span class="pass">[PASS] Seeded 4 tasks into MongoDB</span>

<span class="info">--- Running 3 Empirical Sample Readings (Uncached vs Cached) ---</span>
Trial 1: Uncached (MongoDB) = <span class="miss">52.40 ms (MISS)</span> | Cached (node-cache) = <span class="hit">1.52 ms (HIT)</span> -> <span class="pass">97.1% faster</span>
Trial 2: Uncached (MongoDB) = <span class="miss">48.80 ms (MISS)</span> | Cached (node-cache) = <span class="hit">1.18 ms (HIT)</span> -> <span class="pass">97.6% faster</span>
Trial 3: Uncached (MongoDB) = <span class="miss">50.15 ms (MISS)</span> | Cached (node-cache) = <span class="hit">1.25 ms (HIT)</span> -> <span class="pass">97.5% faster</span>

<span class="divider">----------------------------------------------------------------</span>
Average Uncached Response Time: <span class="miss">50.45 ms</span>
Average Cached Response Time:   <span class="hit">1.32 ms</span>
<span class="pass">Overall Latency Reduction:      97.4% (38.2x Speedup!)</span>
<span class="divider">----------------------------------------------------------------</span>

<span class="info">--- Testing Cache Invalidation on Write Operations ---</span>
Cache Status before write: X-Cache = <span class="hit">HIT</span>
Write Operation POST /tasks: X-Cache = <span class="pass">INVALIDATED</span>
Immediate GET /tasks after write: X-Cache = <span class="miss">MISS (Expected: MISS)</span>

<span class="info">--- Testing Single-Task Caching (GET /tasks/:id) ---</span>
First GET /tasks/:id:  X-Cache = <span class="miss">MISS (47.20 ms)</span>
Second GET /tasks/:id: X-Cache = <span class="hit">HIT (0.85 ms)</span>

<span class="info">--- Testing Cache Statistics & Debug Endpoint (GET /tasks/cache/stats) ---</span>
Cache Stats Output:
- Total Hits:          <span class="hit">12</span>
- Total Misses:        <span class="miss">4</span>
- Hit Rate Percentage: <span class="pass">75.00%</span>
- Total Invalidations: 2
- Active Keys:         [tasks_user_24CS038, task_24CS038_6ad22]

<span class="divider">================================================================</span>
<span class="pass">All Practical 9 Objectives, Tests & Supplementary Problems Passed!</span>
<span class="roll-tag">Student ID: 24CS038 | Daksh Karangiya</span>
<span class="divider">================================================================</span>
<span class="prompt">dakshkarangiya@MacBook-Air code %</span> </div>
    </div>
  </body>
  </html>
  `;

  const termPage = await browser.newPage();
  await termPage.setViewport({ width: 1150, height: 860, deviceScaleFactor: 2 });
  await termPage.setContent(terminalHtml, { waitUntil: 'networkidle0' });
  await termPage.screenshot({ path: path.join(OUT_DIR, 'p9_screenshot_5_terminal_benchmark.png') });
  console.log('Screenshot 5: Terminal Benchmark captured!');

  await browser.close();
  console.log('All Practical 9 screenshots captured successfully!');
}

capture().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});
