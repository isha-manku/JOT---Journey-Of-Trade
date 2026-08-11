const https = require('https');

const agent = new https.Agent({ keepAlive: true });

function translateLine(text) {
  return new Promise((resolve, reject) => {
    if (!text.trim()) return resolve('');
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(text)}`;

    const req = https.get(url, { agent, timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return resolve(text); // Fallback to original text on error to avoid crashing
        }
        try {
          const parsed = JSON.parse(body);
          let translatedText = '';
          if (parsed && parsed[0]) {
            parsed[0].forEach(item => {
              if (item[0]) translatedText += item[0];
            });
          }
          if (translatedText) {
             resolve(translatedText);
          } else {
             resolve(text);
          }
        } catch (e) {
          resolve(text); // Fallback
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(text); // Fallback on timeout
    });

    req.on('error', () => {
      resolve(text); // Fallback on network error
    });

    req.end();
  });
}

module.exports = async function(combined) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  const lines = combined.split('\n');
  
  const results = [];
  // Google Translate allows larger payloads, but we'll stick to batches of 10 to be safe and avoid timeouts
  for (let i = 0; i < lines.length; i += 10) {
    const batch = lines.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(line => translateLine(line)));
    results.push(...batchResults);
  }
  
  return results.join('\n');
};