const fs = require('fs');
let s = fs.readFileSync('schema.sql', 'utf8');
s = s.replace(/\/\*!.*?\*\//g, '');
s = s.replace(/INSERT INTO users \(id, full_name, username, password, role\) VALUES \(1, 'Admin', 'admin', '12345', 'admin'\);\s*INSERT INTO users \(id, full_name, username, password, role\) VALUES \(1, 'Admin', 'admin', '12345', 'admin'\);/g, "INSERT IGNORE INTO users (id, full_name, username, password, role) VALUES (1, 'Admin', 'admin', '12345', 'admin');");
fs.writeFileSync('clean_schema.sql', s);
console.log('Done cleaning schema!');
