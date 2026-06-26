const db = require("./db");
db.query("DESCRIBE inquiries", (err, res) => {
  if (err) throw err;
  console.log(res);
  db.query("SELECT id, inquiry_date FROM inquiries LIMIT 2", (err2, res2) => {
    console.log(res2);
    process.exit(0);
  });
});
