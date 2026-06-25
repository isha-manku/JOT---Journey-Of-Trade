const db = require("./db");

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function setup() {
  console.log("Starting Accounts Module database setup...");
  try {
    // 1. Create currencies table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS currencies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(10) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        symbol VARCHAR(10) NOT NULL,
        is_active TINYINT(1) DEFAULT 1
      )
    `);
    console.log("✅ Table 'currencies' ready");

    // 2. Create payment_modes table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS payment_modes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        is_active TINYINT(1) DEFAULT 1
      )
    `);
    console.log("✅ Table 'payment_modes' ready");

    // Drop existing tables to recreate with updated schema in development
    await runQuery("DROP TABLE IF EXISTS commission_mandates");
    await runQuery("DROP TABLE IF EXISTS account_transactions");

    // 3. Create account_transactions table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS account_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_no VARCHAR(50) NOT NULL UNIQUE,
        transaction_date DATE NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_by_role ENUM('admin', 'manager') NOT NULL,
        status ENUM('Draft', 'Pending Financial Review', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending Financial Review',
        buyer_id INT NULL,
        seller_id INT NULL,
        product_id CHAR(32) NULL,
        supplier_company_id INT NULL,
        loading_port VARCHAR(255) NOT NULL,
        destination_port VARCHAR(255) NOT NULL,
        quantity_mt DECIMAL(15, 4) NOT NULL,
        selling_price DECIMAL(15, 2) NOT NULL,
        selling_currency VARCHAR(10) NOT NULL,
        shipment_value DECIMAL(15, 2) NOT NULL,
        payment_mode VARCHAR(100) NOT NULL,
        ci_no VARCHAR(100) NOT NULL,
        spa_no VARCHAR(100) NOT NULL,
        cost_price DECIMAL(15, 2) NULL,
        cost_currency VARCHAR(10) NULL,
        margin DECIMAL(15, 2) NULL,
        commission_total DECIMAL(15, 2) NULL,
        net_profit DECIMAL(15, 2) NULL,
        impfa_no VARCHAR(100) NULL,
        updated_by VARCHAR(255) NULL,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        reviewed_by VARCHAR(255) NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (buyer_id) REFERENCES buyers(id) ON DELETE SET NULL,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_company_id) REFERENCES companies(id) ON DELETE SET NULL
      )
    `);
    console.log("✅ Table 'account_transactions' ready");

    // 4. Create commission_mandates table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS commission_mandates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_transaction_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        FOREIGN KEY (account_transaction_id) REFERENCES account_transactions(id) ON DELETE CASCADE
      )
    `);
    console.log("✅ Table 'commission_mandates' ready");

    // 5. Seed default currencies
    const currencyCount = await runQuery("SELECT COUNT(*) as count FROM currencies");
    if (currencyCount[0].count === 0) {
      await runQuery(`
        INSERT INTO currencies (code, name, symbol) VALUES 
        ('USD', 'United States Dollar', '$'),
        ('EUR', 'Euro', '€'),
        ('AED', 'UAE Dirham', 'د.إ'),
        ('INR', 'Indian Rupee', '₹')
      `);
      console.log("✅ Seeded default currencies");
    }

    // 6. Seed default payment modes
    const modeCount = await runQuery("SELECT COUNT(*) as count FROM payment_modes");
    if (modeCount[0].count === 0) {
      await runQuery(`
        INSERT INTO payment_modes (name) VALUES 
        ('DLC MT700'),
        ('SBLC MT760'),
        ('TT MT103'),
        ('Cash'),
        ('Advance')
      `);
      console.log("✅ Seeded default payment modes");
    }

    console.log("Accounts Module database setup completed successfully!");
  } catch (err) {
    console.error("❌ DB Setup failed:", err);
  } finally {
    db.end();
  }
}

setup();
