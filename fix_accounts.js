const fs = require('fs');
let code = fs.readFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', 'utf8');

code = code.replace(/seller_id: "",/g, 'seller_name_text: "",');
code = code.replace(/seller_id: tx\.seller_id \|\| "",/g, 'seller_name_text: tx.seller_name_text || tx.seller_name || "",');

const oldSelect = `<label>Seller Name *</label>
                <select value={form.seller_id} onChange={e => setForm({...form, seller_id: e.target.value})}>
                  <option value="">-- Choose Seller --</option>
                  {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>`;

const newInput = `<label>Seller Name *</label>
                <input type="text" placeholder="Enter Seller Name" value={form.seller_name_text || ''} onChange={e => setForm({...form, seller_name_text: e.target.value})} />`;

code = code.replace(oldSelect, newInput);

const oldReviewSelect = `<label>Seller Name *</label>
              <select value={form.seller_id} onChange={e => setForm({...form, seller_id: e.target.value})} disabled={readOnly}>
                <option value="">-- Choose Seller --</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>`;

const newReviewInput = `<label>Seller Name *</label>
              <input type="text" placeholder="Enter Seller Name" value={form.seller_name_text || ''} onChange={e => setForm({...form, seller_name_text: e.target.value})} disabled={readOnly} />`;

code = code.replace(oldReviewSelect, newReviewInput);

code = code.replace(/<td>{tx\.seller_name \|\| '-'}<\/td>/g, '<td>{tx.seller_name_text || tx.seller_name || "-"}</td>');

fs.writeFileSync('backend/crm-jot-frontend/src/pages/Accounts.js', code);
console.log('Fixed Accounts.js via script');
