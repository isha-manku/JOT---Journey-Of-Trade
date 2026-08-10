const https = require('https');

function translateText(text) {
  return new Promise((resolve, reject) => {
    const email = 'ishamanku62@gmail.com'; 
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|zh-CN&de=${email}`;

    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`Translate API error: ${res.statusCode} - ${body}`));
        }
        try {
          const parsed = JSON.parse(body);
          if (parsed.responseStatus !== 200) {
            return reject(new Error(`MyMemory Error: ${parsed.responseDetails}`));
          }
          resolve(parsed.responseData.translatedText);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

module.exports = async function(combined) {
  const lines = combined.split('\n');
  const results = [];
  for (let line of lines) {
    if (!line.trim()) {
      results.push('');
      continue;
    }
    const res = await translateText(line);
    results.push(res);
  }
  return results.join('\n');
};
