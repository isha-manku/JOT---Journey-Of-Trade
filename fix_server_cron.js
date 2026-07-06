const fs = require('fs');
let code = fs.readFileSync('backend/server.js', 'utf8');

code = code.replace(
  /app\.listen\(5000, \(\) => console\.log\([^)]+\)\);/,
  `app.listen(5000, () => {
  console.log('🚀 Server running on port 5000');
  require('./notification_cron').initCron();
});`
);

fs.writeFileSync('backend/server.js', code);
console.log('Updated server.js');
