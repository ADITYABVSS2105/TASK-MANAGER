/**
 * keepAlive.js
 * Pings this server's own URL every 14 minutes to prevent
 * Render free-tier sleep (which kicks in after 15 min of inactivity).
 */
const cron = require('node-cron');
const https = require('https');
const http = require('http');

const keepAlive = () => {
  const url = process.env.RENDER_URL;
  if (!url) {
    console.log('[KeepAlive] RENDER_URL not set — skipping self-ping.');
    return;
  }

  // Ping every 14 minutes
  cron.schedule('*/14 * * * *', () => {
    const client = url.startsWith('https') ? https : http;
    const pingUrl = `${url}/api/health`;

    const req = client.get(pingUrl, (res) => {
      console.log(`[KeepAlive] Pinged ${pingUrl} → ${res.statusCode}`);
    });

    req.on('error', (err) => {
      console.warn(`[KeepAlive] Ping failed: ${err.message}`);
    });

    req.end();
  });

  console.log('[KeepAlive] Self-ping cron started (every 14 min)');
};

module.exports = keepAlive;
