const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = mysql.createConnection({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "crm_jot",
  dateStrings: ["DATE"]
});

function handleDisconnect() {
  db.connect((err) => {
    if (err) {
      console.log("DB Connection Error:", err.message);
      console.log("Retrying in 5 seconds...");
      setTimeout(handleDisconnect, 5000);
    } else {
      console.log("MySQL Connected successfully.");
    }
  });

  db.on('error', (err) => {
    console.log('DB error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = db;