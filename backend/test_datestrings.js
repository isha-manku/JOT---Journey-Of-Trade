const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const db = mysql.createConnection({
  host:     process.env.DB_HOST     || "localhost",
  user:     process.env.DB_USER     || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME     || "crm_jot",
  dateStrings: ["DATE"]
});

db.query("SELECT id, inquiry_date, created_at FROM inquiries LIMIT 2", (err, res) => {
  if (err) throw err;
  console.log(res);
  process.exit(0);
});
