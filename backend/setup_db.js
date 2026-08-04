const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function setup() {
  try {
    console.log("Connecting to MySQL...");
    // Connect without database first to create it if it doesn't exist
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      multipleStatements: true // Important for running schema.sql
    });
    
    console.log("Creating database...");
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    
    console.log("Reading schema.sql...");
    let schemaSql = fs.readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf8');
    const firstStatementMatch = schemaSql.match(/(?:\/\*!40101|DROP|CREATE|SET|-- Host:)/);
    if (firstStatementMatch) {
      schemaSql = schemaSql.substring(firstStatementMatch.index);
    }
    
    console.log("Executing schema.sql...");
    await connection.query(schemaSql);
    
    console.log("Database setup complete!");
    await connection.end();
  } catch (err) {
    console.error("Setup failed:", err);
    process.exit(1);
  }
}

setup();
