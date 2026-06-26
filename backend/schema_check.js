const db = require("./db");
db.query("DESCRIBE inquiries inquiry_date", (err, res) => {
  if (err) throw err;
  console.log("Column inquiry_date type:", res[0].Type);
  process.exit(0);
});
