// =============================================================================
//  SETTINGS ROUTES — backend/settings_router.js
//  Handles: companies, products, shipping, notifications, security, login history
// =============================================================================
const express  = require("express");
const router   = express.Router();
const db       = require("./db");
const nodemailer = require("nodemailer");
const speakeasy  = require("speakeasy");
const QRCode     = require("qrcode");

// ── Helper ────────────────────────────────────────────────────────────────────
const q = (sql, params = []) =>
  new Promise((res, rej) =>
    db.query(sql, params, (err, rows) => (err ? rej(err) : res(rows)))
  );

// =============================================================================
//  INIT TABLES
// =============================================================================
async function initTables() {
  await q(`
    CREATE TABLE IF NOT EXISTS settings_companies (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(255) NOT NULL DEFAULT 'My Company',
      gst         VARCHAR(100),
      iec         VARCHAR(100),
      pan         VARCHAR(100),
      cin         VARCHAR(100),
      phone       VARCHAR(100),
      email       VARCHAR(255),
      website     VARCHAR(255),
      address     TEXT,
      currency    VARCHAR(10) DEFAULT 'USD',
      timezone    VARCHAR(100) DEFAULT 'Asia/Kolkata',
      is_default  BOOLEAN DEFAULT FALSE,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS settings_product_categories (
      id   INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS settings_products (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      category_id     INT NOT NULL,
      name            VARCHAR(255) NOT NULL,
      hs_code         VARCHAR(100),
      unit            VARCHAR(100),
      packaging       VARCHAR(255),
      selling_price   DECIMAL(12,2),
      purchase_price  DECIMAL(12,2),
      sku             VARCHAR(100),
      FOREIGN KEY (category_id) REFERENCES settings_product_categories(id) ON DELETE CASCADE
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS settings_shipping (
      id       INT AUTO_INCREMENT PRIMARY KEY,
      type     ENUM('method','incoterm','port','container') NOT NULL,
      col1     VARCHAR(255),
      col2     VARCHAR(255),
      col3     VARCHAR(255),
      col4     VARCHAR(255)
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS settings_notifications (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      smtp_host       VARCHAR(255),
      smtp_port       INT DEFAULT 587,
      smtp_secure     BOOLEAN DEFAULT FALSE,
      smtp_user       VARCHAR(255),
      smtp_pass       VARCHAR(255),
      sender_name     VARCHAR(255),
      receivers       TEXT,
      notify_events       BOOLEAN DEFAULT TRUE,
      notify_orders       BOOLEAN DEFAULT TRUE,
      notify_shipments    BOOLEAN DEFAULT TRUE,
      notify_payments     BOOLEAN DEFAULT TRUE,
      notify_due_dates    BOOLEAN DEFAULT TRUE,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS settings_security (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      session_timeout_min INT DEFAULT 60,
      two_factor_enabled  BOOLEAN DEFAULT FALSE,
      two_factor_secret   VARCHAR(255),
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await q(`
    CREATE TABLE IF NOT EXISTS login_history (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT,
      username   VARCHAR(100),
      ip_address VARCHAR(100),
      user_agent VARCHAR(512),
      status     ENUM('success','failed') DEFAULT 'success',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed one default notification row if empty
  const notifRows = await q("SELECT COUNT(*) as c FROM settings_notifications");
  if (notifRows[0].c === 0) {
    await q("INSERT INTO settings_notifications (id) VALUES (1)");
  }

  // Seed one default security row if empty
  const secRows = await q("SELECT COUNT(*) as c FROM settings_security");
  if (secRows[0].c === 0) {
    await q("INSERT INTO settings_security (id) VALUES (1)");
  }

  // Seed default shipping entries if empty
  const shipRows = await q("SELECT COUNT(*) as c FROM settings_shipping");
  if (shipRows[0].c === 0) {
    const defaults = [
      ["method",    "Sea Freight",    "15-30 days",  "Major carriers", ""],
      ["method",    "Air Freight",    "1-5 days",    "DHL, FedEx",     ""],
      ["method",    "Road Transport", "2-7 days",    "Various",        ""],
      ["incoterm",  "FOB",  "Free On Board",  "Vessel at origin port",    ""],
      ["incoterm",  "CIF",  "Cost Insurance Freight", "Destination port", ""],
      ["incoterm",  "EXW",  "Ex Works",       "Factory gate",             ""],
      ["incoterm",  "DDP",  "Delivered Duty Paid", "Buyer's premises",   ""],
      ["incoterm",  "CFR",  "Cost and Freight","Destination port",        ""],
      ["port",      "Nhava Sheva",  "INNSA",  "loading",    "Mumbai, India"],
      ["port",      "Mundra",       "INMUN",  "loading",    "Gujarat, India"],
      ["port",      "Jebel Ali",    "AEJEA",  "discharge",  "Dubai, UAE"],
      ["port",      "Rotterdam",    "NLRTM",  "discharge",  "Netherlands"],
      ["container", "20ft Standard","1 TEU",  "28,000 kg",  ""],
      ["container", "40ft Standard","2 TEU",  "26,500 kg",  ""],
      ["container", "40ft HC",      "2 TEU",  "26,000 kg",  "High Cube"],
      ["container", "LCL",          "Shared", "Varies",     "Less than Container"],
    ];
    for (const [type, c1, c2, c3, c4] of defaults) {
      await q("INSERT INTO settings_shipping (type, col1, col2, col3, col4) VALUES (?,?,?,?,?)", [type, c1, c2, c3, c4]);
    }
  }

  console.log("✅ Settings tables ready");
}

initTables().catch(err => console.error("Settings table init error:", err));

// =============================================================================
//  COMPANIES
// =============================================================================
router.get("/companies", async (req, res) => {
  try {
    const rows = await q("SELECT * FROM settings_companies ORDER BY is_default DESC, id ASC");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/companies", async (req, res) => {
  try {
    const { name, gst, iec, pan, cin, phone, email, website, address, currency, timezone, is_default } = req.body;
    if (is_default) await q("UPDATE settings_companies SET is_default = FALSE");
    const result = await q(
      "INSERT INTO settings_companies (name,gst,iec,pan,cin,phone,email,website,address,currency,timezone,is_default) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      [name,gst,iec,pan,cin,phone,email,website,address,currency||"USD",timezone||"Asia/Kolkata",is_default||false]
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/companies/:id", async (req, res) => {
  try {
    const { name, gst, iec, pan, cin, phone, email, website, address, currency, timezone, is_default } = req.body;
    if (is_default) await q("UPDATE settings_companies SET is_default = FALSE");
    await q(
      "UPDATE settings_companies SET name=?,gst=?,iec=?,pan=?,cin=?,phone=?,email=?,website=?,address=?,currency=?,timezone=?,is_default=? WHERE id=?",
      [name,gst,iec,pan,cin,phone,email,website,address,currency,timezone,is_default||false,req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/companies/:id", async (req, res) => {
  try {
    await q("DELETE FROM settings_companies WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  PRODUCT CATEGORIES
// =============================================================================
router.get("/product-categories", async (req, res) => {
  try {
    const cats = await q("SELECT * FROM settings_product_categories ORDER BY name");
    res.json(cats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/product-categories", async (req, res) => {
  try {
    const result = await q("INSERT INTO settings_product_categories (name) VALUES (?)", [req.body.name]);
    res.json({ id: result.insertId, name: req.body.name });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/product-categories/:id", async (req, res) => {
  try {
    await q("UPDATE settings_product_categories SET name=? WHERE id=?", [req.body.name, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/product-categories/:id", async (req, res) => {
  try {
    await q("DELETE FROM settings_product_categories WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  PRODUCTS
// =============================================================================
router.get("/products", async (req, res) => {
  try {
    const { category_id } = req.query;
    let sql = `
      SELECT p.*, c.name as category_name
      FROM settings_products p
      JOIN settings_product_categories c ON p.category_id = c.id
    `;
    const params = [];
    if (category_id) { sql += " WHERE p.category_id = ?"; params.push(category_id); }
    sql += " ORDER BY c.name, p.name";
    res.json(await q(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/products", async (req, res) => {
  try {
    const { category_id, name, hs_code, unit, packaging, selling_price, purchase_price, sku } = req.body;
    const result = await q(
      "INSERT INTO settings_products (category_id,name,hs_code,unit,packaging,selling_price,purchase_price,sku) VALUES (?,?,?,?,?,?,?,?)",
      [category_id, name, hs_code, unit, packaging, selling_price||null, purchase_price||null, sku]
    );
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/products/:id", async (req, res) => {
  try {
    const { category_id, name, hs_code, unit, packaging, selling_price, purchase_price, sku } = req.body;
    await q(
      "UPDATE settings_products SET category_id=?,name=?,hs_code=?,unit=?,packaging=?,selling_price=?,purchase_price=?,sku=? WHERE id=?",
      [category_id, name, hs_code, unit, packaging, selling_price||null, purchase_price||null, sku, req.params.id]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await q("DELETE FROM settings_products WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  SHIPPING
// =============================================================================
router.get("/shipping", async (req, res) => {
  try {
    const rows = await q("SELECT * FROM settings_shipping ORDER BY type, id");
    const grouped = { method: [], incoterm: [], port: [], container: [] };
    rows.forEach(r => { if (grouped[r.type]) grouped[r.type].push(r); });
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/shipping", async (req, res) => {
  try {
    const { type, col1, col2, col3, col4 } = req.body;
    const result = await q("INSERT INTO settings_shipping (type,col1,col2,col3,col4) VALUES (?,?,?,?,?)", [type,col1,col2,col3,col4]);
    res.json({ id: result.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/shipping/:id", async (req, res) => {
  try {
    const { col1, col2, col3, col4 } = req.body;
    await q("UPDATE settings_shipping SET col1=?,col2=?,col3=?,col4=? WHERE id=?", [col1,col2,col3,col4,req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/shipping/:id", async (req, res) => {
  try {
    await q("DELETE FROM settings_shipping WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  NOTIFICATIONS CONFIG
// =============================================================================
router.get("/notifications", async (req, res) => {
  try {
    const rows = await q("SELECT * FROM settings_notifications LIMIT 1");
    const row  = rows[0] || {};
    // Parse receivers JSON array safely
    try { row.receivers = JSON.parse(row.receivers || "[]"); } catch { row.receivers = []; }
    res.json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/notifications", async (req, res) => {
  try {
    const { smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, sender_name,
            receivers, notify_events, notify_orders, notify_shipments,
            notify_payments, notify_due_dates } = req.body;
    await q(`
      UPDATE settings_notifications SET
        smtp_host=?, smtp_port=?, smtp_secure=?, smtp_user=?, smtp_pass=?,
        sender_name=?, receivers=?,
        notify_events=?, notify_orders=?, notify_shipments=?,
        notify_payments=?, notify_due_dates=?
      WHERE id=1
    `, [
      smtp_host, smtp_port||587, smtp_secure||false, smtp_user, smtp_pass,
      sender_name, JSON.stringify(Array.isArray(receivers) ? receivers : []),
      notify_events!==false, notify_orders!==false, notify_shipments!==false,
      notify_payments!==false, notify_due_dates!==false
    ]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /settings/notifications/test — sends a test email
router.post("/notifications/test", async (req, res) => {
  try {
    const rows = await q("SELECT * FROM settings_notifications LIMIT 1");
    const cfg  = rows[0];
    if (!cfg || !cfg.smtp_user || !cfg.smtp_host) {
      return res.status(400).json({ error: "SMTP not configured. Save notification settings first." });
    }
    let receivers = [];
    try { receivers = JSON.parse(cfg.receivers || "[]"); } catch { receivers = []; }
    if (receivers.length === 0) {
      return res.status(400).json({ error: "No receiver email addresses configured." });
    }

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host,
      port: cfg.smtp_port || 587,
      secure: !!cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
      tls: { rejectUnauthorized: false }
    });

    await transporter.sendMail({
      from: `"${cfg.sender_name || "CRM Notifications"}" <${cfg.smtp_user}>`,
      to:   receivers.join(", "),
      subject: "✅ CRM Test Notification",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 480px; margin: auto; border: 1px solid #e5e7eb; border-radius: 10px;">
          <h2 style="color: #0e2318;">CRM Notification Test</h2>
          <p style="color: #555;">Your notification system is configured correctly.</p>
          <p style="color: #c9a96e; font-weight: bold;">Western Agro CRM is connected!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
          <p style="font-size: 12px; color: #999;">Sent from Western Agro CRM at ${new Date().toLocaleString()}</p>
        </div>
      `,
    });
    res.json({ success: true, message: `Test email sent to ${receivers.join(", ")}` });
  } catch (err) {
    res.status(500).json({ error: "Email failed: " + err.message });
  }
});

// Internal helper: send notification email (called from other routes)
async function sendNotificationEmail(subject, htmlBody) {
  try {
    const rows = await q("SELECT * FROM settings_notifications LIMIT 1");
    const cfg  = rows[0];
    if (!cfg || !cfg.smtp_user || !cfg.smtp_host) return;
    let receivers = [];
    try { receivers = JSON.parse(cfg.receivers || "[]"); } catch { receivers = []; }
    if (receivers.length === 0) return;

    const transporter = nodemailer.createTransport({
      host: cfg.smtp_host, port: cfg.smtp_port || 587,
      secure: !!cfg.smtp_secure,
      auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
      tls: { rejectUnauthorized: false }
    });
    await transporter.sendMail({
      from: `"${cfg.sender_name || "CRM"}" <${cfg.smtp_user}>`,
      to: receivers.join(", "), subject, html: htmlBody
    });
  } catch (err) {
    console.error("[Notification] Email send failed:", err.message);
  }
}

// =============================================================================
//  SECURITY
// =============================================================================
router.get("/security", async (req, res) => {
  try {
    const rows = await q("SELECT id, session_timeout_min, two_factor_enabled FROM settings_security LIMIT 1");
    res.json(rows[0] || { session_timeout_min: 60, two_factor_enabled: false });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/security", async (req, res) => {
  try {
    const { session_timeout_min, two_factor_enabled } = req.body;
    await q(
      "UPDATE settings_security SET session_timeout_min=?, two_factor_enabled=? WHERE id=1",
      [session_timeout_min || 60, two_factor_enabled ? 1 : 0]
    );
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /settings/security/2fa/generate — creates TOTP secret + QR code
router.post("/security/2fa/generate", async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: "Western Agro CRM" });
    // Store secret temporarily (not yet verified)
    await q("UPDATE settings_security SET two_factor_secret=? WHERE id=1", [secret.base32]);
    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
    res.json({ secret: secret.base32, qr: qrDataUrl });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /settings/security/2fa/verify — verifies OTP
router.post("/security/2fa/verify", async (req, res) => {
  try {
    const { token } = req.body;
    const rows = await q("SELECT two_factor_secret FROM settings_security LIMIT 1");
    const secret = rows[0]?.two_factor_secret;
    if (!secret) return res.status(400).json({ error: "2FA not set up" });

    const valid = speakeasy.totp.verify({ secret, encoding: "base32", token, window: 1 });
    if (valid) {
      await q("UPDATE settings_security SET two_factor_enabled=TRUE WHERE id=1");
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid OTP code" });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  LOGIN HISTORY
// =============================================================================
router.get("/login-history", async (req, res) => {
  try {
    const rows = await q("SELECT * FROM login_history ORDER BY created_at DESC LIMIT 100");
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =============================================================================
//  ACTIVE SESSIONS
// =============================================================================
router.get("/sessions", async (req, res) => {
  try {
    const rows = await q(`
      SELECT s.id, s.ip_address, s.user_agent, s.last_activity, s.created_at, u.username 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.revoked = 0 
      ORDER BY s.last_activity DESC
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/sessions/all", async (req, res) => {
  try {
    const cookieLine = (req.headers.cookie || "").split(";").find(c => c.trim().startsWith("crm_session="));
    const token = cookieLine ? decodeURIComponent(cookieLine.split("=")[1].trim()) : "";
    
    await q("UPDATE sessions SET revoked = 1 WHERE token != ?", [token]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/sessions/:id", async (req, res) => {
  try {
    await q("UPDATE sessions SET revoked = 1 WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = { router, sendNotificationEmail };
