const mysql = require('mysql2');
const fs = require('fs');

async function main() {
  console.log('Reading schema.sql...');
  let schema = fs.readFileSync('schema.sql', 'utf8');

  // Fix the duplicate INSERT INTO users issue
  schema = schema.replace(
    /INSERT INTO users \(id, full_name, username, password, role\) VALUES \(1, 'Admin', 'admin', '12345', 'admin'\);\s*INSERT INTO users \(id, full_name, username, password, role\) VALUES \(1, 'Admin', 'admin', '12345', 'admin'\);/g,
    "INSERT IGNORE INTO users (id, full_name, username, password, role) VALUES (1, 'Admin', 'admin', '12345', 'admin');"
  );
  
  // Remove conflicting SQL modes or variables if necessary
  schema = schema.replace(/\/\*!.*?\*\//g, '');
  schema = schema.replace(/--.*$/gm, '');

  console.log('Connecting to Railway MySQL...');
  const connection = mysql.createConnection({
    host: 'altaria.proxy.rlwy.net',
    port: 49095,
    user: 'root',
    password: 'EqeuCWMlgGjbUQfbzXAVGxruJANuzThe',
    database: 'railway',
    multipleStatements: true,
    connectTimeout: 20000
  });

  connection.connect((err) => {
    if (err) {
      console.error('Connection error:', err);
      process.exit(1);
    }
    console.log('Connected! Executing schema...');
    
    // We can execute it as one big block since multipleStatements is true
    connection.query(schema, (err, results) => {
      if (err) {
        console.error('Execution error:', err);
        process.exit(1);
      } else {
        console.log('Schema executed successfully!');
      }
      connection.end();
    });
  });
}

main();
