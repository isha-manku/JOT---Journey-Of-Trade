const fs = require('fs');

// 1. Patch accounts_router.js
let routerCode = fs.readFileSync('backend/accounts_router.js', 'utf8');

routerCode = routerCode.replace(
  /supplier_company_id,\n    loading_port/g,
  'supplier_company_text,\n    loading_port'
);

// We need to allow either supplier_company_id or text, but in our case we are switching to text.
// The form validation ensures text. So we replace !supplier_company_id with !supplier_company_text
routerCode = routerCode.replace(
  /!supplier_company_id \|\|/g,
  '!supplier_company_text ||'
);

routerCode = routerCode.replace(
  /product_id, supplier_company_id, loading_port/g,
  'product_id, supplier_company_text, loading_port'
);

// We also need to map final_supplier_company
routerCode = routerCode.replace(
  /const final_supplier = supplier_company_id \|\| currentTx.supplier_company_id;/g,
  'const final_supplier_text = supplier_company_text || currentTx.supplier_company_text;'
);

routerCode = routerCode.replace(
  /supplier_company_id = \?, loading_port/g,
  'supplier_company_text = ?, loading_port'
);
// In the POST values array, `supplier_company_id` is replaced by `supplier_company_text` via regex earlier

fs.writeFileSync('backend/accounts_router.js', routerCode);


// 2. Patch Accounts.js
let frontCode = fs.readFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', 'utf8');

frontCode = frontCode.replace(/supplier_company_id: "",/g, 'supplier_company_text: "",');
frontCode = frontCode.replace(/supplier_company_id: tx\.supplier_company_id \|\| "",/g, 'supplier_company_text: tx.supplier_company_text || tx.supplier_company_name || "",');

frontCode = frontCode.replace(/!form\.supplier_company_id \|\|/g, '!form.supplier_company_text ||');

const oldSelect = `<div className="acc-field">
                <label>Supplier Company (Our Company) *</label>
                <select value={form.supplier_company_id} onChange={e => setForm({...form, supplier_company_id: e.target.value})}>
                  <option value="">-- Choose Company --</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>`;

const newInput = `<div className="acc-field">
                <label>Supplier Company (Our Company) *</label>
                <input 
                  type="text" 
                  list="companiesList"
                  placeholder="Select or Enter Company" 
                  value={form.supplier_company_text || ''} 
                  onChange={e => setForm({...form, supplier_company_text: e.target.value})}
                />
                <datalist id="companiesList">
                  {companies.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>`;

frontCode = frontCode.replace(oldSelect, newInput);

const oldReviewSelect = `<div className="acc-field">
              <label>Supplier Company (Our Company) *</label>
              <select value={form.supplier_company_id} onChange={e => setForm({...form, supplier_company_id: e.target.value})} disabled={readOnly}>
                <option value="">-- Choose Company --</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>`;

const newReviewInput = `<div className="acc-field">
              <label>Supplier Company (Our Company) *</label>
              <input 
                type="text" 
                list="companiesList"
                placeholder="Select or Enter Company" 
                value={form.supplier_company_text || ''} 
                onChange={e => setForm({...form, supplier_company_text: e.target.value})}
                disabled={readOnly}
              />
            </div>`;

frontCode = frontCode.replace(oldReviewSelect, newReviewInput);

frontCode = frontCode.replace(/<td>{tx\.supplier_company_name \|\| '-'}<\/td>/g, '<td>{tx.supplier_company_text || tx.supplier_company_name || "-"}</td>');

fs.writeFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', frontCode);
console.log('Fixed supplier company fields');
