const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs");
const app = express();
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");

app.use(cors());
app.use(express.json());

// ── AUTO-CREATE users table ───────────────────────────────────────────────────
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
  console.log("✅ Users table ready");
  // seed default admin if table is empty
  db.query("SELECT COUNT(*) as count FROM users", (err, result) => {
    if (!err && result[0].count === 0) {
      db.query(
        "INSERT INTO users (full_name, username, password, role) VALUES (?,?,?,?)",
        ["Vikram Singh", "admin", "12345", "admin"],
        (err) => { if (!err) console.log("✅ Default admin: admin / 12345"); }
      );
    }
  });
});

// ── Activity helper ───────────────────────────────────────────────────────────
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

  db.query(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Server error" });
      if (result.length === 0)
        return res.status(401).json({ error: "Invalid credentials" });

      const user = result[0];
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
  db.query("SELECT * FROM sellers", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/sellers", (req, res) => {
  const { name, country, email, phone, product } = req.body;
  db.query("INSERT INTO sellers (name,country,email,phone,product) VALUES (?,?,?,?,?)",
    [name, country, email, phone, product], (err) => {
      if (err) return res.send(err);
      addActivity("seller", "Seller added", `${name} - ${product}`);
      res.send("Seller Added");
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
app.delete("/sellers/:id", (req, res) => {
  db.query("DELETE FROM sellers WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Seller Deleted");
  });
});

// =============================================================================
//  BUYERS
// =============================================================================
app.get("/buyers", (req, res) => {
  db.query("SELECT * FROM buyers", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/buyers", (req, res) => {
  const { name, country, email } = req.body;
  if (!name || !country || !email) return res.status(400).send("Missing fields");
  db.query("INSERT INTO buyers (name,country,email) VALUES (?,?,?)",
    [name, country, email], (err) => {
      if (err) return res.send(err);
      addActivity("buyer", "New buyer registered", `${name} from ${country}`);
      res.send("Buyer Added");
    });
});
app.put("/buyers/:id", (req, res) => {
  const { name, country, email } = req.body;
  db.query("UPDATE buyers SET name=?,country=?,email=? WHERE id=?",
    [name, country, email, req.params.id], (err) => {
      if (err) return res.send(err);
      res.send("Buyer Updated");
    });
});
app.delete("/buyers/:id", (req, res) => {
  db.query("DELETE FROM buyers WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Buyer Deleted");
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
const multer  = require("multer");
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "templates/"),
  filename:    (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

app.post("/upload-template", upload.single("file"), (req, res) => {
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
  db.query("SELECT * FROM inquiries ORDER BY id DESC", (err, result) => {
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
  db.query("DELETE FROM inquiries WHERE id=?", [req.params.id], (err) => {
    if (err) return res.send(err);
    res.send("Inquiry Deleted");
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
// ── ADD THIS ROUTE TO server.js (paste before app.listen) ────────────────────

// PUT /users/:id/password  — change password with current password verification
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
// GET /messages — general or DM
app.get("/messages", (req, res) => {
  const { channel } = req.query;
  const me   = parseInt(req.query.me   || 0);
  const withUser = parseInt(req.query.with || 0);
 
  if (channel === "general") {
    // All general messages, forever, oldest first
    db.query(
      `SELECT * FROM messages
       WHERE channel = 'general'
       ORDER BY created_at ASC`,
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
       ORDER BY created_at ASC`,
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
 
// POST /messages — send a message
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
 
// DELETE /messages/:id — admin or own message
app.delete("/messages/:id", (req, res) => {
  db.query("DELETE FROM messages WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Message deleted");
  });
});
/* ============================================================
   Add these 2 routes to server.js BEFORE app.listen
   ============================================================ */

// GET /messages/unread — count of new messages since lastReadId for this user
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

// GET /messages/latest-id — get the highest message id visible to this user
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
app.listen(5000, () => console.log("🚀 Server running on port 5000"));
