/**
 * ==============================================================================
 * SyncWave Render 24/7 Keep-Alive Server
 * ==============================================================================
 * Pings your Render deployment periodically so the free-tier service never
 * spins down or goes to sleep due to inactivity.
 *
 * Usage:
 *   node server.js
 *
 * Zero Dependencies Required:
 *   Works out of the box with Node 18+ native fetch or built-in https module.
 *   No 'npm install' needed!
 * ==============================================================================
 */

const http = require('http');
const https = require('https');

// Target Render Deployment URL
const TARGET_URL = process.env.TARGET_URL || 'https://youtube-watch-party-r2gl.onrender.com/';

// Ping interval (10 minutes = 600,000 ms)
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS, 10) || 10 * 60 * 1000;

// Port for hosting as a background cloud worker (optional)
const PORT = process.env.PORT || 3000;

let stats = {
  totalPings: 0,
  successfulPings: 0,
  failedPings: 0,
  lastPingTime: null,
  lastStatusCode: null,
  lastResponseTimeMs: null,
  startedAt: new Date().toISOString(),
};

/**
 * Universal HTTP/HTTPS Ping Function
 */
async function pingServer() {
  const startTime = Date.now();
  stats.totalPings++;
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${timestamp}] ⏳ Pinging ${TARGET_URL}...`);

  try {
    if (typeof fetch !== 'undefined') {
      // Modern Node 18+ native fetch with 60s timeout
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 60000) : null;
      
      const res = await fetch(TARGET_URL, {
        method: 'GET',
        headers: { 'User-Agent': 'SyncWave-KeepAlive-Bot/1.0' },
        signal: controller ? controller.signal : undefined,
      });
      if (timeoutId) clearTimeout(timeoutId);

      const duration = Date.now() - startTime;
      stats.lastStatusCode = res.status;
      stats.lastResponseTimeMs = duration;
      stats.lastPingTime = new Date().toISOString();

      if (res.ok || res.status < 400) {
        stats.successfulPings++;
        console.log(`[${timestamp}] 🚀 Server kept alive: Status ${res.status} (${duration}ms)`);
      } else {
        stats.failedPings++;
        console.warn(`[${timestamp}] ⚠️ Server responded with status: ${res.status} (${duration}ms)`);
      }
    } else {
      // Node <18 fallback using native https module
      await new Promise((resolve, reject) => {
        const req = https.get(TARGET_URL, (res) => {
          const duration = Date.now() - startTime;
          stats.lastStatusCode = res.statusCode;
          stats.lastResponseTimeMs = duration;
          stats.lastPingTime = new Date().toISOString();
          stats.successfulPings++;
          console.log(`[${timestamp}] 🚀 Server kept alive: Status ${res.statusCode} (${duration}ms) -> ${TARGET_URL}`);
          resolve();
        });
        req.on('error', (err) => {
          stats.failedPings++;
          reject(err);
        });
        req.setTimeout(30000, () => {
          req.destroy(new Error('Ping timeout (30s)'));
        });
      });
    }
  } catch (err) {
    stats.failedPings++;
    console.error(`[${timestamp}] ❌ Error keeping alive: ${err.message}`);
  }
}

// 1. Initial Ping immediately on startup
console.log('='.repeat(65));
console.log('🍿 SyncWave Watch Party — Render 24/7 Keep-Alive Bot');
console.log(`🎯 Target URL   : ${TARGET_URL}`);
console.log(`⏱️ Interval     : ${INTERVAL_MS / 1000} seconds (${INTERVAL_MS / 60000} minutes)`);
console.log('='.repeat(65));

pingServer();

// 2. Schedule recurring ping every 10 minutes
setInterval(pingServer, INTERVAL_MS);

// 3. Optional Lightweight Health Status Dashboard HTTP Server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify(
      {
        status: 'ONLINE',
        service: 'SyncWave Keep-Alive Bot',
        targetUrl: TARGET_URL,
        intervalMinutes: INTERVAL_MS / 60000,
        stats,
      },
      null,
      2
    )
  );
});

server.listen(PORT, () => {
  console.log(`📡 Local Status Dashboard running at: http://localhost:${PORT}`);
});
