const db = require("./db");

db.query("ALTER TABLE doc_generated_document_versions ADD COLUMN custom_annotations JSON DEFAULT NULL", (err) => {
  if (err) console.error("Error adding custom_annotations:", err.message);
  else console.log("Added custom_annotations column");
  
  db.query("ALTER TABLE doc_generated_document_versions ADD COLUMN edited_count INT DEFAULT 0", (err) => {
    if (err) console.error("Error adding edited_count:", err.message);
    else console.log("Added edited_count column");
    
    process.exit(0);
  });
});
