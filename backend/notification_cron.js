const cron = require('node-cron');
const db = require('./db');
const nodemailer = require('nodemailer');

const q = (sql, params = []) =>
  new Promise((res, rej) =>
    db.query(sql, params, (err, rows) => (err ? rej(err) : res(rows)))
  );

async function checkAndSendNotifications() {
  try {
    const [cfg] = await q("SELECT * FROM settings_notifications LIMIT 1");
    if (!cfg) return;
    
    let receivers = [];
    try {
      receivers = JSON.parse(cfg.receivers);
    } catch (e) { return; }
    if (!receivers || receivers.length === 0) return;

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host, port: cfg.smtp_port || 587,
      secure: !!cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
      tls: { rejectUnauthorized: false }
    });

    const sendAlert = async (type, refId, threshold, subject, html) => {
      // Check if already dispatched
      const log = await q("SELECT id FROM cron_dispatch_log WHERE type=? AND reference_id=? AND threshold=?", [type, refId, threshold]);
      if (log.length > 0) return;

      try {
        await transporter.sendMail({
          from: `"${cfg.sender_name || "CRM"}" <${cfg.smtp_user}>`,
          to: receivers.join(", "), subject, html
        });
        await q("INSERT INTO cron_dispatch_log (type, reference_id, threshold) VALUES (?,?,?)", [type, refId, threshold]);
      } catch (err) { console.error("Cron Email Error:", err.message); }
    };

    const now = new Date();

    // 1. Upcoming Events (24h, 2h, 30m)
    if (cfg.notify_events) {
      const events = await q("SELECT * FROM events WHERE CONCAT(date, ' ', time) > NOW()");
      for (const ev of events) {
        const evDate = new Date(`${ev.date}T${ev.time || '00:00:00'}`);
        const diffMin = Math.floor((evDate - now) / 60000);
        
        let threshold = null;
        if (diffMin <= 15 && diffMin > 0) threshold = '15m';
        else if (diffMin <= 30 && diffMin > 15) threshold = '30m';
        else if (diffMin <= 120 && diffMin > 90) threshold = '2h';
        else if (diffMin <= 1440 && diffMin > 1400) threshold = '24h';

        if (threshold) {
          const html = `<h3>Upcoming Event Reminder</h3><p><strong>${ev.title}</strong> is starting in ${threshold}.</p><p>${ev.description || ''}</p>`;
          await sendAlert('event', ev.id, threshold, `Reminder: ${ev.title}`, html);
        }
      }
    }

    // 2. Shipment Alerts (3 Days before)
    if (cfg.notify_shipments) {
      const txs = await q("SELECT * FROM account_transactions WHERE shipment_date IS NOT NULL AND shipment_date > NOW()");
      for (const tx of txs) {
        const diffDays = Math.floor((new Date(tx.shipment_date) - now) / (1000 * 60 * 60 * 24));
        if (diffDays === 3) {
          await sendAlert('shipment', tx.id, '3d', `Shipment Alert: TX #${tx.id}`, `<p>Transaction TX-${tx.id} has a scheduled shipment in 3 days.</p>`);
        }
      }
    }

    // 3. Payment Due Reminders (1 Day before)
    if (cfg.notify_payments) {
      const pTxs = await q("SELECT * FROM account_transactions WHERE payment_due_date IS NOT NULL AND payment_due_date > NOW()");
      for (const tx of pTxs) {
        const diffDays = Math.floor((new Date(tx.payment_due_date) - now) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          await sendAlert('payment', tx.id, '1d', `Payment Due Tomorrow: TX #${tx.id}`, `<p>Payment for TX-${tx.id} is due tomorrow.</p>`);
        }
      }
    }

  } catch (err) {
    console.error("Cron Error:", err);
  }
}

function initCron() {
  // Run every minute
  cron.schedule('* * * * *', () => {
    checkAndSendNotifications();
  });
  console.log(" Background Notification Cron Job Started");
}

module.exports = { initCron, checkAndSendNotifications };
