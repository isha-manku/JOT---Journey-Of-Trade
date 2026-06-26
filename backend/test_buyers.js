const db = require("./db");
db.query("SELECT id, created_at FROM buyers ORDER BY created_at DESC, id DESC LIMIT 20", (err, results) => {
  if (err) {
    console.error("Error querying buyers:", err);
    process.exit(1);
  }
  let hasNull = false;
  results.forEach(row => {
    if (!row.created_at || row.created_at === "0000-00-00 00:00:00") {
      console.log(`Buyer ID ${row.id} has invalid/null created_at: ${row.created_at}`);
      hasNull = true;
    }
  });
  console.log("Total buyers retrieved:", results.length);
  if (!hasNull) console.log("All created_at values look valid.");
  
  // also verify sorting logic: does id strictly follow created_at?
  console.log("Latest 5 records by created_at DESC:");
  results.slice(0, 5).forEach(r => console.log(r));
  process.exit(0);
});
