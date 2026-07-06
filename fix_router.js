const fs = require('fs');
let code = fs.readFileSync('backend/accounts_router.js', 'utf8');

// Replace seller_id with seller_name_text extraction in POST
code = code.replace(/seller_id,\n    product_id/g, 'seller_name_text,\n    product_id');
code = code.replace(/!seller_id \|\|/g, '!seller_name_text ||');

// Insert into query
code = code.replace(/buyer_id, seller_id,/g, 'buyer_id, seller_name_text,');
code = code.replace(/final_buyer, final_seller/g, 'final_buyer, final_seller_text');

// Put seller_name_text in txParams in POST
code = code.replace(/buyer_id, seller_id,/g, 'buyer_id, seller_name_text,');

// Update PUT logic
code = code.replace(/seller_id,\n    product_id/g, 'seller_name_text,\n    product_id');
code = code.replace(/const final_seller = seller_id \|\| currentTx\.seller_id;/g, 'const final_seller_text = seller_name_text || currentTx.seller_name_text;');

code = code.replace(/buyer_id = \?, seller_id = \?/g, 'buyer_id = ?, seller_name_text = ?');

fs.writeFileSync('backend/accounts_router.js', code);
console.log('Fixed accounts_router.js via script');
