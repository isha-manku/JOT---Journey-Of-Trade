
const fs = require("fs");
const path = "d:/@nd last crm/CRM_JOT/backend/crm-jot-frontend/src/pages/Settings.js";
let content = fs.readFileSync(path, "utf8");
content = content.replace(
  /<Field label="Document Type">\s*<input value=\{addForm\.document_type_name\}[^>]*>\s*<\/Field>/g,
  `$&
                <Field label="Template Document (.docx)">
                  <input type="file" accept=".docx" onChange={e => setAddForm(p => ({...p, file: e.target.files[0]}))} style={{ padding: "6px" }}/>
                </Field>`
);
fs.writeFileSync(path, content);

