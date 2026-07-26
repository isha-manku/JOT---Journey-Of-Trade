const db = require('./db');

async function updateDB() {
  const query = (sql, params) => new Promise((resolve, reject) => {
    db.query(sql, params, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });

  try {
    console.log("Checking columns in doc_template_versions...");
    const columns = await query("SHOW COLUMNS FROM doc_template_versions");
    const hasBinary = columns.some(c => c.Field === 'template_binary');
    const hasSchema = columns.some(c => c.Field === 'placeholder_schema');

    if (!hasBinary) {
      console.log("Adding template_binary...");
      await query("ALTER TABLE doc_template_versions ADD COLUMN template_binary LONGBLOB");
    }
    
    if (!hasSchema) {
      console.log("Adding placeholder_schema...");
      await query("ALTER TABLE doc_template_versions ADD COLUMN placeholder_schema JSON");
    }

    console.log("Adding engine_type column...");
    const dtColumns = await query("SHOW COLUMNS FROM doc_templates");
    const hasEngineType = dtColumns.some(c => c.Field === 'engine_type');
    if (!hasEngineType) {
      await query("ALTER TABLE doc_templates ADD COLUMN engine_type ENUM('latex', 'html_css', 'docx') DEFAULT 'docx'");
    } else {
      await query("ALTER TABLE doc_templates MODIFY COLUMN engine_type ENUM('latex', 'html_css', 'docx') DEFAULT 'docx'");
    }

    console.log("Done.");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

updateDB();
