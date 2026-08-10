const https = require('https');

function translateText(text) {
  return new Promise((resolve, reject) => {
    const data = `q=${encodeURIComponent(text)}`;
    const options = {
      hostname: 'translate.googleapis.com',
      path: '/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Translate API error: ${res.statusCode} - ${body}`));
        }
        try {
          const parsed = JSON.parse(body);
          const translated = parsed[0].map(item => item[0]).join('');
          resolve(translated);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

module.exports = translateText;
