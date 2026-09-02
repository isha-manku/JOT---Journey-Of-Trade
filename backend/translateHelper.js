const translate = require('google-translate-api-x');
const { translate: bingTranslate } = require('bing-translate-api');

function translateLine(text) {
  return new Promise(async (resolve) => {
    if (!text.trim()) return resolve('');
    try {
      const res = await translate(text, { to: 'zh-CN' });
      if (res && res.text) return resolve(res.text);
    } catch (e) {
      console.error("google-translate-api-x failed, falling back to bing:", e.message);
      try {
        const bingRes = await bingTranslate(text, null, 'zh-Hans');
        if (bingRes && bingRes.translation) return resolve(bingRes.translation);
      } catch (bingErr) {
        console.error("bing-translate-api also failed:", bingErr.message);
      }
    }
    // Fallback to original text if both fail
    resolve(text);
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