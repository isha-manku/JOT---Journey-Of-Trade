const express = require("express");
const cors = require("cors");
const db = require("./db");
const { signToken } = require("./docplatform_auth");
const fs = require("fs");
const app = express();
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");
const multer = require("multer");
const { router: settingsRouter } = require("./settings_router");

// Ensure message_reads table exists
db.query(
  `CREATE TABLE IF NOT EXISTS message_reads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_msg_user (message_id, user_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`,
  (err) => {
    if (err) console.error("Error creating message_reads table:", err);
    else console.log("Verified message_reads table exists.");
  }
);

// â”€â”€ Multer Storage Configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "uploads/seller_documents");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

// Buyer Documents Multer Config
const buyerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "uploads/buyer_documents");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const buyerUpload = multer({
  storage: buyerStorage,
  fileFilter: (req, file, cb) => {
    // Only accept PDFs by mime type and extension
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/fonts", express.static(path.join(__dirname, "public/fonts")));
app.use("/uploads", (req, res) => {
  res.status(404).send(`
    <html style="background:#f8f9fa;">
      <body style="font-family:'Segoe UI',sans-serif; text-align:center; padding: 4rem; color:#495057;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:#e03131; margin-bottom:1rem;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="9" y1="15" x2="15" y2="15"></line>
        </svg>
        <h2 style="color:#212529; margin-bottom:0.5rem;">Document File Missing</h2>
        <p style="margin-bottom:1.5rem; max-width:400px; margin-left:auto; margin-right:auto;">
          The physical PDF file for this record could not be found on the server.
        </p>
        <div style="background:#fff; border:1px solid #dee2e6; border-radius:8px; padding:1rem; display:inline-block; text-align:left;">
          <ul style="margin:0; padding-left:1.2rem; color:#868e96; font-size:14px;">
            <li style="margin-bottom:0.5rem;">Database record is intact.</li>
            <li style="margin-bottom:0.5rem;">File is absent from <code style="background:#f1f3f5; padding:2px 4px; border-radius:4px;">backend/uploads/</code>.</li>
            <li><strong>Fix:</strong> Please delete and re-upload this document.</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});

// â”€â”€ AUTO-CREATE users table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    role ENUM('admin','manager','member') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) { console.log("Users table error:", err); return; }
  console.log("âœ… Users table ready");

  // auto-create sellers table
  db.query(`
    CREATE TABLE IF NOT EXISTS sellers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      country VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      product VARCHAR(255),
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) { console.log("sellers table error:", err); return; }
    console.log("âœ… sellers table ready");

    // auto-create seller_documents table
    db.query(`
      CREATE TABLE IF NOT EXISTS seller_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(255) NULL,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) { console.log("seller_documents table error:", err); return; }
      console.log("âœ… seller_documents table ready");
      db.query("ALTER TABLE seller_documents ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE", (alterErr) => {
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("seller_documents is_deleted alter error:", alterErr);
      });
      db.query("ALTER TABLE seller_documents ADD COLUMN deleted_at DATETIME", (alterErr) => {
        if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("seller_documents deleted_at alter error:", alterErr);
      });
    });
  });

  // auto-create buyers table
  db.query(`
    CREATE TABLE IF NOT EXISTS buyers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_name VARCHAR(255),
      company_name VARCHAR(255),
      country VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      address TEXT,
      notes TEXT,
      products TEXT,
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) { console.log("buyers table error:", err); return; }
    console.log("✅ buyers table ready");

    // auto-create buyer_documents table
    db.query(`
      CREATE TABLE IF NOT EXISTS buyer_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        buyer_id INT NOT NULL,
        company_name VARCHAR(255) NULL,
        product_name VARCHAR(255) NULL,
        document_type VARCHAR(255) NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(255) NULL,
        file_binary LONGBLOB NULL,
        file_path_zh VARCHAR(255) NULL,
        file_zh_binary LONGBLOB NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(255) NULL,
        FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) { console.log("buyer_documents table error:", err); return; }
      console.log("âœ… buyer_documents table ready");
    });
  });

  // auto-create inquiries table
  db.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      buyer_name VARCHAR(255),
      company_name VARCHAR(255),
      country VARCHAR(100),
      email VARCHAR(255),
      phone VARCHAR(50),
      products TEXT,
      inquiry_date DATE,
      source VARCHAR(100),
      status VARCHAR(100),
      notes TEXT,
      buyer_quality_rating VARCHAR(100),
      is_deleted BOOLEAN DEFAULT FALSE,
      deleted_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) { console.log("inquiries table error:", err); return; }
    console.log("âœ… inquiries table ready");
  });

  // Idempotent migration for inquiries soft-delete columns
  db.query("ALTER TABLE inquiries ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE", (alterErr) => {
    if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("inquiries is_deleted alter error:", alterErr);
  });
  db.query("ALTER TABLE inquiries ADD COLUMN deleted_at DATETIME", (alterErr) => {
    if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("inquiries deleted_at alter error:", alterErr);
  });
  db.query("ALTER TABLE inquiries ADD COLUMN deleted_by VARCHAR(255)", (alterErr) => {
    if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("inquiries deleted_by alter error:", alterErr);
  });
  db.query("ALTER TABLE inquiries ADD COLUMN restored_at DATETIME", (alterErr) => {
    if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("inquiries restored_at alter error:", alterErr);
  });
  db.query("ALTER TABLE inquiries ADD COLUMN restored_by VARCHAR(255)", (alterErr) => {
    if (alterErr && alterErr.code !== 'ER_DUP_FIELDNAME') console.log("inquiries restored_by alter error:", alterErr);
  });

  // seed default admin if table is empty
  db.query("SELECT COUNT(*) as count FROM users", (err, result) => {
    if (!err && result[0].count === 0) {
      db.query(
        "INSERT INTO users (full_name, username, password, role) VALUES (?,?,?,?)",
        ["Vikram Singh", "admin", "12345", "admin"],
        (err) => { if (!err) console.log("âœ… Default admin: admin / 12345"); }
      );
    }
  });
});

// â”€â”€ Activity helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const addActivity = (type, title, description) => {
  db.query("INSERT INTO crm_activity (type, title, description) VALUES (?,?,?)", [type, title, description]);
};

// =============================================================================
//  AUTH
// =============================================================================

// POST /login
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const ipAddr = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
  const ua     = req.headers["user-agent"] || "";

  db.query(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (result.length === 0) {
        // Record failed login
        db.query("INSERT INTO login_history (username, ip_address, user_agent, status) VALUES (?,?,?,?)",
          [username, ipAddr, ua, "failed"], () => {});
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result[0];

      // Record successful login
      db.query("INSERT INTO login_history (user_id, username, ip_address, user_agent, status) VALUES (?,?,?,?,?)",
        [user.id, user.username, ipAddr, ua, "success"], () => {});

      // Issue HttpOnly secure cookie for shared CRM/DocPlatform session
      const token = signToken({ id: user.id, username: user.username, role: user.role });
      
      // Store token in active sessions table
      db.query("INSERT INTO sessions (user_id, token, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 1 DAY))",
        [user.id, token, ipAddr, ua], () => {});

      res.cookie("crm_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ id: user.id, full_name: user.full_name, username: user.username, role: user.role });
    }
  );
});

// GET /users
app.get("/users", (req, res) => {
  db.query("SELECT id, full_name, username, role, created_at FROM users", (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json(result);
  });
});

// POST /users
app.post("/users", (req, res) => {
  const { full_name, username, password, role } = req.body;
  if (!full_name || !username || !password || !role)
    return res.status(400).json({ error: "All fields required" });

  db.query(
    "INSERT INTO users (full_name, username, password, role) VALUES (?,?,?,?)",
    [full_name, username, password, role],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "Username already exists" });
        return res.status(500).json({ error: "Server error" });
      }
      res.json({ id: result.insertId, full_name, username, role });
    }
  );
});

// PUT /users/:id
app.put("/users/:id", (req, res) => {
  const { full_name, username, password, role } = req.body;
  const sql = password
    ? "UPDATE users SET full_name=?, username=?, password=?, role=? WHERE id=?"
    : "UPDATE users SET full_name=?, username=?, role=? WHERE id=?";
  const params = password
    ? [full_name, username, password, role, req.params.id]
    : [full_name, username, role, req.params.id];

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json({ message: "User updated" });
  });
});

// DELETE /users/:id
app.delete("/users/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Server error" });
    res.json({ message: "User deleted" });
  });
});

// =============================================================================
//  GENERATE DOC
// =============================================================================
app.post("/generate-doc", (req, res) => {
  if (!req.body) return res.status(400).send("No data received");
  const template_id = req.body.template_id;
  if (!template_id) return res.status(400).send("Template ID missing");

  const { buyer_company, buyer_name, buyer_email, buyer_phone,
          product_name, price, contract_quantity, date, company_name } = req.body;

  db.query("SELECT * FROM templates WHERE id=?", [template_id], (err, result) => {
    if (err) return res.send(err);
    if (result.length === 0) return res.send("Template not found");

    const fullPath = path.join(__dirname, result[0].file_path);
    const content  = fs.readFileSync(fullPath, "binary");
    const zip      = new PizZip(content);
    const doc      = new Docxtemplater(zip);
    doc.setData({ buyer_company, buyer_name, buyer_email, buyer_phone,
                  product_name, price, contract_quantity, date, company_name });
    try { doc.render(); } catch (e) { return res.send("Template error"); }

    const outputPath = path.join(__dirname, "output", Date.now() + ".docx");
    fs.writeFileSync(outputPath, doc.getZip().generate({ type: "nodebuffer" }));
    res.download(outputPath);
  });
});

// =============================================================================
//  SELLERS
// =============================================================================
app.get("/sellers", (req, res) => {
  db.query("SELECT * FROM sellers WHERE is_deleted = FALSE OR is_deleted IS NULL", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});

app.get("/sellers/recycle-bin", (req, res) => {
  db.query("SELECT * FROM sellers WHERE is_deleted = TRUE", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/sellers", (req, res) => {
  const { name, country, email, phone, product } = req.body;
  db.query("INSERT INTO sellers (name,country,email,phone,product) VALUES (?,?,?,?,?)",
    [name, country, email, phone, product], (err, result) => {
      if (err) return res.send(err);
      addActivity("seller", "Seller added", `${name} - ${product}`);
      res.json({ id: result.insertId, message: "Seller Added" });
    });
});
app.put("/sellers/:id", (req, res) => {
  const { name, country, email, phone, product } = req.body;
  db.query("UPDATE sellers SET name=?,country=?,email=?,phone=?,product=? WHERE id=?",
    [name, country, email, phone, product, req.params.id], (err) => {
      if (err) return res.send(err);
      res.send("Seller Updated");
    });
});
app.post("/sellers/:id/delete", (req, res) => {
  db.query("UPDATE sellers SET is_deleted = TRUE, deleted_at = NOW() WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Seller Soft Deleted");
  });
});

app.post("/sellers/:id/restore", (req, res) => {
  db.query("UPDATE sellers SET is_deleted = FALSE, deleted_at = NULL WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Seller Restored");
  });
});

app.delete("/sellers/:id/permanent", (req, res) => {
  const sellerId = req.params.id;
  db.query("SELECT name FROM sellers WHERE id = ?", [sellerId], (err, sellerRes) => {
    if (err || sellerRes.length === 0) return res.status(404).send("Seller not found");
    const sellerName = sellerRes[0].name;

    const queries = [
      new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM account_transactions WHERE seller_id = ?", [sellerId], (err, res) => err ? reject(err) : resolve(res[0].count));
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM seller_documents WHERE seller_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)", [sellerId], (err, res) => err ? reject(err) : resolve(res[0].count));
      }),
      new Promise((resolve, reject) => {
        db.query("SELECT COUNT(*) AS count FROM seller_inquiries WHERE seller_name = ?", [sellerName], (err, res) => err ? reject(err) : resolve(res[0].count));
      })
    ];

    Promise.all(queries).then(results => {
      const totalRefs = results.reduce((a, b) => a + b, 0);
      if (totalRefs > 0) {
        return res.status(400).json({ error: "This seller is linked to historical business records and cannot be permanently deleted." });
      }
      
      db.query("DELETE FROM sellers WHERE id=?", [sellerId], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Seller Permanently Deleted");
      });
    }).catch(err => {
      res.status(500).send("Error checking references");
    });
  });
});

// â”€â”€ Upload documents for a seller â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.post("/sellers/:id/documents", upload.array("documents"), (req, res) => {
  const sellerId = req.params.id;
  const uploaded_by = req.body.uploaded_by || "System";
  
  db.query("SELECT name, product FROM sellers WHERE id = ?", [sellerId], (err, result) => {
    if (err || result.length === 0) return res.status(500).send("Seller not found");
    const seller = result[0];
    
    if (req.files && req.files.length > 0) {
      const insertDocsSql = "INSERT INTO seller_documents (seller_id, company_name, product_name, file_name, file_path, uploaded_by) VALUES ?";
      const values = req.files.map(file => [
        sellerId,
        seller.name,
        seller.product,
        file.originalname,
        file.filename,
        uploaded_by
      ]);
      db.query(insertDocsSql, [values], (err) => {
        if (err) return res.status(500).send(err);
        res.send("Documents Uploaded");
      });
    } else {
      res.send("No Documents to Upload");
    }
  });
});

// â”€â”€ Get seller profile with documents hierarchy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/sellers/:id/profile", (req, res) => {
  const sellerId = req.params.id;
  
  db.query("SELECT * FROM sellers WHERE id = ?", [sellerId], (err, sellerResult) => {
    if (err) return res.status(500).send(err);
    if (sellerResult.length === 0) return res.status(404).send("Seller not found");
    
    const seller = sellerResult[0];
    
    db.query("SELECT * FROM seller_documents WHERE seller_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)", [sellerId], (err, docResult) => {
      if (err) return res.status(500).send(err);
      
      const companyMap = {};
      const uniqueProducts = new Set();
      const uniqueCompanies = new Set();
      
      docResult.forEach(doc => {
        uniqueCompanies.add(doc.company_name);
        uniqueProducts.add(`${doc.company_name}::${doc.product_name}`);
        
        if (!companyMap[doc.company_name]) {
          companyMap[doc.company_name] = {
            company_name: doc.company_name,
            products: {}
          };
        }
        
        if (!companyMap[doc.company_name].products[doc.product_name]) {
          companyMap[doc.company_name].products[doc.product_name] = {
            product_name: doc.product_name,
            documents: []
          };
        }
        
        companyMap[doc.company_name].products[doc.product_name].documents.push({
          id: doc.id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
          uploaded_by: doc.uploaded_by
        });
      });
      
      const companiesList = Object.values(companyMap).map(c => ({
        company_name: c.company_name,
        products: Object.values(c.products)
      }));
      
      res.json({
        seller: {
          id: seller.id,
          name: seller.name,
          country: seller.country,
          email: seller.email,
          phone: seller.phone,
          product: seller.product
        },
        stats: {
          total_companies: uniqueCompanies.size || 1,
          total_products: uniqueProducts.size || (seller.product ? 1 : 0),
          total_documents: docResult.length
        },
        companies: companiesList
      });
    });
  });
});

// POST â€” soft delete seller document
app.post("/seller-documents/:id/delete", (req, res) => {
  db.query("UPDATE seller_documents SET is_deleted = 1, deleted_at = NOW() WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// â”€â”€ Download endpoint â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
app.get("/seller-documents/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "uploads/seller_documents", filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found");
  }
  
  db.query("SELECT file_name FROM seller_documents WHERE file_path = ?", [filename], (err, result) => {
    let serveName = filename;
    if (!err && result.length > 0) {
      serveName = result[0].file_name;
    }
    res.download(filePath, serveName);
  });
});
// ============================================================
//  JOT CRM â€” Updated Buyers Routes (server.js / routes/buyers.js)
//  Replace your existing buyers GET/POST/PUT routes with these
// ============================================================

// GET all active buyers
app.get('/buyers', (req, res) => {
  db.query('SELECT * FROM buyers WHERE is_deleted = FALSE OR is_deleted IS NULL ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET all soft-deleted buyers
app.get('/buyers/recycle-bin', (req, res) => {
  db.query('SELECT * FROM buyers WHERE is_deleted = TRUE ORDER BY deleted_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST â€” add new buyer
app.post('/buyers', (req, res) => {
  const { buyer_name, company_name, country, email, phone, address, notes, products } = req.body;
  const sql = `
    INSERT INTO buyers (buyer_name, company_name, country, email, phone, address, notes, products)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [buyer_name, company_name, country || '', email, phone || '', address, notes, products], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: result.insertId });
  });
});

// POST — upload buyer documents (called after buyer creation)
app.post("/buyer-documents/upload", memoryUpload.fields([{ name: 'file', maxCount: 1 }, { name: 'file_zh', maxCount: 1 }]), (req, res) => {
  const { buyer_id, company_name, product_name, document_type, uploaded_by } = req.body;
  if (!buyer_id) return res.status(400).json({ error: "Buyer ID is required" });

  const file = req.files && req.files['file'] ? req.files['file'][0] : null;
  const fileZh = req.files && req.files['file_zh'] ? req.files['file_zh'][0] : null;

  if (!file) {
    return res.status(400).json({ error: "No primary English PDF provided." });
  }

  // 1. Validate PDF magic bytes
  try {
    const buffer = file.buffer;
    if (buffer.length < 4 || buffer.slice(0, 4).toString('ascii') !== '%PDF') {
      return res.status(400).json({ error: "The uploaded file is not a valid PDF document." });
    }
    
    if (fileZh) {
      const zhBuffer = fileZh.buffer;
      if (zhBuffer.length < 4 || zhBuffer.slice(0, 4).toString('ascii') !== '%PDF') {
        return res.status(400).json({ error: "The uploaded Chinese file is not a valid PDF document." });
      }
    }
  } catch (e) {
    return res.status(400).json({ error: "The uploaded file is not a valid PDF document." });
  }

  // 2. Valid file, insert into DB
  const sql = `
    INSERT INTO buyer_documents (buyer_id, company_name, product_name, document_type, file_name, file_path, file_binary, file_path_zh, file_zh_binary, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    buyer_id, 
    company_name || null, 
    product_name || null, 
    document_type || null, 
    file.originalname, 
    file.originalname, // Fallback for file_path
    file.buffer,
    fileZh ? fileZh.originalname : null,
    fileZh ? fileZh.buffer : null,
    uploaded_by || null
  ];
  
  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Upload DB Error:", err);
      return res.status(500).json({ success: false, message: "File failed to upload to DB.", error: err.message });
    }
    res.json({ success: true, message: "Documents uploaded successfully." });
  });
});

// GET — download buyer document
app.get("/buyer-documents/download/:id", (req, res) => {
  const { id } = req.params;
  const lang = req.query.language || 'en';
  
  db.query("SELECT file_name, file_binary, file_path_zh, file_zh_binary FROM buyer_documents WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).send("Document not found");
    
    const doc = results[0];
    let binary = doc.file_binary;
    let fileName = doc.file_name;
    
    if (lang === 'zh' && doc.file_zh_binary) {
      binary = doc.file_zh_binary;
      fileName = doc.file_path_zh || fileName;
    }
    
    if (!binary) return res.status(404).send("File binary not found in database.");

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(binary);
  });
});

// GET — preview buyer document
app.get("/buyer-documents/preview/:id", (req, res) => {
  const { id } = req.params;
  const lang = req.query.language || 'en';
  
  db.query("SELECT file_binary, file_zh_binary FROM buyer_documents WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).send("Document not found");
    
    const doc = results[0];
    let binary = doc.file_binary;
    
    if (lang === 'zh' && doc.file_zh_binary) {
      binary = doc.file_zh_binary;
    }
    
    if (!binary) return res.status(404).send("File binary not found in database.");

    res.setHeader('Content-Type', 'application/pdf');
    res.send(binary);
  });
});

// GET â€” list buyer documents
app.get("/buyer-documents/:buyer_id", (req, res) => {
  db.query("SELECT * FROM buyer_documents WHERE buyer_id = ? AND is_deleted = 0 ORDER BY uploaded_at DESC", [req.params.buyer_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST â€” soft delete buyer document
app.post("/buyer-documents/:id/delete", (req, res) => {
  db.query("UPDATE buyer_documents SET is_deleted = 1, deleted_at = NOW() WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// PUT â€” update buyer
app.put('/buyers/:id', (req, res) => {
  const { buyer_name, company_name, country, email, phone, address, notes, products } = req.body;
  const sql = `
    UPDATE buyers
    SET buyer_name = ?, company_name = ?, country = ?, email = ?, phone = ?,
        address = ?, notes = ?, products = ?
    WHERE id = ?
  `;
  db.query(sql, [buyer_name, company_name, country || '', email, phone || '', address, notes, products, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// POST â€” soft delete buyer
app.post('/buyers/:id/delete', (req, res) => {
  db.query('UPDATE buyers SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// POST â€” restore buyer
app.post('/buyers/:id/restore', (req, res) => {
  db.query('UPDATE buyers SET is_deleted = FALSE, deleted_at = NULL WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// =============================================================================
//  COMPANIES
// =============================================================================
app.get("/companies", (req, res) => {
  db.query("SELECT * FROM companies", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/companies", (req, res) => {
  const { name, address, bank_details } = req.body;
  db.query("INSERT INTO companies (name,address,bank_details) VALUES (?,?,?)",
    [name, address, bank_details], (err) => {
      if (err) return res.send(err);
      res.send("Company Added");
    });
});

// =============================================================================
//  TEMPLATES
// =============================================================================
const templateStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "templates/"),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const templateUpload = multer({ storage: templateStorage });

app.post("/upload-template", templateUpload.single("file"), (req, res) => {
  db.query("INSERT INTO templates (name,file_path) VALUES (?,?)",
    [req.body.name, req.file.path], (err) => {
      if (err) return res.send(err);
      res.send("Template Uploaded");
    });
});

// =============================================================================
//  INQUIRIES
// =============================================================================
app.get("/inquiries", (req, res) => {
  db.query("SELECT * FROM inquiries WHERE is_deleted = FALSE OR is_deleted IS NULL ORDER BY id DESC", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/inquiries", (req, res) => {
  const { inquiry_date, inquiry_source, buyer_name, product_name,
          query_executor, initial_contact_method, response_status,
          buyer_quality_rating, remarks, remark_done } = req.body;

  if (!inquiry_date || !inquiry_source || !buyer_name || !product_name ||
      !query_executor || !initial_contact_method || !response_status || !buyer_quality_rating)
    return res.status(400).send("Please fill all fields");

  db.query(
    `INSERT INTO inquiries (inquiry_date,inquiry_source,buyer_name,product_name,
      query_executor,initial_contact_method,response_status,buyer_quality_rating,
      remarks,remark_done) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    [inquiry_date, inquiry_source, buyer_name, product_name, query_executor,
     initial_contact_method, response_status, buyer_quality_rating,
     remarks || "", remark_done || false],
    (err) => {
      if (err) return res.send(err);
      addActivity("inquiry", "New inquiry received", `${buyer_name} - ${product_name}`);
      res.send("Inquiry Added");
    }
  );
});
app.put("/inquiries/:id", (req, res) => {
  const { inquiry_date, inquiry_source, buyer_name, product_name,
          query_executor, initial_contact_method, response_status,
          buyer_quality_rating, remarks, remark_done } = req.body;
  db.query(
    `UPDATE inquiries SET inquiry_date=?,inquiry_source=?,buyer_name=?,product_name=?,
      query_executor=?,initial_contact_method=?,response_status=?,buyer_quality_rating=?,
      remarks=?,remark_done=? WHERE id=?`,
    [inquiry_date, inquiry_source, buyer_name, product_name, query_executor,
     initial_contact_method, response_status, buyer_quality_rating,
     remarks, remark_done, req.params.id],
    (err) => {
      if (err) return res.send(err);
      res.send("Inquiry Updated");
    }
  );
});
app.delete("/inquiries/:id", (req, res) => {
  const deletedBy = req.headers["x-user-name"] || "Unknown";
  db.query("UPDATE inquiries SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id = ?", [deletedBy, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Inquiry Deleted");
  });
});

app.post("/inquiries/:id/restore", (req, res) => {
  const restoredBy = req.headers["x-user-name"] || "Unknown";
  db.query("UPDATE inquiries SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, restored_at = NOW(), restored_by = ? WHERE id = ?", [restoredBy, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Inquiry Restored");
  });
});

app.delete("/inquiries/:id/permanent", (req, res) => {
  const role = req.headers["x-user-role"];
  const username = req.headers["x-user-name"] || "Unknown";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  db.query("DELETE FROM inquiries WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    addActivity("inquiry", "Permanent Delete", `Inquiry #${req.params.id} permanently deleted by ${username}`);
    res.send("Inquiry Permanently Deleted");
  });
});

app.get("/inquiries/recycle-bin/all", (req, res) => {
  db.query("SELECT * FROM inquiries WHERE is_deleted = TRUE ORDER BY deleted_at DESC, id DESC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// =============================================================================
//  EVENTS
// =============================================================================
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY date ASC, time ASC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});
app.post("/events", (req, res) => {
  const { title, description, date, time, type, user } = req.body;
  if (!title || !date) return res.status(400).send("Title and date required");
  db.query(
    "INSERT INTO events (title,description,date,time,type,user) VALUES (?,?,?,?,?,?)",
    [title, description || "", date, time || "00:00", type || "Meeting", user || ""],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, title, description, date, time, type, user });
    }
  );
});
app.put("/events/:id", (req, res) => {
  const { title, description, date, time, type, user } = req.body;
  db.query(
    "UPDATE events SET title=?,description=?,date=?,time=?,type=?,user=? WHERE id=?",
    [title, description || "", date, time || "00:00", type || "Meeting", user || "", req.params.id],
    (err) => {
      if (err) return res.status(500).send(err);
      res.send("Event updated");
    }
  );
});
app.delete("/events/:id", (req, res) => {
  db.query("DELETE FROM events WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Event deleted");
  });
});

// =============================================================================
//  HISTORY
// =============================================================================
app.post("/history", (req, res) => {
  const { inquiry_id, action_type, action_by } = req.body;
  db.query("INSERT INTO inquiry_history (inquiry_id,action_type,action_by) VALUES (?,?,?)",
    [inquiry_id, action_type, action_by], (err) => {
      if (err) return res.send(err);
      res.send("History Added");
    });
});
app.get("/history/:id", (req, res) => {
  db.query("SELECT * FROM inquiry_history WHERE inquiry_id=? ORDER BY id DESC",
    [req.params.id], (err, result) => {
      if (err) return res.send(err);
      res.json(result);
    });
});

// =============================================================================
//  ACTIVITIES
// =============================================================================
app.get("/activities", (req, res) => {
  db.query("SELECT * FROM crm_activity ORDER BY id DESC LIMIT 5", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
// â”€â”€ ADD THIS ROUTE TO server.js (paste before app.listen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// PUT /users/:id/password  â€” change password with current password verification
app.put("/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password)
    return res.status(400).json({ error: "Both current and new password required" });

  // First verify current password is correct
  db.query("SELECT * FROM users WHERE id=? AND password=?", [id, current_password], (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (result.length === 0)
      return res.status(401).json({ error: "Current password is incorrect" });

    // Update to new password
    db.query("UPDATE users SET password=? WHERE id=?", [new_password, id], (err) => {
      if (err) return res.status(500).json({ error: "Failed to update password" });
      res.json({ message: "Password updated successfully" });
    });
  });
});
// UPDATE company
app.put("/companies/:id", (req, res) => {
  const { name, address, bank_details, email, phone, website, contact_person, industry } = req.body;
  const sql = `UPDATE companies SET name=?, address=?, bank_details=?, email=?, phone=?, website=?, contact_person=?, industry=? WHERE id=?`;
  db.query(sql, [name, address, bank_details, email, phone, website, contact_person, industry, req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Company Updated");
  });
});

// DELETE company
app.delete("/companies/:id", (req, res) => {
  db.query("DELETE FROM companies WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Company Deleted");
  });
});
// GET /messages â€” general or DM
app.get("/messages", (req, res) => {
  const { channel } = req.query;
  const me   = parseInt(req.query.me   || 0);
  const withUser = parseInt(req.query.with || 0);
 
  if (channel === "general") {
    // All general messages, forever, oldest first
    db.query(
      `SELECT * FROM messages
       WHERE channel = 'general'
       ORDER BY id ASC`,
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
 
  } else if (channel === "dm" && me && withUser) {
    // DM: messages between exactly these two users in both directions
    db.query(
      `SELECT * FROM messages
       WHERE channel = 'dm'
          AND (
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
          )
       ORDER BY id ASC`,
      [me, withUser, withUser, me],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
 
  } else {
    res.json([]);
  }
});
 
// POST /messages â€” send a message
app.post("/messages", (req, res) => {
  const { sender_id, sender_name, channel, receiver_id, message } = req.body;
 
  if (!sender_id || !sender_name || !message)
    return res.status(400).json({ error: "sender_id, sender_name and message are required" });
 
  db.query(
    "INSERT INTO messages (sender_id, sender_name, channel, receiver_id, message) VALUES (?,?,?,?,?)",
    [sender_id, sender_name, channel || "general", receiver_id || null, message],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, sender_id, sender_name, channel, receiver_id, message });
    }
  );
});
 
// DELETE /messages/:id â€” admin or own message
app.delete("/messages/:id", (req, res) => {
  db.query("DELETE FROM messages WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Message deleted");
  });
});
/* ============================================================
   Add these 2 routes to server.js BEFORE app.listen
   ============================================================ */

// GET /messages/unread â€” returns total unread and breakdown by sender/channel
app.get("/messages/unread", (req, res) => {
  const userId = parseInt(req.query.userId || 0);
  if (!userId) return res.json({ total: 0, senders: [] });

  db.query(
    `SELECT m.sender_id, m.sender_name, m.channel, COUNT(*) AS count 
     FROM messages m 
     LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ?
     WHERE mr.message_id IS NULL
       AND m.sender_id != ?
       AND (
         m.channel = 'general'
         OR (m.channel = 'dm' AND m.receiver_id = ?)
       )
     GROUP BY m.sender_id, m.sender_name, m.channel`,
    [userId, userId, userId],
    (err, results) => {
      if (err) return res.status(500).json({ total: 0, senders: [] });
      let total = 0;
      results.forEach(row => total += row.count);
      res.json({ total, senders: results });
    }
  );
});

// POST /messages/read â€” mark messages in a conversation as read for a user
app.post("/messages/read", (req, res) => {
  const { userId, channel, withUser } = req.body;
  if (!userId || !channel) return res.status(400).json({ error: "Missing parameters" });

  let sql = `INSERT IGNORE INTO message_reads (message_id, user_id) 
             SELECT m.id, ? FROM messages m 
             LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = ? 
             WHERE mr.message_id IS NULL AND m.sender_id != ? AND m.channel = ?`;
  let params = [userId, userId, userId, channel];

  if (channel === 'dm') {
    if (!withUser) return res.status(400).json({ error: "Missing withUser" });
    sql += ` AND m.sender_id = ? AND m.receiver_id = ?`;
    params.push(withUser, userId);
  }

  db.query(sql, params, (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ success: true });
  });
});

// =============================================================================
//  HISTORY
// =============================================================================
app.post("/history", (req, res) => {
  const { inquiry_id, action_type, action_by } = req.body;
  db.query("INSERT INTO inquiry_history (inquiry_id,action_type,action_by) VALUES (?,?,?)",
    [inquiry_id, action_type, action_by], (err) => {
      if (err) return res.send(err);
      res.send("History Added");
    });
});
app.get("/history/:id", (req, res) => {
  db.query("SELECT * FROM inquiry_history WHERE inquiry_id=? ORDER BY id DESC",
    [req.params.id], (err, result) => {
      if (err) return res.send(err);
      res.json(result);
    });
});

// =============================================================================
//  ACTIVITIES
// =============================================================================
app.get("/activities", (req, res) => {
  db.query("SELECT * FROM crm_activity ORDER BY id DESC LIMIT 5", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
// â”€â”€ ADD THIS ROUTE TO server.js (paste before app.listen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// PUT /users/:id/password  â€” change password with current password verification
app.put("/users/:id/password", (req, res) => {
  const { id } = req.params;
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password)
    return res.status(400).json({ error: "Both current and new password required" });

  // First verify current password is correct
  db.query("SELECT * FROM users WHERE id=? AND password=?", [id, current_password], (err, result) => {
    if (err) return res.status(500).json({ error: "Server error" });
    if (result.length === 0)
      return res.status(401).json({ error: "Current password is incorrect" });

    // Update to new password
    db.query("UPDATE users SET password=? WHERE id=?", [new_password, id], (err) => {
      if (err) return res.status(500).json({ error: "Failed to update password" });
      res.json({ message: "Password updated successfully" });
    });
  });
});
// UPDATE company
app.put("/companies/:id", (req, res) => {
  const { name, address, bank_details, email, phone, website, contact_person, industry } = req.body;
  const sql = `UPDATE companies SET name=?, address=?, bank_details=?, email=?, phone=?, website=?, contact_person=?, industry=? WHERE id=?`;
  db.query(sql, [name, address, bank_details, email, phone, website, contact_person, industry, req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Company Updated");
  });
});

// DELETE company
app.delete("/companies/:id", (req, res) => {
  db.query("DELETE FROM companies WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Company Deleted");
  });
});
// GET /messages â€” general or DM
app.get("/messages", (req, res) => {
  const { channel } = req.query;
  const me   = parseInt(req.query.me   || 0);
  const withUser = parseInt(req.query.with || 0);
 
  if (channel === "general") {
    // All general messages, forever, oldest first
    db.query(
      `SELECT * FROM messages
       WHERE channel = 'general'
       ORDER BY id ASC`,
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
 
  } else if (channel === "dm" && me && withUser) {
    // DM: messages between exactly these two users in both directions
    db.query(
      `SELECT * FROM messages
       WHERE channel = 'dm'
          AND (
            (sender_id = ? AND receiver_id = ?)
            OR
            (sender_id = ? AND receiver_id = ?)
          )
       ORDER BY id ASC`,
      [me, withUser, withUser, me],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
      }
    );
 
  } else {
    res.json([]);
  }
});
 
// POST /messages â€” send a message
app.post("/messages", (req, res) => {
  const { sender_id, sender_name, channel, receiver_id, message } = req.body;
 
  if (!sender_id || !sender_name || !message)
    return res.status(400).json({ error: "sender_id, sender_name and message are required" });
 
  db.query(
    "INSERT INTO messages (sender_id, sender_name, channel, receiver_id, message) VALUES (?,?,?,?,?)",
    [sender_id, sender_name, channel || "general", receiver_id || null, message],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, sender_id, sender_name, channel, receiver_id, message });
    }
  );
});
 
// DELETE /messages/:id â€” admin or own message
app.delete("/messages/:id", (req, res) => {
  db.query("DELETE FROM messages WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Message deleted");
  });
});
/* ============================================================
   Add these 2 routes to server.js BEFORE app.listen
   ============================================================ */

// GET /messages/unread â€” count of new messages since lastReadId for this user
// Counts: general messages NOT sent by me + DMs sent TO me
app.get("/messages/unread", (req, res) => {
  const userId     = parseInt(req.query.userId     || 0);
  const lastReadId = parseInt(req.query.lastReadId || 0);

  if (!userId) return res.json({ count: 0 });

  db.query(
    `SELECT COUNT(*) AS count FROM messages
     WHERE id > ?
       AND sender_id != ?
       AND (
         channel = 'general'
         OR (channel = 'dm' AND receiver_id = ?)
       )`,
    [lastReadId, userId, userId],
    (err, result) => {
      if (err) return res.status(500).json({ count: 0 });
      res.json({ count: result[0].count });
    }
  );
});

// GET /messages/latest-id â€” get the highest message id visible to this user
// Used to mark all as read when user opens Messages page
app.get("/messages/latest-id", (req, res) => {
  const userId = parseInt(req.query.userId || 0);

  if (!userId) return res.json({ id: 0 });

  db.query(
    `SELECT MAX(id) AS id FROM messages
     WHERE sender_id != ?
       AND (
         channel = 'general'
         OR (channel = 'dm' AND receiver_id = ?)
       )`,
    [userId, userId],
    (err, result) => {
      if (err) return res.status(500).json({ id: 0 });
      res.json({ id: result[0].id || 0 });
    }
  );
});

// =============================================================================
//  SELLER INQUIRIES
// =============================================================================

// GET all seller inquiries
app.get("/seller-inquiries", (req, res) => {
  db.query("SELECT * FROM seller_inquiries WHERE is_deleted = FALSE OR is_deleted IS NULL ORDER BY id DESC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// POST â€” add new seller inquiry
app.post("/seller-inquiries", (req, res) => {
  const {
    inquiry_date, inquiry_source, seller_name, product_name,
    query_executor, initial_contact_method, response_status,
    seller_quality_rating, offered_price, price_currency,
    price_validity, price_remarks, remarks, remark_done
  } = req.body;

  if (
    !inquiry_date || !inquiry_source || !seller_name || !product_name ||
    !query_executor || !initial_contact_method || !response_status ||
    !seller_quality_rating || !offered_price || !price_currency
  ) return res.status(400).send("Please fill all required fields");

  db.query(
    `INSERT INTO seller_inquiries
      (inquiry_date, inquiry_source, seller_name, product_name,
       query_executor, initial_contact_method, response_status,
       seller_quality_rating, offered_price, price_currency,
       price_validity, price_remarks, remarks, remark_done)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      inquiry_date, inquiry_source, seller_name, product_name,
      query_executor, initial_contact_method, response_status,
      seller_quality_rating, offered_price, price_currency,
      price_validity || "", price_remarks || "",
      remarks || "", remark_done || false
    ],
    (err, result) => {
      if (err) return res.status(500).send(err);
      addActivity("seller_inquiry", "New seller inquiry", `${seller_name} - ${product_name}`);
      res.json({ id: result.insertId });
    }
  );
});

// PUT â€” update seller inquiry
app.put("/seller-inquiries/:id", (req, res) => {
  const {
    inquiry_date, inquiry_source, seller_name, product_name,
    query_executor, initial_contact_method, response_status,
    seller_quality_rating, offered_price, price_currency,
    price_validity, price_remarks, remarks, followup, remark_done
  } = req.body;

  db.query(
    `UPDATE seller_inquiries SET
      inquiry_date=?, inquiry_source=?, seller_name=?, product_name=?,
      query_executor=?, initial_contact_method=?, response_status=?,
      seller_quality_rating=?, offered_price=?, price_currency=?,
      price_validity=?, price_remarks=?, remarks=?, followup=?, remark_done=?
     WHERE id=?`,
    [
      inquiry_date, inquiry_source, seller_name, product_name,
      query_executor, initial_contact_method, response_status,
      seller_quality_rating, offered_price, price_currency,
      price_validity || "", price_remarks || "",
      remarks || "", followup || "", remark_done || false,
      req.params.id
    ],
    (err) => {
      if (err) return res.status(500).send(err);
      res.json({ success: true });
    }
  );
});

// DELETE â€” seller inquiry (Soft Delete)
app.delete("/seller-inquiries/:id", (req, res) => {
  const deletedBy = req.headers["x-user-name"] || "Unknown";
  db.query("UPDATE seller_inquiries SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = ? WHERE id = ?", [deletedBy, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

app.get("/seller-inquiries/recycle-bin", require("./docplatform_auth").authenticateCRMUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin role required." });
  db.query("SELECT * FROM seller_inquiries WHERE is_deleted = TRUE ORDER BY deleted_at DESC, id DESC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

app.post("/seller-inquiries/:id/restore", require("./docplatform_auth").authenticateCRMUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin role required." });
  const restoredBy = req.user.username || "Unknown";
  db.query("UPDATE seller_inquiries SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL, restored_at = NOW(), restored_by = ? WHERE id = ?", [restoredBy, req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true, message: "Inquiry Restored" });
  });
});

app.delete("/seller-inquiries/:id/permanent", require("./docplatform_auth").authenticateCRMUser, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Access denied. Admin role required." });
  const username = req.user.username || "Unknown";
  db.query("DELETE FROM seller_inquiries WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    addActivity("seller_inquiry", "Permanent Delete", `Seller Inquiry #${req.params.id} permanently deleted by ${username}`);
    res.json({ success: true, message: "Inquiry Permanently Deleted" });
  });
});

// =============================================================================
// DocPlatform routing
app.use("/docplatform", express.static(path.join(__dirname, "public/docplatform")));
app.use("/docplatform", (req, res) => {
  res.sendFile(path.join(__dirname, "public/docplatform/index.html"));
});
app.use("/doc-api", require("./docplatform_router"));

// GET - fetch full buyer profile and documents
app.get("/buyers/:id/profile", (req, res) => {
  const buyerId = req.params.id;
  
  db.query("SELECT * FROM buyers WHERE id = ?", [buyerId], (err, buyerResult) => {
    if (err) return res.status(500).send(err);
    if (buyerResult.length === 0) return res.status(404).send("Buyer not found");
    
    const buyer = buyerResult[0];
    
    db.query("SELECT * FROM buyer_documents WHERE buyer_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)", [buyerId], (err, docResult) => {
      if (err) return res.status(500).send(err);
      
      const companyMap = {};
      const uniqueProducts = new Set();
      const uniqueCompanies = new Set();
      
      docResult.forEach(doc => {
        uniqueCompanies.add(doc.company_name);
        uniqueProducts.add(`${doc.company_name}::${doc.product_name}`);
        
        if (!companyMap[doc.company_name]) {
          companyMap[doc.company_name] = {
            company_name: doc.company_name,
            products: {}
          };
        }
        
        if (!companyMap[doc.company_name].products[doc.product_name]) {
          companyMap[doc.company_name].products[doc.product_name] = {
            product_name: doc.product_name,
            documents: []
          };
        }
        
        companyMap[doc.company_name].products[doc.product_name].documents.push({
          id: doc.id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
          uploaded_by: doc.uploaded_by
        });
      });
      
      const companiesList = Object.values(companyMap).map(c => ({
        company_name: c.company_name,
        products: Object.values(c.products)
      }));
      
      res.json({
        buyer: {
          id: buyer.id,
          name: buyer.name,
          country: buyer.country,
          email: buyer.email,
          phone: buyer.phone,
          product: buyer.product
        },
        stats: {
          total_companies: uniqueCompanies.size || 1,
          total_products: uniqueProducts.size || (buyer.product ? 1 : 0),
          total_documents: docResult.length
        },
        companies: companiesList
      });
    });
  });
});

// =============================================================================
// CUSTOMER LOGS
// =============================================================================

// GET all contacts (buyers & sellers) who have logs
app.get("/customer-logs/contacts", (req, res) => {
  const buyersSql = `
    SELECT DISTINCT b.id, b.buyer_name as name, b.company_name, 'buyer' as type
    FROM buyers b
    JOIN customer_logs cl ON b.id = cl.buyer_id
    WHERE b.is_deleted = 0 OR b.is_deleted IS NULL
    ORDER BY b.buyer_name ASC
  `;
  const sellersSql = `
    SELECT DISTINCT s.id, s.name as name, s.country as company_name, 'seller' as type
    FROM sellers s
    JOIN customer_logs cl ON s.id = cl.seller_id
    WHERE s.is_deleted = 0 OR s.is_deleted IS NULL
    ORDER BY s.name ASC
  `;
  
  db.query(buyersSql, (err, buyers) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query(sellersSql, (err2, sellers) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ buyers, sellers });
    });
  });
});

// GET logs for a specific contact (type=buyer|seller)
app.get("/customer-logs/:type/:id", (req, res) => {
  const isBuyer = req.params.type === 'buyer';
  const sql = `
    SELECT * FROM customer_logs 
    WHERE ${isBuyer ? 'buyer_id' : 'seller_id'} = ? 
    ORDER BY created_at DESC
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// POST new log for a buyer or seller
app.post("/customer-logs", (req, res) => {
  const { type, contact_id, notes, author_name } = req.body;
  if (!contact_id || !notes || !type) return res.status(400).json({ error: "Type, ID and notes are required" });
  
  const isBuyer = type === 'buyer';
  const sql = `INSERT INTO customer_logs (${isBuyer ? 'buyer_id' : 'seller_id'}, notes, author_name) VALUES (?, ?, ?)`;
  
  db.query(sql, [contact_id, notes, author_name || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query("SELECT * FROM customer_logs WHERE id = ?", [result.insertId], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(result2[0]);
    });
  });
});

// PUT update an existing log
app.put("/customer-logs/:id", (req, res) => {
  const { notes, editor_name } = req.body;
  if (!notes) return res.status(400).json({ error: "Notes are required" });
  
  const sql = "UPDATE customer_logs SET notes = ?, editor_name = ? WHERE id = ?";
  db.query(sql, [notes, editor_name || null, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    db.query("SELECT * FROM customer_logs WHERE id = ?", [req.params.id], (err2, result2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json(result2[0]);
    });
  });
});

// DELETE a customer log
app.delete("/customer-logs/:id", (req, res) => {
  const sql = "DELETE FROM customer_logs WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Log deleted successfully" });
  });
});

app.use(require("./accounts_router"));
app.use("/settings", settingsRouter);

// Auto-migrate schema for developers pulling from GitHub
db.query("ALTER TABLE doc_templates ADD COLUMN engine_type VARCHAR(50) DEFAULT 'legacy_pdf'", (err) => {
  // If error is ER_DUP_FIELDNAME (1060), the column already exists, so we ignore it.
  if (!err) {
    console.log("âœ… Auto-migrated doc_templates: added engine_type column");
  }
});

db.query("ALTER TABLE doc_template_versions ADD COLUMN placeholder_schema LONGTEXT", (err) => { if (!err) console.log("Added placeholder_schema"); });

const createCustomerLogsTable = `
  CREATE TABLE IF NOT EXISTS customer_logs (
    id INT NOT NULL AUTO_INCREMENT,
    buyer_id INT DEFAULT NULL,
    seller_id INT DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    author_name VARCHAR(255) DEFAULT NULL,
    editor_name VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY buyer_id (buyer_id),
    KEY fk_seller_logs_seller_id (seller_id),
    CONSTRAINT customer_logs_ibfk_1 FOREIGN KEY (buyer_id) REFERENCES buyers (id) ON DELETE CASCADE,
    CONSTRAINT fk_seller_logs_seller_id FOREIGN KEY (seller_id) REFERENCES sellers (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
db.query(createCustomerLogsTable, (err) => {
  if (err) console.error("Error creating customer_logs table:", err.message);
  else {
    db.query("ALTER TABLE customer_logs ADD COLUMN author_name VARCHAR(255) DEFAULT NULL", (err) => { if (!err) console.log("Added author_name to customer_logs"); });
    db.query("ALTER TABLE customer_logs ADD COLUMN editor_name VARCHAR(255) DEFAULT NULL", (err) => { if (!err) console.log("Added editor_name to customer_logs"); });
    
    // Auto-patch generated documents table
    db.query("ALTER TABLE doc_generated_document_versions ADD COLUMN edited_html LONGTEXT", (err) => { if (!err) console.log("Added edited_html to doc_generated_document_versions"); });
    db.query("ALTER TABLE doc_generated_document_versions ADD COLUMN custom_annotations JSON", (err) => { if (!err) console.log("Added custom_annotations to doc_generated_document_versions"); });
    db.query("ALTER TABLE doc_generated_document_versions ADD COLUMN edited_count INT DEFAULT 0", (err) => { if (!err) console.log("Added edited_count to doc_generated_document_versions"); });
  }
});

// Serve CRM Frontend static files
app.use(express.static(path.join(__dirname, 'public/crm')));

// Catch-all for CRM frontend React Router (must be last)
app.use((req, res, next) => {
  const skip = ['/api', '/docplatform', '/doc-api', '/uploads', '/settings',
    '/buyers', '/sellers', '/inquiries', '/companies', '/products',
    '/ports', '/notifications', '/dashboard', '/auth', '/analytics'];
  if (skip.some(p => req.url.startsWith(p))) return next();
  const indexPath = path.join(__dirname, 'public/crm/index.html');
  if (require('fs').existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('CRM is still starting up. Please refresh in 30 seconds.');
  }
});

app.listen(5000, () => {
  console.log('ðŸš€ Server running on port 5000');
  require('./notification_cron').initCron();
});

