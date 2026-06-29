const db = require("./db");
const util = require("util");

const query = util.promisify(db.query).bind(db);

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const randomDateStr = (start, end) => {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString().split("T")[0];
};

const companyPrefixes = ["Global", "Prime", "Apex", "Nova", "Crest", "Summit", "Alliance", "United", "Continental"];
const companySuffixes = ["Trading", "Foods", "Exports", "Commodities", "Logistics", "Agri", "Ventures"];
const countries = ["USA", "Brazil", "China", "UAE", "Qatar", "UK", "Germany", "India", "Australia", "Singapore"];
const products = [
  "Frozen Chicken Paws", "Frozen Chicken Mid Joint Wings", "Frozen Whole Chicken", 
  "Frozen Duck Wings", "Frozen Duck Paws", "Sugar ICUMSA 45", "Non GMO Soybeans", 
  "Yellow Corn", "White Corn", "Sunflower Oil"
];
const contacts = ["John", "Michael", "Sarah", "David", "Emma", "James", "Sophia", "Robert", "Olivia"];
const surNames = ["Smith", "Johnson", "Brown", "Williams", "Jones", "Garcia", "Miller", "Davis"];
const methods = ["Email", "WhatsApp", "Phone", "LinkedIn", "Website"];
const sources = ["LinkedIn", "Website", "Referral", "Cold Call", "Exhibition"];
const statuses = ["New", "In Progress", "Quoted", "Negotiating", "Closed Won", "Closed Lost"];

async function main() {
  try {
    console.log("Seeding 50 Sellers...");
    const insertedSellerIds = [];
    for (let i = 0; i < 50; i++) {
      const name = `${randomChoice(companyPrefixes)} ${randomChoice(companySuffixes)} ${randomChoice(["LLC", "Ltd", "Inc"])}`;
      const country = randomChoice(countries);
      const email = `contact@${name.replace(/ /g, "").toLowerCase()}.com`;
      const phone = `+${randomInt(10, 99)} ${randomInt(1000, 9999)} ${randomInt(1000, 9999)}`;
      const product = randomChoice(products);
      
      const res = await query("INSERT INTO sellers (name, country, email, phone, product) VALUES (?, ?, ?, ?, ?)", [
        name, country, email, phone, product
      ]);
      insertedSellerIds.push(res.insertId);
    }
    console.log("50 Sellers seeded.");

    console.log("Seeding 50 Inquiries (Queries)...");
    for (let i = 0; i < 50; i++) {
      const date = randomDateStr(new Date(2025, 0, 1), new Date());
      const source = randomChoice(sources);
      const buyerName = `${randomChoice(contacts)} ${randomChoice(surNames)}`;
      const product = randomChoice(products);
      const executor = randomChoice(contacts);
      const method = randomChoice(methods);
      const status = randomChoice(statuses);
      const quality = randomInt(1, 5);
      const remarks = `Looking for ${randomInt(5, 50)} MT of ${product}`;
      
      await query(`
        INSERT INTO inquiries 
        (inquiry_date, inquiry_source, buyer_name, product_name, query_executor, initial_contact_method, response_status, buyer_quality_rating, remarks, remark_done) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [date, source, buyerName, product, executor, method, status, quality, remarks, 0]);
    }
    console.log("50 Inquiries seeded.");

    console.log("Seeding 20 Account Transactions for existing buyers...");
    const existingBuyers = await query("SELECT * FROM buyers LIMIT 20");
    if (existingBuyers.length === 0) {
      console.log("No existing buyers found! Please add buyers first.");
      process.exit(0);
    }
    
    // Fallback sellers if inserted ones aren't available for some reason
    const sellerIds = insertedSellerIds.length > 0 ? insertedSellerIds : (await query("SELECT id FROM sellers LIMIT 20")).map(s => s.id);

    const existingProducts = await query("SELECT id FROM products LIMIT 20");
    const productIds = existingProducts.length > 0 ? existingProducts.map(p => p.id) : [1];

    let count = 0;
    for (const buyer of existingBuyers) {
      if (count >= 20) break;
      
      const date = randomDateStr(new Date(2025, 6, 1), new Date());
      const txNo = `TRX-2026-${String(randomInt(1000, 9999))}`;
      const qty = randomInt(20, 500);
      const costPrice = randomFloat(800, 1500);
      const marginPerMt = randomFloat(20, 100);
      const sellingPrice = +(costPrice + marginPerMt).toFixed(2);
      
      const marginTotal = +(marginPerMt * qty).toFixed(2);
      const commTotal = +(randomFloat(2, 5) * qty).toFixed(2); 
      const netProfit = +(marginTotal - commTotal).toFixed(2);
      const shipmentValue = +(sellingPrice * qty).toFixed(2);

      const sellerId = randomChoice(sellerIds);
      const status = randomChoice(['Draft', 'Pending Financial Review', 'Completed', 'Cancelled']);

      const productId = randomChoice(productIds);

      await query(`
        INSERT INTO account_transactions (
          transaction_no, transaction_date, created_by, created_by_role, status,
          buyer_id, seller_id, product_id,
          loading_port, destination_port, quantity_mt, selling_price, selling_currency,
          shipment_value, payment_mode, ci_no, spa_no, impfa_no,
          cost_price, cost_currency, margin, commission_total, net_profit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        txNo, date, "System", "admin", status,
        buyer.id, sellerId, productId,
        "Santos, Brazil", "Jebel Ali, UAE", qty, sellingPrice, "USD",
        shipmentValue, "LC at sight", "CI-100", "SPA-100", "IMP-100",
        costPrice, "USD", marginTotal, commTotal, netProfit
      ]);
      count++;
    }
    console.log(`${count} Account Transactions seeded with realistic values.`);

    process.exit(0);
  } catch (e) {
    console.error("Error seeding:", e);
    process.exit(1);
  }
}

main();
