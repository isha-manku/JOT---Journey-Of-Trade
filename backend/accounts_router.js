const express = require("express");
const router = express.Router();
const db = require("./db");

// Helper to run queries as promises
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// ── REFERENCE ROUTES ────────────────────────────────────────────────────────

// GET /currencies
router.get("/currencies", async (req, res) => {
  try {
    const results = await query("SELECT * FROM currencies WHERE is_active = 1 ORDER BY code");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /currencies
router.post("/currencies", async (req, res) => {
  try {
    const { code, name, symbol } = req.body;
    if (!code || !name || !symbol) {
      return res.status(400).json({ error: "All currency fields are required" });
    }
    await query("INSERT INTO currencies (code, name, symbol) VALUES (?, ?, ?)", [
      code.toUpperCase(),
      name,
      symbol
    ]);
    res.json({ success: true, message: "Currency Added" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Currency code already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// GET /payment-modes
router.get("/payment-modes", async (req, res) => {
  try {
    const results = await query("SELECT * FROM payment_modes WHERE is_active = 1 ORDER BY name");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /payment-modes
router.post("/payment-modes", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Payment mode name is required" });
    }
    await query("INSERT INTO payment_modes (name) VALUES (?)", [name]);
    res.json({ success: true, message: "Payment Mode Added" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ error: "Payment mode already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// GET /products (reference products)
router.get("/products", async (req, res) => {
  try {
    const results = await query("SELECT * FROM products WHERE is_active = 1 ORDER BY name");
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ── TRANSACTION ROUTES ──────────────────────────────────────────────────────

// POST /accounts (Create Transaction)
router.post("/accounts", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  const username = req.headers["x-username"] || "System";
  
  const {
    transaction_date,
    buyer_id,
    seller_id,
    product_id,
    supplier_company_id,
    loading_port,
    destination_port,
    quantity_mt,
    selling_price,
    selling_currency,
    payment_mode,
    ci_no,
    spa_no,
    
    // Admin fields
    cost_price,
    cost_currency,
    impfa_no,
    mandates = [],
    status
  } = req.body;

  // Basic validation
  if (!transaction_date || !buyer_id || !seller_id || !product_id || !supplier_company_id ||
      !loading_port || !destination_port || !quantity_mt || !selling_price || 
      !selling_currency || !payment_mode || !ci_no || !spa_no) {
    return res.status(400).json({ error: "Missing required common fields" });
  }

  try {
    // 1. Auto-generate transaction number
    const txYear = new Date(transaction_date).getFullYear();
    const countResult = await query(
      "SELECT COUNT(*) as count FROM account_transactions WHERE YEAR(transaction_date) = ?",
      [txYear]
    );
    const sequence = countResult[0].count + 1;
    const transaction_no = `ACC-${txYear}-${String(sequence).padStart(4, "0")}`;

    // 2. Calculations
    const shipment_value = Number(quantity_mt) * Number(selling_price);

    let final_status = "Pending Financial Review";
    let db_cost_price = null;
    let db_cost_currency = null;
    let db_margin = null;
    let db_commission_total = null;
    let db_net_profit = null;
    let db_impfa_no = null;
    let db_reviewed_by = null;
    let db_reviewed_at = null;

    if (role === "admin") {
      db_cost_price = cost_price ? Number(cost_price) : null;
      db_cost_currency = cost_currency || null;
      db_impfa_no = impfa_no || null;
      final_status = status || "Completed";

      if (final_status === "Completed") {
        db_reviewed_by = username;
        db_reviewed_at = new Date();
      }

      if (db_cost_price !== null) {
        db_margin = Number(selling_price) - db_cost_price;
      }
      
      let sumMandates = 0;
      mandates.forEach(m => {
        sumMandates += Number(m.amount || 0);
      });
      db_commission_total = sumMandates;

      if (db_margin !== null) {
        db_net_profit = (db_margin * Number(quantity_mt)) - db_commission_total;
      }
    }

    // 3. Insert transaction record
    const insertTxSql = `
      INSERT INTO account_transactions (
        transaction_no, transaction_date, created_by, created_by_role, status,
        buyer_id, seller_id, product_id, supplier_company_id,
        loading_port, destination_port, quantity_mt, selling_price, selling_currency,
        shipment_value, payment_mode, ci_no, spa_no,
        cost_price, cost_currency, margin, commission_total, net_profit, impfa_no,
        reviewed_by, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const txParams = [
      transaction_no, transaction_date, username, role, final_status,
      buyer_id, seller_id, product_id, supplier_company_id,
      loading_port, destination_port, quantity_mt, selling_price, selling_currency,
      shipment_value, payment_mode, ci_no, spa_no,
      db_cost_price, db_cost_currency, db_margin, db_commission_total, db_net_profit, db_impfa_no,
      db_reviewed_by, db_reviewed_at
    ];

    const txResult = await query(insertTxSql, txParams);
    const txId = txResult.insertId;

    // 4. Insert mandates if admin
    if (role === "admin" && mandates.length > 0) {
      const mandateSql = "INSERT INTO commission_mandates (account_transaction_id, name, phone, amount) VALUES ?";
      const mandateValues = mandates.map(m => [txId, m.name, m.phone, Number(m.amount)]);
      await query(mandateSql, [mandateValues]);
    }

    res.json({ success: true, transaction_no, id: txId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /accounts/:id (Update/Review Transaction - Admin Only)
router.put("/accounts/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const txId = req.params.id;
  const {
    // Basic fields (admin can also update these)
    transaction_date,
    buyer_id,
    seller_id,
    product_id,
    supplier_company_id,
    loading_port,
    destination_port,
    quantity_mt,
    selling_price,
    selling_currency,
    payment_mode,
    ci_no,
    spa_no,

    // Admin fields
    cost_price,
    cost_currency,
    impfa_no,
    mandates = [],
    status
  } = req.body;

  try {
    // 1. Fetch current record to resolve default values
    const currentTxResult = await query("SELECT * FROM account_transactions WHERE id = ?", [txId]);
    if (currentTxResult.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const currentTx = currentTxResult[0];

    // Read-only Lock Verification
    if (currentTx.status === "Completed") {
      return res.status(400).json({ error: "Completed transactions cannot be modified. Please reopen the transaction first." });
    }

    const final_date = transaction_date || currentTx.transaction_date;
    const final_buyer = buyer_id || currentTx.buyer_id;
    const final_seller = seller_id || currentTx.seller_id;
    const final_product = product_id || currentTx.product_id;
    const final_company = supplier_company_id || currentTx.supplier_company_id;
    const final_loading = loading_port || currentTx.loading_port;
    const final_dest = destination_port || currentTx.destination_port;
    const final_qty = quantity_mt !== undefined ? Number(quantity_mt) : Number(currentTx.quantity_mt);
    const final_sel_price = selling_price !== undefined ? Number(selling_price) : Number(currentTx.selling_price);
    const final_sel_curr = selling_currency || currentTx.selling_currency;
    const final_pay_mode = payment_mode || currentTx.payment_mode;
    const final_ci = ci_no || currentTx.ci_no;
    const final_spa = spa_no || currentTx.spa_no;

    // 2. Calculations
    const shipment_value = final_qty * final_sel_price;

    const db_cost_price = cost_price !== undefined ? (cost_price !== null ? Number(cost_price) : null) : currentTx.cost_price;
    const db_cost_currency = cost_currency || currentTx.cost_currency;
    const db_impfa_no = impfa_no !== undefined ? impfa_no : currentTx.impfa_no;
    const final_status = status || "Completed";

    let db_margin = null;
    if (db_cost_price !== null) {
      db_margin = final_sel_price - db_cost_price;
    }

    let sumMandates = 0;
    mandates.forEach(m => {
      sumMandates += Number(m.amount || 0);
    });
    const db_commission_total = sumMandates;

    let db_net_profit = null;
    if (db_margin !== null) {
      db_net_profit = (db_margin * final_qty) - db_commission_total;
    }

    // 3. Update transaction record
    const updateSql = `
      UPDATE account_transactions SET
        transaction_date = ?, buyer_id = ?, seller_id = ?, product_id = ?, supplier_company_id = ?,
        loading_port = ?, destination_port = ?, quantity_mt = ?, selling_price = ?, selling_currency = ?,
        shipment_value = ?, payment_mode = ?, ci_no = ?, spa_no = ?,
        cost_price = ?, cost_currency = ?, margin = ?, commission_total = ?, net_profit = ?, impfa_no = ?,
        status = ?, updated_by = ?, reviewed_by = ?, reviewed_at = ?
      WHERE id = ?
    `;

    await query(updateSql, [
      final_date, final_buyer, final_seller, final_product, final_company,
      final_loading, final_dest, final_qty, final_sel_price, final_sel_curr,
      shipment_value, final_pay_mode, final_ci, final_spa,
      db_cost_price, db_cost_currency, db_margin, db_commission_total, db_net_profit, db_impfa_no,
      final_status,
      req.headers["x-username"] || "System",
      final_status === "Completed" ? (req.headers["x-username"] || "System") : currentTx.reviewed_by,
      final_status === "Completed" ? new Date() : currentTx.reviewed_at,
      txId
    ]);

    // 4. Update mandates (delete existing, insert new)
    await query("DELETE FROM commission_mandates WHERE account_transaction_id = ?", [txId]);
    if (mandates.length > 0) {
      const mandateSql = "INSERT INTO commission_mandates (account_transaction_id, name, phone, amount) VALUES ?";
      const mandateValues = mandates.map(m => [txId, m.name, m.phone, Number(m.amount)]);
      await query(mandateSql, [mandateValues]);
    }

    res.json({ success: true, message: "Transaction Updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts (List all - Admin Only)
router.get("/accounts", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  try {
    const sql = `
      SELECT tx.*, 
             b.buyer_name, b.company_name AS buyer_company_name,
             s.name AS seller_name,
             c.name AS supplier_company_name,
             p.name AS product_name,
             DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
             CONCAT('Q', QUARTER(tx.transaction_date), '-', YEAR(tx.transaction_date)) AS profit_quarter,
             YEAR(tx.transaction_date) AS profit_year
      FROM account_transactions tx
      LEFT JOIN buyers b ON tx.buyer_id = b.id
      LEFT JOIN sellers s ON tx.seller_id = s.id
      LEFT JOIN companies c ON tx.supplier_company_id = c.id
      LEFT JOIN products p ON tx.product_id = p.id
      ORDER BY tx.created_at DESC
    `;
    const transactions = await query(sql);

    // Fetch mandates for all transactions
    const mandates = await query("SELECT * FROM commission_mandates");
    
    // Group mandates by transaction ID
    const mandatesMap = {};
    mandates.forEach(m => {
      if (!mandatesMap[m.account_transaction_id]) {
        mandatesMap[m.account_transaction_id] = [];
      }
      mandatesMap[m.account_transaction_id].push(m);
    });

    // Map mandates to transactions
    const result = transactions.map(tx => ({
      ...tx,
      mandates: mandatesMap[tx.id] || []
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to build analytics filters
function buildAnalyticsFilters(queryObj) {
  let clauses = [];
  let params = [];

  // Status Filter (Default to Completed)
  const status = queryObj.status || "Completed";
  if (status !== "All") {
    clauses.push("tx.status = ?");
    params.push(status);
  }

  if (queryObj.start_date) {
    clauses.push("tx.transaction_date >= ?");
    params.push(queryObj.start_date);
  }
  if (queryObj.end_date) {
    clauses.push("tx.transaction_date <= ?");
    params.push(queryObj.end_date);
  }
  if (queryObj.buyer_id) {
    clauses.push("tx.buyer_id = ?");
    params.push(queryObj.buyer_id);
  }
  if (queryObj.seller_id) {
    clauses.push("tx.seller_id = ?");
    params.push(queryObj.seller_id);
  }
  if (queryObj.supplier_company_id) {
    clauses.push("tx.supplier_company_id = ?");
    params.push(queryObj.supplier_company_id);
  }
  if (queryObj.product_id) {
    clauses.push("tx.product_id = ?");
    params.push(queryObj.product_id);
  }
  if (queryObj.loading_port) {
    clauses.push("tx.loading_port = ?");
    params.push(queryObj.loading_port);
  }
  if (queryObj.destination_port) {
    clauses.push("tx.destination_port = ?");
    params.push(queryObj.destination_port);
  }
  if (queryObj.payment_mode) {
    clauses.push("tx.payment_mode = ?");
    params.push(queryObj.payment_mode);
  }

  return {
    whereSql: clauses.length > 0 ? "WHERE " + clauses.join(" AND ") : "",
    params
  };
}

// GET /accounts/analytics (Unified Dashboard API)
router.get("/accounts/analytics", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const { whereSql, params } = buildAnalyticsFilters(req.query);

  try {
    const [
      summary,
      highest_buyer,
      highest_product,
      highest_company,
      highest_route,
      buyers,
      products,
      routes,
      companies,
      sellers,
      financials_monthly,
      financials_quarterly,
      financials_yearly,
      commissions,
      paymentModes,
      matrix
    ] = await Promise.all([
      // 1. Summary details (KPI cards)
      query(`
        SELECT 
          COALESCE(SUM(tx.shipment_value), 0) AS total_shipment_value,
          COALESCE(SUM(tx.net_profit), 0) AS total_net_profit,
          COALESCE(SUM(tx.commission_total), 0) AS total_commission_paid,
          COUNT(DISTINCT tx.buyer_id) AS total_buyers,
          COUNT(DISTINCT tx.product_id) AS total_products,
          COUNT(DISTINCT tx.supplier_company_id) AS total_companies,
          COALESCE(AVG(tx.net_profit), 0) AS avg_profit_per_tx,
          COUNT(*) AS total_transactions
        FROM account_transactions tx
        ${whereSql}
      `, params),

      // 2. Highest Profit Buyer
      query(`
        SELECT tx.buyer_id AS id, b.buyer_name AS name, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN buyers b ON tx.buyer_id = b.id
        ${whereSql}
        GROUP BY tx.buyer_id
        ORDER BY profit DESC LIMIT 1
      `, params),

      // 3. Highest Profit Product
      query(`
        SELECT tx.product_id AS id, p.name AS name, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${whereSql}
        GROUP BY tx.product_id
        ORDER BY profit DESC LIMIT 1
      `, params),

      // 4. Highest Profit Company
      query(`
        SELECT tx.supplier_company_id AS id, c.name AS name, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN companies c ON tx.supplier_company_id = c.id
        ${whereSql}
        GROUP BY tx.supplier_company_id
        ORDER BY profit DESC LIMIT 1
      `, params),

      // 5. Highest Profit Route
      query(`
        SELECT tx.loading_port, tx.destination_port, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${whereSql}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY profit DESC LIMIT 1
      `, params),

      // 6. Buyers BI
      query(`
        SELECT 
          tx.buyer_id AS id, b.buyer_name, b.company_name,
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.shipment_value), 0) AS total_shipment_value,
          COALESCE(SUM(tx.net_profit), 0) AS total_net_profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          MAX(tx.transaction_date) AS last_transaction_date
        FROM account_transactions tx
        LEFT JOIN buyers b ON tx.buyer_id = b.id
        ${whereSql}
        GROUP BY tx.buyer_id
        ORDER BY total_net_profit DESC
      `, params),

      // 7. Products BI
      query(`
        SELECT 
          tx.product_id AS id, p.name AS product_name,
          COALESCE(SUM(tx.quantity_mt), 0) AS total_quantity,
          COALESCE(SUM(tx.shipment_value), 0) AS total_revenue,
          COALESCE(SUM(tx.net_profit), 0) AS total_profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          COUNT(*) AS transaction_count
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        ${whereSql}
        GROUP BY tx.product_id
        ORDER BY total_profit DESC
      `, params),

      // 8. Trade Routes BI
      query(`
        SELECT 
          tx.loading_port, tx.destination_port,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          COUNT(*) AS transaction_count
        FROM account_transactions tx
        ${whereSql}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY profit DESC
      `, params),

      // 9. Companies BI
      query(`
        SELECT 
          tx.supplier_company_id AS id, c.name AS company_name,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COALESCE(SUM(tx.commission_total), 0) AS commission,
          COUNT(*) AS transactions,
          COUNT(DISTINCT tx.product_id) AS products_count,
          COUNT(DISTINCT tx.buyer_id) AS buyers_served
        FROM account_transactions tx
        LEFT JOIN companies c ON tx.supplier_company_id = c.id
        ${whereSql}
        GROUP BY tx.supplier_company_id
        ORDER BY profit DESC
      `, params),

      // 10. Sellers BI
      query(`
        SELECT 
          tx.seller_id AS id, s.name AS seller_name,
          COUNT(*) AS transactions,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COUNT(DISTINCT tx.buyer_id) AS buyers_served,
          COUNT(DISTINCT tx.product_id) AS products_sold,
          COALESCE(SUM(tx.commission_total), 0) AS commission_impact
        FROM account_transactions tx
        LEFT JOIN sellers s ON tx.seller_id = s.id
        ${whereSql}
        GROUP BY tx.seller_id
        ORDER BY profit DESC
      `, params),

      // 11. Monthly trends
      query(`
        SELECT 
          DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          COALESCE(SUM(tx.commission_total), 0) AS commission,
          COUNT(*) AS transaction_count
        FROM account_transactions tx
        ${whereSql}
        GROUP BY profit_month
        ORDER BY profit_month ASC
      `, params),

      // 12. Quarterly trends
      query(`
        SELECT 
          CONCAT('Q', QUARTER(tx.transaction_date), '-', YEAR(tx.transaction_date)) AS profit_quarter,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COUNT(*) AS transaction_count
        FROM account_transactions tx
        ${whereSql}
        GROUP BY profit_quarter
        ORDER BY MIN(tx.transaction_date) ASC
      `, params),

      // 13. Yearly trends
      query(`
        SELECT 
          YEAR(tx.transaction_date) AS profit_year,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COUNT(*) AS transaction_count
        FROM account_transactions tx
        ${whereSql}
        GROUP BY profit_year
        ORDER BY profit_year ASC
      `, params),

      // 14. Mandate commissions
      query(`
        SELECT cm.name, cm.phone, COALESCE(SUM(cm.amount), 0) AS total_commission, COUNT(DISTINCT cm.account_transaction_id) AS transaction_count
        FROM commission_mandates cm
        JOIN account_transactions tx ON cm.account_transaction_id = tx.id
        ${whereSql}
        GROUP BY cm.name, cm.phone
        ORDER BY total_commission DESC
      `, params),

      // 15. Payment Mode Distribution
      query(`
        SELECT 
          tx.payment_mode,
          COUNT(*) AS count,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${whereSql}
        GROUP BY tx.payment_mode
        ORDER BY profit DESC
      `, params),

      // 16. Company x Product Matrix
      query(`
        SELECT 
          tx.supplier_company_id AS company_id, c.name AS company_name,
          tx.product_id, p.name AS product_name,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit,
          COALESCE(SUM(tx.quantity_mt), 0) AS quantity
        FROM account_transactions tx
        LEFT JOIN companies c ON tx.supplier_company_id = c.id
        LEFT JOIN products p ON tx.product_id = p.id
        ${whereSql}
        GROUP BY tx.supplier_company_id, tx.product_id
        ORDER BY company_name, profit DESC
      `, params)
    ]);

    // Format top routes and bottom routes
    const topRoutes = routes.slice(0, 10);
    const bottomRoutes = [...routes].reverse().slice(0, 10);

    res.json({
      summary: {
        ...summary[0],
        highest_buyer: highest_buyer[0] || null,
        highest_product: highest_product[0] || null,
        highest_company: highest_company[0] || null,
        highest_route: highest_route[0] || null
      },
      buyers,
      products,
      routes: { top: topRoutes, bottom: bottomRoutes },
      companies,
      sellers,
      trends: {
        monthly: financials_monthly,
        quarterly: financials_quarterly,
        yearly: financials_yearly
      },
      commissions,
      paymentModes,
      matrix
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/:id (Single Transaction - Admin/Manager)
router.get("/accounts/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  const txId = req.params.id;

  try {
    const sql = `
      SELECT tx.*, 
             b.buyer_name, b.company_name AS buyer_company_name,
             s.name AS seller_name,
             c.name AS supplier_company_name,
             p.name AS product_name,
             DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
             CONCAT('Q', QUARTER(tx.transaction_date), '-', YEAR(tx.transaction_date)) AS profit_quarter,
             YEAR(tx.transaction_date) AS profit_year
      FROM account_transactions tx
      LEFT JOIN buyers b ON tx.buyer_id = b.id
      LEFT JOIN sellers s ON tx.seller_id = s.id
      LEFT JOIN companies c ON tx.supplier_company_id = c.id
      LEFT JOIN products p ON tx.product_id = p.id
      WHERE tx.id = ?
    `;
    const results = await query(sql, [txId]);
    if (results.length === 0) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    const tx = results[0];

    if (role === "admin") {
      // Return full record including mandates
      const mandates = await query("SELECT * FROM commission_mandates WHERE account_transaction_id = ?", [txId]);
      res.json({ ...tx, mandates });
    } else {
      // Filter out admin-only fields for manager
      const managerTx = {
        id: tx.id,
        transaction_no: tx.transaction_no,
        transaction_date: tx.transaction_date,
        created_by: tx.created_by,
        created_by_role: tx.created_by_role,
        status: tx.status,
        buyer_id: tx.buyer_id,
        buyer_name: tx.buyer_name,
        buyer_company_name: tx.buyer_company_name,
        seller_id: tx.seller_id,
        seller_name: tx.seller_name,
        product_id: tx.product_id,
        product_name: tx.product_name,
        supplier_company_id: tx.supplier_company_id,
        supplier_company_name: tx.supplier_company_name,
        loading_port: tx.loading_port,
        destination_port: tx.destination_port,
        quantity_mt: tx.quantity_mt,
        selling_price: tx.selling_price,
        selling_currency: tx.selling_currency,
        shipment_value: tx.shipment_value,
        payment_mode: tx.payment_mode,
        ci_no: tx.ci_no,
        spa_no: tx.spa_no,
        profit_month: tx.profit_month,
        profit_quarter: tx.profit_quarter,
        profit_year: tx.profit_year,
        created_at: tx.created_at
      };
      res.json(managerTx);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /accounts/:id/cancel (Soft Delete / Cancel - Admin Only)
router.post("/accounts/:id/cancel", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const txId = req.params.id;
  try {
    await query("UPDATE account_transactions SET status = 'Cancelled' WHERE id = ?", [txId]);
    res.json({ success: true, message: "Transaction Cancelled (Soft Deleted)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /accounts/:id/reopen (Reopen Transaction - Admin Only)
router.post("/accounts/:id/reopen", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  const username = req.headers["x-username"] || "System";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const txId = req.params.id;
  try {
    await query(
      "UPDATE account_transactions SET status = 'Pending Financial Review', reviewed_by = NULL, reviewed_at = NULL, updated_by = ? WHERE id = ?",
      [username, txId]
    );
    res.json({ success: true, message: "Transaction Reopened Successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// GET /accounts/analytics/buyer/:id (Buyer Dashboard BI API)
router.get("/accounts/analytics/buyer/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const buyerId = req.params.id;
  const { whereSql, params } = buildAnalyticsFilters(req.query);

  let finalWhere = whereSql ? `${whereSql} AND tx.buyer_id = ?` : "WHERE tx.buyer_id = ?";
  let finalParams = [...params, buyerId];

  try {
    const [
      details,
      stats,
      mostPurchased,
      preferredMode,
      preferredRoute,
      docCount,
      loadingPorts,
      destinationPorts,
      products,
      companies,
      paymentModes,
      trends,
      recent
    ] = await Promise.all([
      // Details
      query("SELECT * FROM buyers WHERE id = ?", [buyerId]),

      // Stats
      query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.shipment_value), 0) AS total_shipment_value,
          COALESCE(SUM(tx.net_profit), 0) AS total_net_profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          COALESCE(AVG(tx.shipment_value), 0) AS avg_tx_value,
          COALESCE(MAX(tx.shipment_value), 0) AS max_tx_value
        FROM account_transactions tx
        ${finalWhere}
      `, finalParams),

      // Most Purchased Product
      query(`
        SELECT p.name AS name, COALESCE(SUM(tx.quantity_mt), 0) AS quantity
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${finalWhere}
        GROUP BY tx.product_id
        ORDER BY quantity DESC LIMIT 1
      `, finalParams),

      // Preferred Payment Mode
      query(`
        SELECT tx.payment_mode, COUNT(*) AS count
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.payment_mode
        ORDER BY count DESC LIMIT 1
      `, finalParams),

      // Preferred Route
      query(`
        SELECT tx.loading_port, tx.destination_port, COUNT(*) AS count
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY count DESC LIMIT 1
      `, finalParams),

      // Document Count
      query("SELECT COUNT(*) AS count FROM doc_generated_documents WHERE buyer_id = ?", [buyerId]),

      // Top Loading Ports
      query(`
        SELECT tx.loading_port AS port, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.loading_port
        ORDER BY profit DESC
      `, finalParams),

      // Top Destination Ports
      query(`
        SELECT tx.destination_port AS port, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.destination_port
        ORDER BY profit DESC
      `, finalParams),

      // Products purchased
      query(`
        SELECT tx.product_id, p.name AS product_name, COALESCE(SUM(tx.quantity_mt), 0) AS quantity, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${finalWhere}
        GROUP BY tx.product_id
        ORDER BY profit DESC
      `, finalParams),

      // Companies used
      query(`
        SELECT tx.supplier_company_id AS company_id, c.name AS company_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN companies c ON tx.supplier_company_id = c.id
        ${finalWhere}
        GROUP BY tx.supplier_company_id
        ORDER BY profit DESC
      `, finalParams),

      // Payment Modes
      query(`
        SELECT tx.payment_mode, COUNT(*) AS count, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.payment_mode
        ORDER BY profit DESC
      `, finalParams),

      // Trends
      query(`
        SELECT 
          DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY profit_month
        ORDER BY profit_month ASC
      `, finalParams),

      // Recent Transactions
      query(`
        SELECT tx.*, p.name AS product_name
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        WHERE tx.buyer_id = ?
        ORDER BY tx.transaction_date DESC LIMIT 10
      `, [buyerId])
    ]);

    if (details.length === 0) {
      return res.status(404).json({ error: "Buyer not found" });
    }

    res.json({
      details: details[0],
      stats: {
        ...stats[0],
        most_purchased: mostPurchased[0] || null,
        preferred_mode: preferredMode[0] || null,
        preferred_route: preferredRoute[0] || null,
        document_count: docCount[0].count
      },
      loadingPorts,
      destinationPorts,
      products,
      companies,
      paymentModes,
      trends,
      recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/analytics/seller/:id (Seller Dashboard BI API)
router.get("/accounts/analytics/seller/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const sellerId = req.params.id;
  const { whereSql, params } = buildAnalyticsFilters(req.query);

  let finalWhere = whereSql ? `${whereSql} AND tx.seller_id = ?` : "WHERE tx.seller_id = ?";
  let finalParams = [...params, sellerId];

  try {
    const [
      details,
      stats,
      buyers,
      products,
      trends,
      recent
    ] = await Promise.all([
      query("SELECT * FROM sellers WHERE id = ?", [sellerId]),
      query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.shipment_value), 0) AS total_shipment_value,
          COALESCE(SUM(tx.net_profit), 0) AS total_net_profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin,
          COALESCE(AVG(tx.shipment_value), 0) AS avg_tx_value,
          COALESCE(SUM(tx.commission_total), 0) AS commission_impact
        FROM account_transactions tx
        ${finalWhere}
      `, finalParams),
      query(`
        SELECT tx.buyer_id, b.buyer_name, b.company_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        LEFT JOIN buyers b ON tx.buyer_id = b.id
        ${finalWhere}
        GROUP BY tx.buyer_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT tx.product_id, p.name AS product_name, COALESCE(SUM(tx.quantity_mt), 0) AS quantity, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${finalWhere}
        GROUP BY tx.product_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT 
          DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY profit_month
        ORDER BY profit_month ASC
      `, finalParams),
      query(`
        SELECT tx.*, p.name AS product_name
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        WHERE tx.seller_id = ?
        ORDER BY tx.transaction_date DESC LIMIT 10
      `, [sellerId])
    ]);

    if (details.length === 0) return res.status(404).json({ error: "Seller not found" });

    res.json({
      details: details[0],
      stats: stats[0],
      buyers,
      products,
      trends,
      recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/analytics/product/:id (Product Dashboard BI API)
router.get("/accounts/analytics/product/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const productId = req.params.id;
  const { whereSql, params } = buildAnalyticsFilters(req.query);

  let finalWhere = whereSql ? `${whereSql} AND tx.product_id = ?` : "WHERE tx.product_id = ?";
  let finalParams = [...params, productId];

  try {
    const [
      details,
      stats,
      totals,
      buyers,
      routes,
      trends,
      recent
    ] = await Promise.all([
      query("SELECT * FROM products WHERE id = ?", [productId]),
      query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.quantity_mt), 0) AS total_quantity,
          COALESCE(SUM(tx.shipment_value), 0) AS total_revenue,
          COALESCE(SUM(tx.net_profit), 0) AS total_profit,
          COALESCE(AVG(tx.margin), 0) AS avg_margin
        FROM account_transactions tx
        ${finalWhere}
      `, finalParams),
      query(`
        SELECT 
          COALESCE(SUM(net_profit), 0) AS global_profit,
          COALESCE(SUM(shipment_value), 0) AS global_revenue
        FROM account_transactions tx
        ${whereSql}
      `, params),
      query(`
        SELECT b.buyer_name, b.company_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        LEFT JOIN buyers b ON tx.buyer_id = b.id
        ${finalWhere}
        GROUP BY tx.buyer_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT tx.loading_port, tx.destination_port, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT 
          DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
          COALESCE(SUM(tx.quantity_mt), 0) AS quantity,
          COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY profit_month
        ORDER BY profit_month ASC
      `, finalParams),
      query(`
        SELECT tx.*, p.name AS product_name
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        WHERE tx.product_id = ?
        ORDER BY tx.transaction_date DESC LIMIT 10
      `, [productId])
    ]);

    if (details.length === 0) return res.status(404).json({ error: "Product not found" });

    const globalProfit = Number(totals[0].global_profit) || 1;
    const globalRevenue = Number(totals[0].global_revenue) || 1;
    const profitContr = (Number(stats[0].total_profit) / globalProfit) * 100;
    const revenueContr = (Number(stats[0].total_revenue) / globalRevenue) * 100;

    res.json({
      details: details[0],
      stats: {
        ...stats[0],
        profit_contribution_pct: profitContr,
        revenue_contribution_pct: revenueContr
      },
      buyers,
      routes,
      trends,
      recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/analytics/company/:id (Supplier Company Dashboard BI API)
router.get("/accounts/analytics/company/:id", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const companyId = req.params.id;
  const { whereSql, params } = buildAnalyticsFilters(req.query);

  let finalWhere = whereSql ? `${whereSql} AND tx.supplier_company_id = ?` : "WHERE tx.supplier_company_id = ?";
  let finalParams = [...params, companyId];

  try {
    const [
      details,
      stats,
      products,
      buyers,
      sellers,
      routes,
      trends,
      recent
    ] = await Promise.all([
      query("SELECT * FROM companies WHERE id = ?", [companyId]),
      query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.shipment_value), 0) AS total_revenue,
          COALESCE(SUM(tx.net_profit), 0) AS total_profit,
          COALESCE(SUM(tx.commission_total), 0) AS total_commission,
          COALESCE(AVG(tx.margin), 0) AS avg_margin
        FROM account_transactions tx
        ${finalWhere}
      `, finalParams),
      query(`
        SELECT p.name AS product_name, COALESCE(SUM(tx.quantity_mt), 0) AS quantity, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${finalWhere}
        GROUP BY tx.product_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT b.buyer_name, b.company_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        LEFT JOIN buyers b ON tx.buyer_id = b.id
        ${finalWhere}
        GROUP BY tx.buyer_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT s.name AS seller_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        LEFT JOIN sellers s ON tx.seller_id = s.id
        ${finalWhere}
        GROUP BY tx.seller_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT tx.loading_port, tx.destination_port, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT 
          DATE_FORMAT(tx.transaction_date, '%Y-%m') AS profit_month,
          COALESCE(SUM(tx.shipment_value), 0) AS revenue,
          COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY profit_month
        ORDER BY profit_month ASC
      `, finalParams),
      query(`
        SELECT tx.*, p.name AS product_name
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        WHERE tx.supplier_company_id = ?
        ORDER BY tx.transaction_date DESC LIMIT 10
      `, [companyId])
    ]);

    if (details.length === 0) return res.status(404).json({ error: "Company not found" });

    res.json({
      details: details[0],
      stats: stats[0],
      products,
      buyers,
      sellers,
      routes,
      trends,
      recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /accounts/analytics/port (Port Logistics Intelligence Dashboard API)
router.get("/accounts/analytics/port", async (req, res) => {
  const role = req.headers["x-user-role"] || "manager";
  if (role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }

  const portName = req.query.portName;
  if (!portName) {
    return res.status(400).json({ error: "portName query parameter is required" });
  }

  const { whereSql, params } = buildAnalyticsFilters(req.query);

  let finalWhere = whereSql 
    ? `${whereSql} AND (tx.loading_port = ? OR tx.destination_port = ?)` 
    : "WHERE (tx.loading_port = ? OR tx.destination_port = ?)";
  let finalParams = [...params, portName, portName];

  try {
    const [
      stats,
      buyers,
      products,
      routes,
      recent
    ] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) AS total_transactions,
          COALESCE(SUM(tx.quantity_mt), 0) AS total_volume,
          COALESCE(SUM(tx.shipment_value), 0) AS total_revenue,
          COALESCE(SUM(tx.net_profit), 0) AS total_profit
        FROM account_transactions tx
        ${finalWhere}
      `, finalParams),
      query(`
        SELECT b.buyer_name, b.company_name, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        LEFT JOIN buyers b ON tx.buyer_id = b.id
        ${finalWhere}
        GROUP BY tx.buyer_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT p.name AS product_name, COALESCE(SUM(tx.quantity_mt), 0) AS quantity, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        JOIN products p ON tx.product_id = p.id
        ${finalWhere}
        GROUP BY tx.product_id
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT tx.loading_port, tx.destination_port, COUNT(*) AS transactions, COALESCE(SUM(tx.shipment_value), 0) AS revenue, COALESCE(SUM(tx.net_profit), 0) AS profit
        FROM account_transactions tx
        ${finalWhere}
        GROUP BY tx.loading_port, tx.destination_port
        ORDER BY profit DESC
      `, finalParams),
      query(`
        SELECT tx.*, p.name AS product_name
        FROM account_transactions tx
        LEFT JOIN products p ON tx.product_id = p.id
        WHERE tx.loading_port = ? OR tx.destination_port = ?
        ORDER BY tx.transaction_date DESC LIMIT 10
      `, [portName, portName])
    ]);

    res.json({
      portName,
      stats: stats[0],
      buyers,
      products,
      routes,
      recent
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
