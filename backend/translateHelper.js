const https = require('https');

const agent = new https.Agent({ keepAlive: true });

function translateLine(text) {
  return new Promise((resolve, reject) => {
    if (!text.trim()) return resolve('');
    const email = 'ishamanku62@gmail.com'; 
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN&de=${email}`;

    const req = https.get(url, { agent, timeout: 5000 }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return resolve(text); // Fallback to original text on error to avoid crashing
        }
        try {
          const parsed = JSON.parse(body);
          if (parsed.responseStatus !== 200) {
            return resolve(text); // Fallback
          }
          resolve(parsed.responseData.translatedText);
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
  
  // Translate 10 lines at a time to avoid overwhelming MyMemory connections
  const results = [];
  for (let i = 0; i < lines.length; i += 10) {
    const batch = lines.slice(i, i + 10);
    const batchResults = await Promise.all(batch.map(line => translateLine(line)));
    results.push(...batchResults);
  }
  
  return results.join('\n');
};