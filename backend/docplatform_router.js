const express = require("express");
const router = express.Router();
const db = require("./db");
const { authenticateCRMUser } = require("./docplatform_auth");

const crypto = require("crypto");

function uuid() {
  return crypto.randomUUID().replace(/-/g, "");
}


// Promise wrapper for database queries
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Helper to extract numeric values for trade terms
function extractFirstNumber(val) {
  if (!val) return 0.0;
  if (typeof val === "number") return val;
  const matches = String(val).match(/\d+(?:,\d+)*(?:\.\d+)?/);
  if (!matches) return 0.0;
  const numStr = matches[0].replace(/,/g, "");
  try {
    return parseFloat(numStr);
  } catch (e) {
    return 0.0;
  }
}

// ---------------------------------------------------------------------------
// REFERENCE DATA APIs
// ---------------------------------------------------------------------------

// GET /reference/companies - List active companies that have templates
router.get("/reference/companies", authenticateCRMUser, async (req, res) => {
  try {
    const rows = await query(`
      SELECT DISTINCT c.* 
      FROM doc_companies c
      JOIN doc_templates t ON t.company_id = c.id
      WHERE c.is_active = 1 AND t.is_active = 1
      ORDER BY c.name
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reference/products - List products bound to a company template
router.get("/reference/products", authenticateCRMUser, async (req, res) => {
  try {
    const { company_id } = req.query;
    if (!company_id) {
      return res.status(400).json({ error: "company_id query param is required" });
    }
    const rows = await query(
      `SELECT DISTINCT p.* FROM doc_products p
       JOIN doc_templates t ON t.product_id = p.id
       WHERE t.company_id = ? AND t.is_active = 1
       ORDER BY p.name`,
      [company_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reference/document-types - List document types active for company + product
router.get("/reference/document-types", authenticateCRMUser, async (req, res) => {
  try {
    const { company_id, product_id } = req.query;
    if (!company_id || !product_id) {
      return res.status(400).json({ error: "company_id and product_id are required" });
    }
    const rows = await query(
      `SELECT DISTINCT dt.* FROM doc_document_types dt
       JOIN doc_templates t ON t.document_type_id = dt.id
       WHERE t.company_id = ? AND t.product_id = ? AND t.is_active = 1
       ORDER BY dt.name`,
      [company_id, product_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reference/buyers - Search and autocomplete CRM buyers
router.get("/reference/buyers", authenticateCRMUser, async (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT b.id, b.buyer_name, b.company_name, b.email,
             (SELECT COUNT(*) FROM doc_generated_documents WHERE buyer_id = b.id AND (is_deleted = 0 OR is_deleted IS NULL)) AS document_count
      FROM buyers b
      WHERE b.is_deleted = FALSE OR b.is_deleted IS NULL
    `;
    const params = [];
    if (search) {
      sql += " AND (b.buyer_name LIKE ? OR b.company_name LIKE ? OR b.email LIKE ?)";
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    sql += " ORDER BY b.buyer_name, b.company_name, b.id";
    const rows = await query(sql, params);

    // Format output matching original schemas
    const formatted = rows.map(r => ({
      id: r.id,
      display_name: r.buyer_name || r.company_name || String(r.id),
      crm_buyer_id: String(r.id),
      document_count: r.document_count
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// SCHEMA & TEMPLATE LOAD APIs
// ---------------------------------------------------------------------------

// GET /documents/schema - Resolve template and load its active schema fields
router.get("/documents/schema", authenticateCRMUser, async (req, res) => {
  try {
    const { company_id, product_id, document_type_id } = req.query;
    if (!company_id || !product_id || !document_type_id) {
      return res.status(400).json({ error: "Missing company_id, product_id, or document_type_id" });
    }

    const templates = await query(
      "SELECT id FROM doc_templates WHERE company_id = ? AND product_id = ? AND document_type_id = ? AND is_active = 1",
      [company_id, product_id, document_type_id]
    );
    if (templates.length === 0) {
      return res.status(404).json({ error: "No template configured for this combination." });
    }
    const templateId = templates[0].id;

    const schemas = await query(
      "SELECT id, template_id, version FROM doc_document_schemas WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [templateId]
    );
    if (schemas.length === 0) {
      return res.status(404).json({ error: "No active schema configured." });
    }
    const schema = schemas[0];

    const fields = await query(
      "SELECT id, \`key\`, label, field_type, required, \`order\`, options, default_value, placeholder FROM doc_schema_fields WHERE schema_id = ? ORDER BY \`order\`",
      [schema.id]
    );

    // Parse options from stringified JSON if stored as strings
    fields.forEach(f => {
      if (typeof f.options === "string") {
        try {
          f.options = JSON.parse(f.options);
        } catch (e) {
          f.options = [];
        }
      }
      f.required = !!f.required;
    });

    res.json({
      id: schema.id,
      template_id: schema.template_id,
      version: schema.version,
      fields: fields
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/schema - Load schema fields by document ID
router.get("/documents/:id/schema", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    const docs = await query("SELECT template_id FROM doc_generated_documents WHERE id = ?", [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    const templateId = docs[0].template_id;

    const schemas = await query(
      "SELECT id, template_id, version FROM doc_document_schemas WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [templateId]
    );
    if (schemas.length === 0) {
      return res.status(404).json({ error: "No active schema configured." });
    }
    const schema = schemas[0];

    const fields = await query(
      "SELECT id, \`key\`, label, field_type, required, \`order\`, options, default_value, placeholder FROM doc_schema_fields WHERE schema_id = ? ORDER BY \`order\`",
      [schema.id]
    );

    fields.forEach(f => {
      if (typeof f.options === "string") {
        try {
          f.options = JSON.parse(f.options);
        } catch (e) {
          f.options = [];
        }
      }
      f.required = !!f.required;
    });

    res.json({
      id: schema.id,
      template_id: schema.template_id,
      version: schema.version,
      fields: fields
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// DOCUMENT GENERATION & MANAGEMENT
// ---------------------------------------------------------------------------

// POST /documents/generate - Generate Version 1
router.post("/documents/generate", authenticateCRMUser, async (req, res) => {
  try {
    const {
      company_id, product_id, document_type_id,
      buyer_name, company_name, country, phone, email,
      form_values
    } = req.body;

    if (!company_id || !product_id || !document_type_id || !buyer_name || !company_name || !phone) {
      return res.status(422).json({ error: "Missing required generation fields." });
    }

    // 1. Resolve template
    const templates = await query(
      "SELECT id, name FROM doc_templates WHERE company_id = ? AND product_id = ? AND document_type_id = ? AND is_active = 1",
      [company_id, product_id, document_type_id]
    );
    if (templates.length === 0) {
      return res.status(404).json({ error: "No template configured for this combination." });
    }
    const template = templates[0];

    // 2. Fetch active template version
    const versions = await query(
      "SELECT id, version FROM doc_template_versions WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [template.id]
    );
    if (versions.length === 0) {
      return res.status(404).json({ error: "No active template version configured." });
    }
    const tempVersion = versions[0];

    // 3. Fetch active schema
    const schemas = await query(
      "SELECT id FROM doc_document_schemas WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [template.id]
    );
    if (schemas.length === 0) {
      return res.status(404).json({ error: "No active schema configured." });
    }
    const schema = schemas[0];

    // 4. Resolve or create buyer (CRM safety integration)
    let buyer = null;
    const cNameLower = company_name.toLowerCase();
    const bNameLower = buyer_name.toLowerCase();
    const emailLower = email ? email.toLowerCase() : "";

    // Prio 1: Company + Phone
    if (phone) {
      const rows = await query("SELECT * FROM buyers WHERE LOWER(company_name) = ? AND phone = ?", [cNameLower, phone]);
      if (rows.length > 0) buyer = rows[0];
    }
    // Prio 2: Email
    if (!buyer && emailLower) {
      const rows = await query("SELECT * FROM buyers WHERE LOWER(email) = ?", [emailLower]);
      if (rows.length > 0) buyer = rows[0];
    }
    // Prio 3: Name + Company
    if (!buyer) {
      const rows = await query("SELECT * FROM buyers WHERE LOWER(buyer_name) = ? AND LOWER(company_name) = ?", [bNameLower, cNameLower]);
      if (rows.length > 0) buyer = rows[0];
    }

    let buyerId;
    if (buyer) {
      buyerId = buyer.id;
      // Auto-restore soft deleted buyer
      if (buyer.is_deleted) {
        await query("UPDATE buyers SET is_deleted = FALSE, deleted_at = NULL WHERE id = ?", [buyerId]);
        console.log(`[Buyer Auto-Restore] Restored buyer '${buyer.buyer_name}' (${buyer.company_name})`);
      }

      // Safe update: fill empty columns only
      const updates = [];
      const params = [];
      if (!buyer.buyer_name && buyer_name) { updates.push("buyer_name = ?"); params.push(buyer_name); }
      if (!buyer.company_name && company_name) { updates.push("company_name = ?"); params.push(company_name); }
      if (!buyer.country && country) { updates.push("country = ?"); params.push(country); }
      if (!buyer.phone && phone) { updates.push("phone = ?"); params.push(phone); }
      if (!buyer.email && email) { updates.push("email = ?"); params.push(email); }

      if (updates.length > 0) {
        params.push(buyerId);
        await query(`UPDATE buyers SET ${updates.join(", ")} WHERE id = ?`, params);
      }
    } else {
      // Create new buyer record
      const result = await query(
        "INSERT INTO buyers (buyer_name, company_name, country, email, phone, address, notes) VALUES (?,?,?,?,?,?,?)",
        [buyer_name, company_name, country || "", email || "", phone || "", "", "Added via Document Generation"]
      );
      buyerId = result.insertId;
    }

    // Update buyer product terms
    const productRows = await query("SELECT name FROM doc_products WHERE id = ?", [product_id]);
    if (productRows.length > 0) {
      const productName = productRows[0].name;
      // Reload buyer products list
      const freshBuyer = (await query("SELECT products FROM buyers WHERE id = ?", [buyerId]))[0];
      let productsList = [];
      if (freshBuyer.products) {
        try {
          productsList = typeof freshBuyer.products === "string" ? JSON.parse(freshBuyer.products) : freshBuyer.products;
        } catch (e) {
          productsList = [];
        }
      }
      if (!Array.isArray(productsList)) productsList = [];

      const price = form_values.contract_price || form_values.unit_price || form_values.price || form_values.trial_price || "";
      const trialQty = form_values.trial_quantity_mt || form_values.trial_container || form_values.trial_qty || "";
      const contractQty = form_values.annual_contract_quantity || form_values.contract_quantity || form_values.quantity || form_values.contract_qty || "";
      const destinationPort = form_values.contract_destination_port || form_values.destination_port || "";
      let totalContractValue = form_values.annual_contract_value || form_values.total_contract_price || "";

      if (!totalContractValue && price && contractQty) {
        const pNum = extractFirstNumber(price);
        const qNum = extractFirstNumber(contractQty);
        if (pNum && qNum) {
          totalContractValue = `USD ${(pNum * qNum).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      }

      const existingProd = productsList.find(p => p.product && p.product.toLowerCase() === productName.toLowerCase());
      if (existingProd) {
        if (!existingProd.price && price) existingProd.price = price;
        if (!existingProd.trial_qty && trialQty) existingProd.trial_qty = trialQty;
        if (!existingProd.contract_qty && contractQty) existingProd.contract_qty = contractQty;
        if (!existingProd.total_contract_price && totalContractValue) existingProd.total_contract_price = totalContractValue;
        if (!existingProd.destination_port && destinationPort) existingProd.destination_port = destinationPort;
      } else {
        productsList.push({
          product: productName,
          price,
          trial_qty: trialQty,
          contract_qty: contractQty,
          total_contract_price: totalContractValue,
          destination_port: destinationPort
        });
      }

      await query("UPDATE buyers SET products = ? WHERE id = ?", [JSON.stringify(productsList), buyerId]);
    }

    // 5. Generate document number
    const docTypes = await query("SELECT code FROM doc_document_types WHERE id = ?", [document_type_id]);
    const docCode = docTypes[0].code;
    const countResult = await query("SELECT COUNT(*) as count FROM doc_generated_documents");
    const count = countResult[0].count;
    const documentNumber = `${docCode}-${String(count + 1).padStart(6, "0")}`;

    // 6. Insert generated document metadata
    const docUuid = uuid();
    await query(
      "INSERT INTO doc_generated_documents (id, document_number, template_id, buyer_id) VALUES (?,?,?,?)",
      [docUuid, documentNumber, template.id, buyerId]
    );

    // 7. Insert version 1
    const verUuid = uuid();
    const createdBy = req.user.username;
    await query(
      "INSERT INTO doc_generated_document_versions (id, document_id, version, template_version_id, schema_id, form_values, created_by) VALUES (?,?,?,?,?,?,?)",
      [verUuid, docUuid, 1, tempVersion.id, schema.id, JSON.stringify(form_values), createdBy]
    );

    // 8. Log audit trail
    await query(
      "INSERT INTO doc_audit_logs (id, entity_type, entity_id, action, actor, detail) VALUES (?,?,?,?,?,?)",
      [uuid(), "GeneratedDocument", docUuid, "create", createdBy, JSON.stringify({ version: 1 })]
    );

    // 9. Return formatted generated document
    const createdDoc = await query(
      `SELECT gd.id, gd.document_number, gd.buyer_id, gd.created_at,
              c.name AS company, p.name AS product, dt.name AS document_type
       FROM doc_generated_documents gd
       JOIN doc_templates t ON t.id = gd.template_id
       JOIN doc_companies c ON c.id = t.company_id
       JOIN doc_products p ON p.id = t.product_id
       JOIN doc_document_types dt ON dt.id = t.document_type_id
       WHERE gd.id = ?`,
      [docUuid]
    );

    res.json({
      id: createdDoc[0].id,
      document_number: createdDoc[0].document_number,
      buyer_id: createdDoc[0].buyer_id,
      company: createdDoc[0].company,
      product: createdDoc[0].product,
      document_type: createdDoc[0].document_type,
      latest_version: 1,
      created_at: createdDoc[0].created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/search - Paginated/filtered search grid
router.get("/documents/search", authenticateCRMUser, async (req, res) => {
  try {
    const { company_id, product_id, document_type_id, buyer_id, limit = 50, offset = 0 } = req.query;

    let sql = `
      SELECT gd.id, gd.document_number, gd.buyer_id, gd.created_at,
             c.name AS company, p.name AS product, dt.name AS document_type,
             (SELECT MAX(version) FROM doc_generated_document_versions WHERE document_id = gd.id) AS latest_version
      FROM doc_generated_documents gd
      JOIN doc_templates t ON t.id = gd.template_id
      JOIN doc_companies c ON c.id = t.company_id
      JOIN doc_products p ON p.id = t.product_id
      JOIN doc_document_types dt ON dt.id = t.document_type_id
      WHERE 1=1
    `;
    const params = [];

    if (company_id) { sql += " AND t.company_id = ?"; params.push(company_id); }
    if (product_id) { sql += " AND t.product_id = ?"; params.push(product_id); }
    if (document_type_id) { sql += " AND t.document_type_id = ?"; params.push(document_type_id); }
    if (buyer_id) { sql += " AND gd.buyer_id = ?"; params.push(buyer_id); }

    const countSql = `SELECT COUNT(*) as count FROM (${sql}) as sub`;
    const countResult = await query(countSql, params);

    sql += " ORDER BY gd.created_at DESC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const rows = await query(sql, params);

    res.json({
      items: rows.map(r => ({
        id: r.id,
        document_number: r.document_number,
        buyer_id: r.buyer_id,
        company: r.company,
        product: r.product,
        document_type: r.document_type,
        latest_version: r.latest_version || 1,
        created_at: r.created_at
      })),
      total: countResult[0].count
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/latest - Fetch latest revision form values
router.get("/documents/:id/latest", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    const rows = await query(
      "SELECT * FROM doc_generated_document_versions WHERE document_id = ? ORDER BY version DESC LIMIT 1",
      [docId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "No versions found." });
    }
    const latest = rows[0];
    if (typeof latest.form_values === "string") {
      latest.form_values = JSON.parse(latest.form_values);
    }
    res.json(latest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id - Get generated document base metadata
router.get("/documents/:id", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    const rows = await query(
      `SELECT gd.id, gd.document_number, gd.buyer_id, gd.created_at,
              c.name AS company, p.name AS product, dt.name AS document_type,
              (SELECT MAX(version) FROM doc_generated_document_versions WHERE document_id = gd.id) AS latest_version
       FROM doc_generated_documents gd
       JOIN doc_templates t ON t.id = gd.template_id
       JOIN doc_companies c ON c.id = t.company_id
       JOIN doc_products p ON p.id = t.product_id
       JOIN doc_document_types dt ON dt.id = t.document_type_id
       WHERE gd.id = ?`,
      [docId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /documents/revise - Save revision (append new version, never overwrite)
router.post("/documents/revise", authenticateCRMUser, async (req, res) => {
  try {
    const { document_id, form_values } = req.body;
    if (!document_id || !form_values) {
      return res.status(400).json({ error: "Missing document_id or form_values" });
    }

    const docs = await query("SELECT template_id, document_number FROM doc_generated_documents WHERE id = ?", [document_id]);
    if (docs.length === 0) {
      return res.status(404).json({ error: "Document not found." });
    }
    const doc = docs[0];

    // Resolve template details
    const tempVersions = await query(
      "SELECT id, version FROM doc_template_versions WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [doc.template_id]
    );
    const tempVersion = tempVersions[0];

    const schemas = await query(
      "SELECT id FROM doc_document_schemas WHERE template_id = ? AND is_active = 1 ORDER BY version DESC LIMIT 1",
      [doc.template_id]
    );
    const schema = schemas[0];

    // Get current version max
    const maxResult = await query(
      "SELECT MAX(version) as max_ver FROM doc_generated_document_versions WHERE document_id = ?",
      [document_id]
    );
    const nextVer = (maxResult[0].max_ver || 0) + 1;

    // Save version
    const verUuid = uuid();
    const createdBy = req.user.username;
    await query(
      "INSERT INTO doc_generated_document_versions (id, document_id, version, template_version_id, schema_id, form_values, created_by) VALUES (?,?,?,?,?,?,?)",
      [verUuid, document_id, nextVer, tempVersion.id, schema.id, JSON.stringify(form_values), createdBy]
    );

    // Audit Log
    await query(
      "INSERT INTO doc_audit_logs (id, entity_type, entity_id, action, actor, detail) VALUES (?,?,?,?,?,?)",
      [uuid(), "GeneratedDocument", document_id, "revise", createdBy, JSON.stringify({ version: nextVer })]
    );

    // Return document
    const updatedDoc = await query(
      `SELECT gd.id, gd.document_number, gd.buyer_id, gd.created_at,
              c.name AS company, p.name AS product, dt.name AS document_type
       FROM doc_generated_documents gd
       JOIN doc_templates t ON t.id = gd.template_id
       JOIN doc_companies c ON c.id = t.company_id
       JOIN doc_products p ON p.id = t.product_id
       JOIN doc_document_types dt ON dt.id = t.document_type_id
       WHERE gd.id = ?`,
      [document_id]
    );

    res.json({
      id: updatedDoc[0].id,
      document_number: updatedDoc[0].document_number,
      buyer_id: updatedDoc[0].buyer_id,
      company: updatedDoc[0].company,
      product: updatedDoc[0].product,
      document_type: updatedDoc[0].document_type,
      latest_version: nextVer,
      created_at: updatedDoc[0].created_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/versions - List revisions history
router.get("/documents/:id/versions", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    const rows = await query(
      "SELECT * FROM doc_generated_document_versions WHERE document_id = ? ORDER BY version DESC",
      [docId]
    );
    rows.forEach(r => {
      if (typeof r.form_values === "string") {
        try {
          r.form_values = JSON.parse(r.form_values);
        } catch (e) {}
      }
    });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/pdf - Compile and stream PDF on-the-fly
router.get("/documents/:id/pdf", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    const version = req.query.version ? parseInt(req.query.version) : null;
    const download = req.query.download === "true";

    const docs = await query("SELECT document_number, template_id FROM doc_generated_documents WHERE id = ?", [docId]);
    if (docs.length === 0) {
      return res.status(404).json({ error: "Document not found." });
    }
    const doc = docs[0];

    let vSql = "SELECT * FROM doc_generated_document_versions WHERE document_id = ?";
    const vParams = [docId];
    if (version !== null) {
      vSql += " AND version = ?";
      vParams.push(version);
    } else {
      vSql += " ORDER BY version DESC LIMIT 1";
    }

    const versions = await query(vSql, vParams);
    if (versions.length === 0) {
      return res.status(404).json({ error: "Version not found." });
    }
    const docVersion = versions[0];
    const formValues = typeof docVersion.form_values === "string" ? JSON.parse(docVersion.form_values) : docVersion.form_values;

    const tplVersions = await query("SELECT template_binary, placeholder_schema FROM doc_template_versions WHERE id = ?", [docVersion.template_version_id]);
    const templateBinary = tplVersions[0].template_binary;
    let schemaMappings = [];
    if (tplVersions[0].placeholder_schema) {
      schemaMappings = typeof tplVersions[0].placeholder_schema === 'string' 
        ? JSON.parse(tplVersions[0].placeholder_schema) 
        : tplVersions[0].placeholder_schema;
      if (schemaMappings.fields) {
        schemaMappings = schemaMappings.fields;
      }
    }

    if (!templateBinary) {
      return res.status(500).json({ error: "No DOCX template binary found for this version." });
    }

    const documentHydrator = require("./documentHydrator.service");
    let pdfBytes = await documentHydrator.hydrateAndRenderPDF(templateBinary, formValues, schemaMappings);

    // Apply custom annotations if they exist and raw is not requested
    if (req.query.raw !== 'true' && docVersion.custom_annotations) {
      const { PDFDocument, rgb } = require('pdf-lib');
      const fontkit = require('@pdf-lib/fontkit');
      const fs = require('fs');

      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);

      let cambriaFont;
      try {
        const fontPath = path.join(__dirname, 'public/fonts/cambria.ttc');
        if (fs.existsSync(fontPath)) {
          const fontBytes = fs.readFileSync(fontPath);
          cambriaFont = await pdfDoc.embedFont(fontBytes, { customName: 'Cambria' });
        }
      } catch (e) {
        console.error("Failed to load Cambria font on backend", e);
      }

      const annotations = typeof docVersion.custom_annotations === 'string' 
        ? JSON.parse(docVersion.custom_annotations) 
        : docVersion.custom_annotations;

      const pages = pdfDoc.getPages();
      for (const ann of annotations) {
        if (ann.pageNumber >= 1 && ann.pageNumber <= pages.length) {
          const page = pages[ann.pageNumber - 1];
          const { height } = page.getSize();
          
          let hex = ann.color.replace('#', '');
          let r = parseInt(hex.substring(0,2), 16) / 255;
          let g = parseInt(hex.substring(2,4), 16) / 255;
          let b = parseInt(hex.substring(4,6), 16) / 255;

          const drawOpts = {
            x: ann.x,
            y: height - ann.y - (ann.size || 16),
            size: ann.size || 16,
            color: rgb(r, g, b),
          };
          if (ann.font === 'Cambria' && cambriaFont) {
            drawOpts.font = cambriaFont;
          }
          page.drawText(ann.text || '', drawOpts);
        }
      }
      pdfBytes = await pdfDoc.save();
    }

    // Audit view/download
    const action = download ? "download" : "view";
    await query(
      "INSERT INTO doc_audit_logs (id, entity_type, entity_id, action, actor, detail) VALUES (?,?,?,?,?,?)",
      [uuid(), "GeneratedDocument", docId, action, req.user.username, JSON.stringify({ version: docVersion.version })]
    );

    const disposition = download ? "attachment" : "inline";
    const filename = `${doc.document_number}_v${docVersion.version}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${disposition}; filename="${filename}"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/:id/versions/:version/annotations
router.get("/documents/:id/versions/:version/annotations", authenticateCRMUser, async (req, res) => {
  try {
    const { id, version } = req.params;
    const versions = await query("SELECT custom_annotations FROM doc_generated_document_versions WHERE document_id = ? AND version = ?", [id, parseInt(version)]);
    if (versions.length === 0) return res.status(404).json({ error: "Version not found." });
    
    let ann = versions[0].custom_annotations;
    if (typeof ann === 'string') ann = JSON.parse(ann);
    res.json({ annotations: ann || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /documents/:id/versions/:version/annotations
router.post("/documents/:id/versions/:version/annotations", authenticateCRMUser, async (req, res) => {
  try {
    const { id, version } = req.params;
    const { annotations } = req.body;
    
    const versions = await query("SELECT edited_count FROM doc_generated_document_versions WHERE document_id = ? AND version = ?", [id, parseInt(version)]);
    if (versions.length === 0) return res.status(404).json({ error: "Version not found." });
    
    const editedCount = versions[0].edited_count || 0;
    if (req.user.role === 'member' && editedCount >= 1) {
      return res.status(403).json({ error: "Members can only edit this document once." });
    }
    
    await query("UPDATE doc_generated_document_versions SET custom_annotations = ?, edited_count = edited_count + 1 WHERE document_id = ? AND version = ?", 
      [JSON.stringify(annotations), id, parseInt(version)]);
      
    res.json({ success: true, message: "Annotations saved successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /documents/buyer/:id/profile - Buyer profile aggregated document history
router.get("/documents/buyer/:id/profile", authenticateCRMUser, async (req, res) => {
  try {
    const buyerId = req.params.id;

    const buyers = await query("SELECT * FROM buyers WHERE id = ?", [buyerId]);
    if (buyers.length === 0) {
      return res.status(404).json({ error: "Buyer not found." });
    }
    const buyer = buyers[0];
    if (typeof buyer.products === "string") {
      try {
        buyer.products = JSON.parse(buyer.products);
      } catch (e) {}
    }

    const docs = await query(
      `SELECT gd.id, gd.document_number, gd.created_at,
              c.id AS company_id, c.name AS company_name, c.code AS company_code,
              p.id AS product_id, p.name AS product_name, p.code AS product_code,
              dt.name AS document_type_name,
              (SELECT MAX(version) FROM doc_generated_document_versions WHERE document_id = gd.id) AS latest_version
       FROM doc_generated_documents gd
       JOIN doc_templates t ON t.id = gd.template_id
       JOIN doc_companies c ON c.id = t.company_id
       JOIN doc_products p ON p.id = t.product_id
       JOIN doc_document_types dt ON dt.id = t.document_type_id
       WHERE gd.buyer_id = ? AND (gd.is_deleted = 0 OR gd.is_deleted IS NULL)`,
      [buyerId]
    );

    const manualDocs = await query(
      `SELECT id, company_name, product_name, document_type, file_name, file_path, uploaded_at 
       FROM buyer_documents 
       WHERE buyer_id = ? AND (is_deleted = 0 OR is_deleted IS NULL)`,
      [buyerId]
    );

    const companyMap = {};
    const uniqueProducts = new Set();

    docs.forEach(doc => {
      uniqueProducts.add(doc.product_id);
      if (!companyMap[doc.company_id]) {
        companyMap[doc.company_id] = {
          company_name: doc.company_name,
          company_code: doc.company_code,
          products: {}
        };
      }

      if (!companyMap[doc.company_id].products[doc.product_id]) {
        companyMap[doc.company_id].products[doc.product_id] = {
          name: doc.product_name,
          code: doc.product_code,
          documents: []
        };
      }

      companyMap[doc.company_id].products[doc.product_id].documents.push({
        id: doc.id,
        document_number: doc.document_number,
        document_type: doc.document_type_name,
        latest_version: doc.latest_version || 1,
        created_at: doc.created_at
      });
    });

    manualDocs.forEach(mdoc => {
      const compName = mdoc.company_name || "Other/Unspecified";
      const compId = `manual_comp_${compName}`;
      const prodName = mdoc.product_name || "Other/Unspecified";
      const prodId = `manual_prod_${prodName}`;

      uniqueProducts.add(prodId);
      if (!companyMap[compId]) {
        companyMap[compId] = {
          company_name: compName,
          company_code: "",
          products: {}
        };
      }

      if (!companyMap[compId].products[prodId]) {
        companyMap[compId].products[prodId] = {
          name: prodName,
          code: "",
          documents: []
        };
      }

      companyMap[compId].products[prodId].documents.push({
        id: mdoc.id,
        document_number: mdoc.file_name,
        document_type: mdoc.document_type || "Attachment",
        latest_version: null,
        created_at: mdoc.uploaded_at,
        is_manual: true,
        file_path: mdoc.file_path
      });
    });

    const companiesOut = [];
    const sortedCompanies = Object.values(companyMap).sort((a, b) => a.company_name.localeCompare(b.company_name));

    sortedCompanies.forEach(c => {
      const productsOut = [];
      const sortedProducts = Object.values(c.products).sort((a, b) => a.name.localeCompare(b.name));

      sortedProducts.forEach(p => {
        const sortedDocs = p.documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        productsOut.push({
          product_name: p.name,
          product_code: p.code,
          documents: sortedDocs
        });
      });

      companiesOut.push({
        company_name: c.company_name,
        company_code: c.company_code,
        products: productsOut
      });
    });

    res.json({
      buyer: {
        id: buyer.id,
        buyer_name: buyer.buyer_name,
        company_name: buyer.company_name,
        country: buyer.country,
        email: buyer.email,
        phone: buyer.phone,
        address: buyer.address,
        notes: buyer.notes,
        products: buyer.products,
        created_at: buyer.created_at
      },
      stats: {
        total_companies: Object.keys(companyMap).length,
        total_products: uniqueProducts.size,
        total_documents: docs.length + manualDocs.length
      },
      companies: companiesOut
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /documents/generated/:id/delete - Soft delete a generated document
router.post("/documents/generated/:id/delete", authenticateCRMUser, async (req, res) => {
  try {
    const docId = req.params.id;
    await query("UPDATE doc_generated_documents SET is_deleted = TRUE, deleted_at = NOW() WHERE id = ?", [docId]);
    await query("UPDATE doc_generated_document_versions SET is_deleted = TRUE, deleted_at = NOW() WHERE document_id = ?", [docId]);
    
    // Audit log
    await query(
      "INSERT INTO doc_audit_logs (id, entity_type, entity_id, action, actor, detail) VALUES (?, ?, ?, ?, ?, ?)",
      [uuid(), "generated_document", docId, "delete", req.user.username, JSON.stringify({ reason: "Document soft deleted via global delete" })]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
