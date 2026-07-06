const fs = require('fs');
let code = fs.readFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', 'utf8');

// Replace the form initialization and state setting
code = code.replace(/supplier_company_id: "",/g, 'supplier_company_text: "",');
code = code.replace(/supplier_company_id: tx\.supplier_company_id \|\| "",/g, 'supplier_company_text: tx.supplier_company_text || tx.supplier_company_name || "",');

// Validation check
code = code.replace(/!form\.supplier_company_id \|\|/g, '!form.supplier_company_text ||');

// Table header / data
code = code.replace(/<td>\{tx\.supplier_company_name \|\| '-'}<\/td>/g, '<td>{tx.supplier_company_text || tx.supplier_company_name || "-"}</td>');

// The tricky part: replacing the select with an input + datalist
const oldSelectRegex = /<select[\s\S]*?value=\{form\.supplier_company_id\}[\s\S]*?onChange=\{e => setForm\(\{ \.\.\.form, supplier_company_id: e\.target\.value \}\)\}[\s\S]*?disabled=\{isLocked\}[\s\S]*?>[\s\S]*?<option value=\"\">-- Choose Company --<\/option>[\s\S]*?\{companies\.map\(c => <option key=\{c\.id\} value=\{c\.id\}>\{c\.name\}<\/option>\)\}[\s\S]*?<\/select>/g;

const newDatalist = `<input 
                style={styles.select}
                type="text"
                list="companiesList"
                placeholder="Select or Enter Company"
                value={form.supplier_company_text || ''}
                onChange={e => setForm({ ...form, supplier_company_text: e.target.value })}
                required
                disabled={isLocked}
              />
              <datalist id="companiesList">
                {companies.map(c => <option key={c.id} value={c.name} />)}
              </datalist>`;

code = code.replace(oldSelectRegex, newDatalist);

fs.writeFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', code);
console.log('Fixed Accounts.js via script');
