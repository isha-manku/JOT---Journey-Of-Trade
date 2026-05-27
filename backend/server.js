const express = require("express");
const cors = require("cors");
const db = require("./db");
const fs = require("fs");
const app = express();
const PizZip = require("pizzip");
const Docxtemplater = require("docxtemplater");
const path = require("path");
app.use(cors());
const addActivity = (type, title, description) => {

  const sql = `
    INSERT INTO crm_activity
    (type, title, description)
    VALUES (?, ?, ?)
  `;

  db.query(sql, [type, title, description]);
};

app.use(express.json());
// ================= GENERATE DOC =================
app.post("/generate-doc", (req, res) => {
  console.log("BODY:", req.body); // 👈 debug

  if (!req.body) {
    return res.status(400).send("No data received ❌");
  }

  const template_id = req.body.template_id;

  if (!template_id) {
    return res.status(400).send("Template ID missing ❌");
  }

  const {
    buyer_company,
    buyer_name,
    buyer_email,
    buyer_phone,
    product_name,
    price,
    contract_quantity,
    date,
    company_name
  } = req.body;

  db.query("SELECT * FROM templates WHERE id = ?", [template_id], (err, result) => {
    if (err) return res.send(err);

    if (result.length === 0) {
      return res.send("Template not found ❌");
    }

    const filePath = result[0].file_path;
    const fullPath = path.join(__dirname, filePath);

    console.log("Using template:", fullPath);

    const content = fs.readFileSync(fullPath, "binary");
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    doc.setData({
      buyer_company,
      buyer_name,
      buyer_email,
      buyer_phone,
      product_name,
      price,
      contract_quantity,
      date,
      company_name
    });

    try {
      doc.render();
    } catch (error) {
      console.log(error);
      return res.send("Template error ❌");
    }

    const outputPath = path.join(__dirname, "output", Date.now() + ".docx");

    const buf = doc.getZip().generate({ type: "nodebuffer" });

    fs.writeFileSync(outputPath, buf);

    res.download(outputPath);
  });
});
// ✅ THIS LINE FIXES YOUR ERROR

// ================= SELLERS =================
app.post("/sellers", (req, res) => {
  console.log("SELLER BODY:", req.body);

  const { name, country, email, phone, product } = req.body;

  const sql = "INSERT INTO sellers (name, country, email, phone, product) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, country, email, phone, product], (err, result) => {
    if (err) {
      console.log(err);
      return res.send(err);
    }
    res.send("Seller Added");
  });
  addActivity(
  "seller",
  "Seller added",
  `${name} - ${product}`
);
});

app.get("/sellers", (req, res) => {
  db.query("SELECT * FROM sellers", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/buyers", (req, res) => {
  console.log("BODY:", req.body); // 👈 debug

  if (!req.body) {
    return res.status(400).send("No data received");
  }

  const { name, country, email } = req.body;

  if (!name || !country || !email) {
    return res.status(400).send("Missing fields");
  }

  const sql = "INSERT INTO buyers (name, country, email) VALUES (?, ?, ?)";

  db.query(sql, [name, country, email], (err, result) => {
    if (err) return res.send(err);
    res.send("Buyer Added");

  });
  addActivity(
  "buyer",
  "New buyer registered",
  `${name} from ${country}`
);
});
// GET Buyers
app.get("/buyers", (req, res) => {
  db.query("SELECT * FROM buyers", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
app.post("/companies", (req, res) => {
  const { name, address, bank_details } = req.body;

  const sql = "INSERT INTO companies (name, address, bank_details) VALUES (?, ?, ?)";

  db.query(sql, [name, address, bank_details], (err, result) => {
    if (err) return res.send(err);
    res.send("Company Added");
  });
});
app.get("/companies", (req, res) => {
  db.query("SELECT * FROM companies", (err, result) => {
    if (err) return res.send(err);
    res.json(result);
  });
});
const multer = require("multer");


// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "templates/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload template
app.post("/upload-template", upload.single("file"), (req, res) => {
  const { name } = req.body;
  const filePath = req.file.path;

  const sql = "INSERT INTO templates (name, file_path) VALUES (?, ?)";

  db.query(sql, [name, filePath], (err, result) => {
    if (err) return res.send(err);
    res.send("Template Uploaded");
  });
});
// DELETE buyer
app.delete("/buyers/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM buyers WHERE id = ?", [id], (err, result) => {
    if (err) return res.send(err);
    res.send("Buyer Deleted");
  });
});
// UPDATE buyer
app.put("/buyers/:id", (req, res) => {
  const id = req.params.id;
  const { name, country, email } = req.body;

  const sql = "UPDATE buyers SET name=?, country=?, email=? WHERE id=?";

  db.query(sql, [name, country, email, id], (err, result) => {
    if (err) return res.send(err);
    res.send("Buyer Updated");
  });
});

// DELETE SELLER
app.delete("/sellers/:id", (req, res) => {
  const id = req.params.id;

  db.query("DELETE FROM sellers WHERE id = ?", [id], (err, result) => {
    if (err) return res.send(err);
    res.send("Seller Deleted");
  });
});

// UPDATE SELLER
app.put("/sellers/:id", (req, res) => {
  const id = req.params.id;
  const { name, country, email, phone, product } = req.body;

  const sql = `
    UPDATE sellers 
    SET name=?, country=?, email=?, phone=?, product=? 
    WHERE id=?
  `;

  db.query(sql, [name, country, email, phone, product, id], (err, result) => {
    if (err) return res.send(err);
    res.send("Seller Updated");
  });
});
// ================= INQUIRIES =================
// ADD Inquiry
app.post("/inquiries", (req, res) => {

  const {
    inquiry_date,
    inquiry_source,
    buyer_name,
    product_name,
    query_executor,
    initial_contact_method,
    response_status,
    buyer_quality_rating,
    remarks,
    remark_done
  } = req.body;

  // VALIDATION
  if (
    !inquiry_date ||
    !inquiry_source ||
    !buyer_name ||
    !product_name ||
    !query_executor ||
    !initial_contact_method ||
    !response_status ||
    !buyer_quality_rating
  ) {
    return res.status(400).send("Please fill all fields");
  }

  const sql = `
    INSERT INTO inquiries
    (
      inquiry_date,
      inquiry_source,
      buyer_name,
      product_name,
      query_executor,
      initial_contact_method,
      response_status,
      buyer_quality_rating,
      remarks,
      remark_done
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      inquiry_date,
      inquiry_source,
      buyer_name,
      product_name,
      query_executor,
      initial_contact_method,
      response_status,
      buyer_quality_rating,
      remarks || "",
      remark_done || false
    ],
    (err, result) => {

      if (err) {
        console.log(err);
        return res.send(err);
      }

      res.send("Inquiry Added");
    }
  );
  addActivity(
  "inquiry",
  "New inquiry received",
  `${buyer_name} - ${product_name}`
);
});

// GET Inquiries
app.get("/inquiries", (req, res) => {
  db.query("SELECT * FROM inquiries ORDER BY id DESC", (err, result) => {
    if (err) return res.send(err);

    res.json(result);
  });
});

// DELETE Inquiry
app.delete("/inquiries/:id", (req, res) => {
  const id = req.params.id;

  db.query(
    "DELETE FROM inquiries WHERE id=?",
    [id],
    (err, result) => {
      if (err) return res.send(err);

      res.send("Inquiry Deleted");
    }
  );
});

// UPDATE Inquiry
app.put("/inquiries/:id", (req, res) => {
  const id = req.params.id;

  const {
    inquiry_date,
    
    inquiry_source,
    buyer_name,
    product_name,
    query_executor,
    initial_contact_method,
    response_status,
    buyer_quality_rating,
    remarks,
    remark_done
  } = req.body;

 const sql = `
UPDATE inquiries SET
inquiry_date=?,
inquiry_source=?,
buyer_name=?,
product_name=?,
query_executor=?,
initial_contact_method=?,
response_status=?,
buyer_quality_rating=?,
remarks=?,
remark_done=? 
WHERE id=?
`;

db.query(
  sql,
  [
    inquiry_date,
    inquiry_source,
    buyer_name,
    product_name,
    query_executor,
    initial_contact_method,
    response_status,
    buyer_quality_rating,
    remarks,
    remark_done,
    id
  ],
    (err, result) => {
      if (err) return res.send(err);

      res.send("Inquiry Updated");
    }
  );
});
// ================= EVENTS =================

// GET all events
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY date ASC, time ASC", (err, result) => {
    if (err) return res.status(500).send(err);
    res.json(result);
  });
});

// ADD event
app.post("/events", (req, res) => {
  const { title, description, date, time, type, user } = req.body;
  if (!title || !date) return res.status(400).send("Title and date are required");
  const sql = "INSERT INTO events (title, description, date, time, type, user) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [title, description || "", date, time || "00:00", type || "Meeting", user || ""], (err, result) => {
    if (err) return res.status(500).send(err);
    res.json({ id: result.insertId, title, description, date, time, type, user });
  });
});

// UPDATE event
app.put("/events/:id", (req, res) => {
  const { id } = req.params;
  const { title, description, date, time, type, user } = req.body;
  const sql = "UPDATE events SET title=?, description=?, date=?, time=?, type=?, user=? WHERE id=?";
  db.query(sql, [title, description || "", date, time || "00:00", type || "Meeting", user || "", id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Event updated");
  });
});

// DELETE event
app.delete("/events/:id", (req, res) => {
  db.query("DELETE FROM events WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.send("Event deleted");
  });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});
// ================= HISTORY =================

app.post("/history", (req, res) => {

  const {
    inquiry_id,
    action_type,
    action_by
  } = req.body;

  const sql = `
    INSERT INTO inquiry_history
    (
      inquiry_id,
      action_type,
      action_by
    )
    VALUES (?, ?, ?)
  `;

  db.query(
    sql,
    [
      inquiry_id,
      action_type,
      action_by
    ],
    (err, result) => {

      if (err) return res.send(err);

      res.send("History Added");

    }
  );
});


// GET HISTORY
app.get("/history/:id", (req, res) => {

  const inquiryId = req.params.id;

  db.query(
    "SELECT * FROM inquiry_history WHERE inquiry_id=? ORDER BY id DESC",
    [inquiryId],
    (err, result) => {

      if (err) return res.send(err);

      res.json(result);

    }
  );
});
app.get("/activities", (req, res) => {

  db.query(
    "SELECT * FROM crm_activity ORDER BY id DESC LIMIT 5",
    (err, result) => {

      if (err) return res.send(err);

      res.json(result);

    }
  );

});
