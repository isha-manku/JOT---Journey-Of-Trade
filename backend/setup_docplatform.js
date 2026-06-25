const db = require("./db");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function run() {
  console.log("Starting DocPlatform database schema setup...");

  // 1. Create Tables
  await query(`
    CREATE TABLE IF NOT EXISTS doc_companies (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      branding JSON NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_products (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      unit VARCHAR(50) DEFAULT 'MT',
      is_active TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_document_types (
      id CHAR(36) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT NULL,
      is_active TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_templates (
      id CHAR(36) PRIMARY KEY,
      company_id CHAR(36) NOT NULL,
      product_id CHAR(36) NOT NULL,
      document_type_id CHAR(36) NOT NULL,
      name VARCHAR(255) NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_template_combo (company_id, product_id, document_type_id),
      FOREIGN KEY (company_id) REFERENCES doc_companies(id),
      FOREIGN KEY (product_id) REFERENCES doc_products(id),
      FOREIGN KEY (document_type_id) REFERENCES doc_document_types(id)
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_template_versions (
      id CHAR(36) PRIMARY KEY,
      template_id CHAR(36) NOT NULL,
      version INT NOT NULL DEFAULT 1,
      latex_source MEDIUMTEXT NOT NULL,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_template_version (template_id, version),
      FOREIGN KEY (template_id) REFERENCES doc_templates(id)
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_document_schemas (
      id CHAR(36) PRIMARY KEY,
      template_id CHAR(36) NOT NULL,
      version INT NOT NULL DEFAULT 1,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_schema_version (template_id, version),
      FOREIGN KEY (template_id) REFERENCES doc_templates(id)
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_schema_fields (
      id CHAR(36) PRIMARY KEY,
      schema_id CHAR(36) NOT NULL,
      \`key\` VARCHAR(100) NOT NULL,
      label VARCHAR(255) NOT NULL,
      field_type VARCHAR(50) NOT NULL,
      required TINYINT(1) DEFAULT 0,
      \`order\` INT DEFAULT 0,
      options JSON NULL,
      default_value TEXT NULL,
      placeholder VARCHAR(255) NULL,
      FOREIGN KEY (schema_id) REFERENCES doc_document_schemas(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_generated_documents (
      id CHAR(36) PRIMARY KEY,
      document_number VARCHAR(100) UNIQUE NOT NULL,
      template_id CHAR(36) NOT NULL,
      buyer_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES doc_templates(id),
      FOREIGN KEY (buyer_id) REFERENCES buyers(id)
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_generated_document_versions (
      id CHAR(36) PRIMARY KEY,
      document_id CHAR(36) NOT NULL,
      version INT NOT NULL DEFAULT 1,
      template_version_id CHAR(36) NOT NULL,
      schema_id CHAR(36) NOT NULL,
      form_values JSON NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(100) NULL,
      UNIQUE KEY uq_gendoc_version (document_id, version),
      FOREIGN KEY (document_id) REFERENCES doc_generated_documents(id),
      FOREIGN KEY (template_version_id) REFERENCES doc_template_versions(id),
      FOREIGN KEY (schema_id) REFERENCES doc_document_schemas(id)
    ) ENGINE=InnoDB;
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS doc_audit_logs (
      id CHAR(36) PRIMARY KEY,
      entity_type VARCHAR(100) NOT NULL,
      entity_id CHAR(36) NOT NULL,
      action VARCHAR(50) NOT NULL,
      actor VARCHAR(100) NULL,
      detail JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB;
  `);

  console.log("✅ DocPlatform tables created successfully.");

  // Check if companies exist before seeding
  const existing = await query("SELECT COUNT(*) as count FROM doc_companies");
  if (existing[0].count > 0) {
    console.log("DocPlatform already seeded. Skipping seed.");
    process.exit(0);
  }

  console.log("Seeding initial DocPlatform data...");
  const seedFile = path.join(__dirname, "seed_data.json");
  if (!fs.existsSync(seedFile)) {
    console.error("Error: seed_data.json not found in backend directory!");
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(seedFile, "utf8"));

  // Seed 1: Western Agro Sunflower LOI
  const company1Id = crypto.randomUUID();
  const product1Id = crypto.randomUUID();
  const docType1Id = crypto.randomUUID();
  const template1Id = crypto.randomUUID();
  const tempVersion1Id = crypto.randomUUID();
  const schema1Id = crypto.randomUUID();

  const brand1 = {
    seller_company: "Western Agro Ltd.",
    seller_address: "12 Harbour Road, Rotterdam, Netherlands",
    seller_bank: "ABN AMRO — IBAN NL00 ABNA 0000 0000 00",
    product_name: "Sunflower Oil",
    unit: "MT"
  };

  await query("INSERT INTO doc_companies (id, name, code, branding) VALUES (?,?,?,?)", [
    company1Id, "Western Agro", "WAGRO", JSON.stringify(brand1)
  ]);

  await query("INSERT INTO doc_products (id, name, code, unit) VALUES (?,?,?,?)", [
    product1Id, "Sunflower Oil", "SFO", "MT"
  ]);

  await query("INSERT INTO doc_document_types (id, name, code, description) VALUES (?,?,?,?)", [
    docType1Id, "LOI", "LOI", "Letter of Intent"
  ]);

  await query("INSERT INTO doc_templates (id, company_id, product_id, document_type_id, name) VALUES (?,?,?,?,?)", [
    template1Id, company1Id, product1Id, docType1Id, "Western Agro Sunflower LOI"
  ]);

  await query("INSERT INTO doc_template_versions (id, template_id, version, latex_source) VALUES (?,?,?,?)", [
    tempVersion1Id, template1Id, 1, seedData.loi_latex
  ]);

  await query("INSERT INTO doc_document_schemas (id, template_id, version) VALUES (?,?,?)", [
    schema1Id, template1Id, 1
  ]);

  for (const f of seedData.loi_fields) {
    await query(
      "INSERT INTO doc_schema_fields (id, schema_id, \`key\`, label, field_type, required, \`order\`, options, default_value, placeholder) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        crypto.randomUUID(),
        schema1Id,
        f.key,
        f.label,
        f.field_type,
        f.required ? 1 : 0,
        f.order || 0,
        f.options ? JSON.stringify(f.options) : null,
        f.default_value || null,
        f.placeholder || null
      ]
    );
  }

  // Seed 2: Ronsons Frozen Chicken Paws FCO
  const company2Id = crypto.randomUUID();
  const product2Id = crypto.randomUUID();
  const docType2Id = crypto.randomUUID();
  const template2Id = crypto.randomUUID();
  const tempVersion2Id = crypto.randomUUID();
  const schema2Id = crypto.randomUUID();

  const brand2 = {
    seller_company: "Ronsons Trading FZ-LLC",
    product_name: "Frozen Chicken Paws"
  };

  await query("INSERT INTO doc_companies (id, name, code, branding) VALUES (?,?,?,?)", [
    company2Id, "Ronsons Trading FZ-LLC", "RONSONS", JSON.stringify(brand2)
  ]);

  await query("INSERT INTO doc_products (id, name, code, unit) VALUES (?,?,?,?)", [
    product2Id, "Frozen Chicken Paws", "FCP", "MT"
  ]);

  await query("INSERT INTO doc_document_types (id, name, code, description) VALUES (?,?,?,?)", [
    docType2Id, "FCO", "FCO", "Full Corporate Offer"
  ]);

  await query("INSERT INTO doc_templates (id, company_id, product_id, document_type_id, name) VALUES (?,?,?,?,?)", [
    template2Id, company2Id, product2Id, docType2Id, "Ronsons Frozen Chicken Paws FCO"
  ]);

  await query("INSERT INTO doc_template_versions (id, template_id, version, latex_source) VALUES (?,?,?,?)", [
    tempVersion2Id, template2Id, 1, seedData.fco_latex
  ]);

  await query("INSERT INTO doc_document_schemas (id, template_id, version) VALUES (?,?,?)", [
    schema2Id, template2Id, 1
  ]);

  for (const f of seedData.fco_fields) {
    await query(
      "INSERT INTO doc_schema_fields (id, schema_id, \`key\`, label, field_type, required, \`order\`, options, default_value, placeholder) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [
        crypto.randomUUID(),
        schema2Id,
        f.key,
        f.label,
        f.field_type,
        f.required ? 1 : 0,
        f.order || 0,
        f.options ? JSON.stringify(f.options) : null,
        f.default_value || null,
        f.placeholder || null
      ]
    );
  }

  console.log("✅ Seed completed successfully. Western Agro LOI and Ronsons FCO templates seeded!");
  process.exit(0);
}

run().catch(err => {
  console.error("Database setup failed:", err);
  process.exit(1);
});
