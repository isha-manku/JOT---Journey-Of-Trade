const db = require('./backend/db'); db.query('SELECT id, transaction_no, buyer_id, status FROM account_transactions', (err, res) => console.log(err || res)); setTimeout(()=>process.exit(0), 1000);
