const fs = require('fs');
const mysql = require('mysql2/promise');
(async () => {
  const db = await mysql.createConnection({host:'127.0.0.1', user:'root', password:'9120', database:'crm_jot', port:3306});
  const file = fs.readFileSync('D:\\@nd last crm\\CRM_JOT\\backend\\templates\\1776850543080.docx');
  await db.query('UPDATE doc_template_versions SET template_binary = ?', [file]);
  console.log('Updated template binary for all templates on 3306.');
  process.exit(0);
})();
