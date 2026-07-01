const db = require("./db");
const crypto = require("crypto");

const seedAccounts = async () => {
  try {
    console.log("Connecting to DB and fetching existing data...");
    
    const buyers = await new Promise((res, rej) => db.query("SELECT id FROM buyers LIMIT 10", (err, data) => err ? rej(err) : res(data)));
    const sellers = await new Promise((res, rej) => db.query("SELECT id FROM sellers LIMIT 10", (err, data) => err ? rej(err) : res(data)));
    const products = await new Promise((res, rej) => db.query("SELECT id FROM products LIMIT 10", (err, data) => err ? rej(err) : res(data)));
    const companies = await new Promise((res, rej) => db.query("SELECT id FROM companies LIMIT 10", (err, data) => err ? rej(err) : res(data)));

    if (buyers.length === 0 || sellers.length === 0 || products.length === 0 || companies.length === 0) {
      console.log("Not enough master data (buyers/sellers/products/companies) to seed realistic accounts.");
      console.log("Using fallback IDs where necessary.");
    }

    const getRandom = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)].id : null;
    
    let count = 0;
    
    // get max seq for this year
    let year = new Date().getFullYear();
    const maxSeqResult = await new Promise((res, rej) => db.query(
      "SELECT MAX(CAST(SUBSTRING_INDEX(transaction_no, '-', -1) AS UNSIGNED)) as max_seq FROM account_transactions WHERE YEAR(transaction_date) = ?", 
      [year], 
      (err, data) => err ? rej(err) : res(data)
    ));
    
    let currentSeq = maxSeqResult[0].max_seq || 0;

    const ports = ["Jebel Ali", "Rotterdam", "Singapore", "Shanghai", "Los Angeles", "New York", "Dubai", "Mumbai"];
    const statuses = ["Draft", "Pending Financial Review", "Completed", "Cancelled"];

    for (let i = 0; i < 50; i++) {
      currentSeq++;
      const seqStr = String(currentSeq).padStart(4, '0');
      const transactionNo = `TX-${year}-${seqStr}`;
      
      const qty = (Math.random() * 5000 + 500).toFixed(4); // 500 to 5500
      const price = (Math.random() * 800 + 200).toFixed(2); // 200 to 1000
      const cost = (price * 0.8).toFixed(2);
      const shipmentVal = (qty * price).toFixed(2);
      const commission = (shipmentVal * 0.05).toFixed(2);
      const margin = (shipmentVal - (qty * cost)).toFixed(2);
      const netProfit = (margin - commission).toFixed(2);
      
      const start = new Date(2025, 0, 1);
      const end = new Date();
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      
      const sql = `
        INSERT INTO account_transactions (
          transaction_no, transaction_date, created_by, created_by_role, status,
          buyer_id, seller_id, product_id, supplier_company_id,
          loading_port, destination_port, quantity_mt, selling_price, selling_currency,
          shipment_value, payment_mode, ci_no, spa_no, cost_price, cost_currency,
          margin, commission_total, net_profit, impfa_no
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;
      
      const params = [
        transactionNo,
        date,
        "admin",
        "admin",
        statuses[Math.floor(Math.random() * statuses.length)],
        getRandom(buyers),
        getRandom(sellers),
        getRandom(products) || 'f5f69bb07e854dd2ac00ffae69f406c8', // fallback to valid product id format
        getRandom(companies),
        ports[Math.floor(Math.random() * ports.length)],
        ports[Math.floor(Math.random() * ports.length)],
        qty,
        price,
        "USD",
        shipmentVal,
        ["LC", "TT", "CAD"][Math.floor(Math.random() * 3)],
        `CI-${1000+i}`,
        `SPA-${1000+i}`,
        cost,
        "USD",
        margin,
        commission,
        netProfit,
        `IMPFA-${1000+i}`
      ];
      
      await new Promise((res, rej) => db.query(sql, params, (err, data) => err ? rej(err) : res(data)));
      count++;
    }

    console.log(`Successfully seeded ${count} account entries.`);
    process.exit(0);
  } catch (e) {
    console.error("Error seeding:", e);
    process.exit(1);
  }
};

seedAccounts();
