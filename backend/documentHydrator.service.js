const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

class DocumentHydratorService {
  constructor() {
    this.tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Safely inspect a docx binary and return extracted placeholder schema
   * Handles splitting tags across runs automatically via docxtemplater.
   */
  extractPlaceholders(binaryBuffer) {
    try {
      const zip = new PizZip(binaryBuffer);
      const xml = zip.file("word/document.xml")?.asText() || "";
      const text = xml.replace(/<[^>]+>/g, ""); // Remove XML to join split text runs
      
      const tagRegex = /\{\{(.*?)\}\}/g;
      const tags = new Set();
      let match;
      while ((match = tagRegex.exec(text)) !== null) {
        let tag = match[1].trim();
        // Handle basic modifiers like # for loops or ^ for inverted sections
        if (tag.startsWith('#') || tag.startsWith('^') || tag.startsWith('/')) {
            tag = tag.substring(1).trim();
        }
        tags.add(tag);
      }

      const schema = Array.from(tags).map(tag => {
        let fieldType = 'text';
        const lowerTag = tag.toLowerCase();
        
        if (lowerTag.includes('date')) fieldType = 'date';
        else if (lowerTag.includes('amount') || lowerTag.includes('price') || lowerTag.includes('total') || lowerTag.includes('quantity')) {
          fieldType = 'number';
        }

        return {
          key: tag,
          label: tag.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase()),
          type: fieldType
        };
      });

      return schema;
    } catch (error) {
      console.error('Error extracting schema from DOCX:', error);
      throw error;
    }
  }

  /**
   * Hydrates a DOCX template with JSON data, converts it to PDF using LibreOffice,
   * returns the PDF buffer, and strictly cleans up temp files in a finally block.
   */
  async hydrateAndRenderPDF(templateBuffer, formValues, schemaMappings = [], language = 'en') {
    const jobId = crypto.randomUUID();
    
    // RAM Disk Optimization for Linux/Docker, fallback to normal temp on Windows
    const baseTemp = process.platform === 'linux' ? '/tmp' : this.tempDir;
    const jobDir = path.join(baseTemp, `job-${jobId}`);
    
    const inputDocxPath = path.join(jobDir, 'temp.docx');
    const outputPdfPath = path.join(jobDir, 'temp.pdf');

    try {
      fs.mkdirSync(jobDir, { recursive: true });

      // 1. Unzip raw docx archive
      const zip = new PizZip(templateBuffer);
      let xml = zip.file("word/document.xml").asText();

      // 2. Group mappings by targetText and sort by occurrence_index descending
      const groupedMappings = {};
      schemaMappings.forEach(mapping => {
        const target = mapping.target_placeholder_value;
        if (target) {
          if (!groupedMappings[target]) groupedMappings[target] = [];
          groupedMappings[target].push(mapping);
        }
      });

      // 3. Perform XML tag-agnostic replacements
      Object.keys(groupedMappings).forEach((targetText) => {
        const mappings = groupedMappings[targetText];
        // Sort descending by occurrence_index to replace from right-to-left
        mappings.sort((a, b) => (b.occurrence_index || 0) - (a.occurrence_index || 0));

        const tokens = targetText.split(/\s+/).filter(Boolean);
        const xmlRegexStr = tokens.map(token => {
          return token.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:<[^>]+>)*');
        }).join('(?:\\s*<[^>]+>\\s*|\\s+)+');
        const xmlRegex = new RegExp(xmlRegexStr, 'g');

        console.log(`[Hydrator] Trying to match targetText:`, targetText);
        console.log(`[Hydrator] Regex used:`, xmlRegexStr);

        mappings.forEach((mapping) => {
          const userValue = formValues[mapping.field_key] || '';
          if (userValue) {
            let matchCount = 0;
            xml = xml.replace(xmlRegex, (match) => {
              console.log(`[Hydrator] Match found! match length:`, match.length);
              if (mapping.occurrence_index === undefined || matchCount === mapping.occurrence_index) {
                matchCount++;
                const xmlTagsInMatch = match.match(/<[^>]+>/g) || [];
                // Fix: newlines must close and reopen <w:t> because <w:br/> inside <w:t> is invalid in DOCX
                const validSanitizedUserValue = String(userValue)
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/\n/g, '</w:t><w:br/><w:t>');
                  
                return validSanitizedUserValue + xmlTagsInMatch.join('');
              }
              matchCount++;
              return match;
            });
          }
        });
      });

      // 3.5 Optional: Dynamic Translation for Bilingual View
      if (language === 'zh') {
        try {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass local cert issues for translation API
          const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
          // const translate = require('google-translate-api-x');
          const doc = new DOMParser().parseFromString(xml, 'text/xml');
          const paragraphs = doc.getElementsByTagName('w:p');

          for (let i = 0; i < paragraphs.length; i++) {
            const p = paragraphs[i];
            const textNodes = p.getElementsByTagName('w:t');
            let engText = '';
            for (let j = 0; j < textNodes.length; j++) {
              if (textNodes[j].textContent) {
                engText += textNodes[j].textContent;
              }
            }

            engText = engText.trim();
            if (engText.length > 0) {
              try {
                // Using Google Translate open API endpoint via native fetch
                const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(engText)}`;
                const response = await fetch(url);
                const data = await response.json();
                
                let translatedText = '';
                if (data && data[0]) {
                  data[0].forEach(item => {
                    if (item[0]) translatedText += item[0];
                  });
                }
                
                if (translatedText) {
                  const newRun = doc.createElement('w:r');
                  const rPr = doc.createElement('w:rPr');
                  const rFonts = doc.createElement('w:rFonts');
                  rFonts.setAttribute('w:eastAsia', 'Microsoft YaHei');
                  rPr.appendChild(rFonts);
                  newRun.appendChild(rPr);
                  
                  const newText = doc.createElement('w:t');
                  newText.setAttribute('xml:space', 'preserve');
                  newText.textContent = ' / ' + translatedText;
                  
                  newRun.appendChild(newText);
                  p.appendChild(newRun);
                }
                
                // Slight delay to avoid rate limits on many paragraphs
                await new Promise(r => setTimeout(r, 100));
              } catch (err) {
                console.error("Translation failed for paragraph:", engText.substring(0,30), err);
              }
            }
          }
          xml = new XMLSerializer().serializeToString(doc);
        } catch (err) {
          console.error("Failed to parse/translate XML", err);
        }
      }

      // 4. Save modified XML back into archive
      zip.file("word/document.xml", xml);
      const hydratedDocxBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(inputDocxPath, hydratedDocxBuffer);

      // 4. Convert to PDF
      await new Promise((resolve, reject) => {
        let useShell = false;
        const profileDir = path.join(jobDir, 'lo_profile').replace(/\\/g, '/');
        
        if (process.platform === 'win32') {
            cmd = '"C:\\Program Files\\LibreOffice\\program\\soffice.exe"';
            args = [`-env:UserInstallation=file:///${profileDir}`, '--headless', '--invisible', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf', '--outdir', `"${jobDir}"`, `"${inputDocxPath}"`];
            cmd = `"${cmd.replace(/"/g, '')}" ${args.join(' ')}`;
            args = []; // spawn shell mode requires command string
            useShell = true;
        } else {
            cmd = 'soffice';
            args = [`-env:UserInstallation=file:///${profileDir}`, '--headless', '--invisible', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf', '--outdir', jobDir, inputDocxPath];
        }
        
        const child = spawn(cmd, args, { shell: useShell, timeout: 30000, stdio: 'ignore' });
        
        child.on('error', (err) => {
          reject(new Error(`Failed to execute converter: ${err.message}`));
        });

        child.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Conversion failed with code ${code}`));
            return;
          }
          resolve();
        });
      });

      // 5. Read PDF Buffer
      if (!fs.existsSync(outputPdfPath)) {
        throw new Error('PDF conversion succeeded but output file is missing.');
      }

      const pdfBuffer = fs.readFileSync(outputPdfPath);
      return pdfBuffer;

    } catch (error) {
      console.error('Error during DOCX hydration/PDF conversion:', error);
      throw error;
    } finally {
      // 5. FINALLY Block - Strict Cleanup
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {
        console.error(`Failed to cleanup temp directory ${jobDir}:`, cleanupError);
      }
    }
  }

  async hydrateAndRenderPDF(templateBuffer, data, schemaMappings, language, editedHtml = null) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const { spawn } = require('child_process');
    const crypto = require('crypto');
    const PizZip = require('pizzip');
    const Docxtemplater = require('docxtemplater');

    const jobId = crypto.randomUUID();
    const jobDir = path.join(os.tmpdir(), `job_${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true });

    let inputFilePath;
    let extractedWatermark = null;
    
    try {
      if (editedHtml) {
        if (language === 'zh') {
          try {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
            const cheerio = require('cheerio');
            const translateText = require('./translateHelper');
            
            const $ = cheerio.load(editedHtml);
            const textNodes = [];
            
            function walk(node) {
              node.contents().each((i, el) => {
                if (el.type === 'text') {
                  const text = $(el).text().trim();
                  // Skip empty text or just non-breaking spaces
                  if (text && text.replace(/&nbsp;/g, '').trim().length > 0) {
                    textNodes.push({ el, text });
                  }
                } else if (el.type === 'tag') {
                  // Don't translate script/style tags
                  if (el.name !== 'script' && el.name !== 'style') {
                    walk($(el));
                  }
                }
              });
            }
            
            walk($('body'));
            
            console.log(`Found ${textNodes.length} text nodes for HTML translation`);
            
            if (textNodes.length > 0) {
              let chunks = [];
              let currentChunk = [];
              let currentLen = 0;
              for (let t of textNodes) {
                if (currentLen + t.text.length + 1 > 900 && currentChunk.length > 0) {
                  chunks.push(currentChunk);
                  currentChunk = [];
                  currentLen = 0;
                }
                currentChunk.push(t);
                currentLen += t.text.length + 1;
              }
              if (currentChunk.length > 0) chunks.push(currentChunk);
              
              for (let chunk of chunks) {
                const combined = chunk.map(t => t.text).join('\n');
                try {
                  const translatedCombined = await translateText(combined);
                  const tLines = translatedCombined.split('\n');
                  
                  for (let j = 0; j < chunk.length; j++) {
                    const originalText = chunk[j].text;
                    const translatedText = tLines[j] ? tLines[j].trim() : originalText;
                    
                    $(chunk[j].el).replaceWith(`<span>${originalText} / <span style="font-family: 'Microsoft YaHei', sans-serif;">${translatedText}</span></span>`);
                  }
                } catch (err) {
                  console.error("HTML Batch translate failed:", err);
                }
              }
            }
            if ($('head').length === 0) {
              $('html').prepend('<head><meta charset="utf-8"></head>');
            } else if ($('head meta[charset]').length === 0) {
              $('head').prepend('<meta charset="utf-8">');
            }
            editedHtml = $.html();
            console.log("HTML successfully updated with bilingual text");
          } catch(e) {
            console.error("Failed to translate HTML", e);
          }
        }
        
        console.log("Writing editedHtml to input.html");
        // Bypass DOCX generation, use HTML directly
        inputFilePath = path.join(jobDir, 'input.html');
        fs.writeFileSync(inputFilePath, editedHtml);
      } else {
        // Standard DOCX Hydration
        inputFilePath = path.join(jobDir, 'input.docx');
        const zip = new PizZip(templateBuffer);
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
        });

        doc.render(data);
        let buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

        if (language === 'zh') {
          const zip2 = new PizZip(buf);
          const xml = zip2.file("word/document.xml").asText();
          try {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // Bypass local cert issues for translation API
            const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
            const translateText = require('./translateHelper');
            const xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
            const paragraphs = xmlDoc.getElementsByTagName('w:p');

            let tasks = [];
            for (let i = 0; i < paragraphs.length; i++) {
              const p = paragraphs[i];
              let elements = [];
              function getTextsAndBreaks(node) {
                if (node.nodeName === 'w:t' || node.nodeName === 'w:br') elements.push(node);
                else if (node.childNodes) {
                  for (let k = 0; k < node.childNodes.length; k++) getTextsAndBreaks(node.childNodes[k]);
                }
              }
              getTextsAndBreaks(p);
              let currentText = '';
              let lastTextNode = null;
              for (let j = 0; j < elements.length; j++) {
                const el = elements[j];
                if (el.nodeName === 'w:t') {
                  currentText += el.textContent || '';
                  lastTextNode = el;
                } else if (el.nodeName === 'w:br') {
                  if (currentText.trim().length > 0 && lastTextNode) tasks.push({ text: currentText.trim(), node: lastTextNode });
                  currentText = '';
                  lastTextNode = null;
                }
              }
              if (currentText.trim().length > 0 && lastTextNode) tasks.push({ text: currentText.trim(), node: lastTextNode });
            }

            if (tasks.length > 0) {
              let chunks = [];
              let currentChunk = [];
              let currentLen = 0;
              for (let t of tasks) {
                if (currentLen + t.text.length + 1 > 900 && currentChunk.length > 0) {
                  chunks.push(currentChunk);
                  currentChunk = [];
                  currentLen = 0;
                }
                currentChunk.push(t);
                currentLen += t.text.length + 1;
              }
              if (currentChunk.length > 0) chunks.push(currentChunk);

              for (let chunk of chunks) {
                const combined = chunk.map(t => t.text).join('\n');
                try {
                  const translatedCombined = await translateText(combined);
                  const tLines = translatedCombined.split('\n');
                  
                  for (let j = 0; j < chunk.length; j++) {
                    const translatedText = tLines[j] ? tLines[j].trim() : chunk[j].text;
                    if (translatedText) {
                      chunk[j].node.textContent = chunk[j].node.textContent + ' / ' + translatedText;
                    }
                  }
                } catch (err) { console.error("Batch translate failed:", err); }
              }
            }

            const serializer = new XMLSerializer();
            const translatedXml = serializer.serializeToString(xmlDoc);
            
            zip2.file("word/document.xml", translatedXml);
            buf = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
          } catch(e) {
            console.error("Failed to translate document inline", e);
          }
        }
        
        // --- Watermark Fix for LibreOffice ---
        try {
          const zip3 = new PizZip(buf);
          const headerRegex = /word\/(header|document)\d*\.xml/;
          for (const filename of Object.keys(zip3.files)) {
            if (headerRegex.test(filename)) {
              let xml = zip3.file(filename).asText();
              const pictMatches = xml.match(/<w:pict>.*?<\/w:pict>/gs) || [];
              for (const pict of pictMatches) {
                if (pict.includes('WordPictureWatermark')) {
                  const rIdMatch = pict.match(/<v:imagedata[^>]*r:id="([^"]+)"/);
                  if (rIdMatch && rIdMatch[1] && !extractedWatermark) {
                    const rId = rIdMatch[1];
                    const relsFilename = `word/_rels/${filename.split('/').pop()}.rels`;
                    if (zip3.files[relsFilename]) {
                      const relsXml = zip3.file(relsFilename).asText();
                      const relMatch = new RegExp(`<Relationship[^>]*Id="${rId}"[^>]*Target="([^"]+)"`).exec(relsXml);
                      if (relMatch && relMatch[1]) {
                        const imagePath = `word/${relMatch[1]}`;
                        if (zip3.files[imagePath]) {
                          extractedWatermark = {
                            buffer: zip3.file(imagePath).asNodeBuffer(),
                            ext: imagePath.toLowerCase().split('.').pop()
                          };
                        }
                      }
                    }
                  }
                  xml = xml.replace(pict, '');
                }
              }
              zip3.file(filename, xml);
            }
          }
          buf = zip3.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        } catch(e) { console.error("Watermark strip failed:", e); }
        // ------------------------------------

        fs.writeFileSync(inputFilePath, buf);
      }

      // Convert to PDF using unoconv
      const outputPdfPath = path.join(jobDir, 'output.pdf');
      
      await new Promise((resolve, reject) => {
        let cmd, args;
        let useShell = false;
        const profileDir = path.join(jobDir, 'lo_profile').replace(/\\/g, '/');
        
        if (process.platform === 'win32') {
          cmd = 'C:\\Program Files\\LibreOffice\\program\\soffice.exe';
          args = [`-env:UserInstallation=file:///${profileDir}`, '--headless', '--invisible', '--nologo', 
'--nodefault', '--norestore', '--convert-to', 'pdf', '--outdir', jobDir, inputFilePath];
        } else {
          cmd = 'soffice';
          args = [`-env:UserInstallation=file:///${profileDir}`, '--headless', '--invisible', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf', '--outdir', jobDir, inputFilePath];
        }
        
        console.log("Spawning LibreOffice:", cmd, args);
        const child = spawn(cmd, args, { shell: useShell, timeout: 30000, stdio: 'ignore' });
        
        child.on('error', (err) => {
          reject(new Error(`Failed to execute converter: ${err.message}`));
        });

        child.on('close', (code) => {
          if (code !== 0) {
            reject(new Error(`Conversion failed with code ${code}`));
            return;
          }
          resolve();
        });
      });

      // LibreOffice names the output file based on input name. 
      // if input is input.html -> output is input.pdf. if input.docx -> input.pdf
      const generatedPdfPath = path.join(jobDir, 'input.pdf');

      if (!fs.existsSync(generatedPdfPath)) {
        throw new Error('PDF conversion succeeded but output file is missing.');
      }

      let pdfBuffer = fs.readFileSync(generatedPdfPath);
      
      // --- Re-apply Watermark via pdf-lib ---
      if (extractedWatermark && extractedWatermark.buffer) {
        try {
          const { PDFDocument } = require('pdf-lib');
          const pdfDoc = await PDFDocument.load(pdfBuffer);
          let watermarkImage = null;
          if (extractedWatermark.ext === 'png') {
            watermarkImage = await pdfDoc.embedPng(extractedWatermark.buffer);
          } else if (['jpg', 'jpeg'].includes(extractedWatermark.ext)) {
            watermarkImage = await pdfDoc.embedJpg(extractedWatermark.buffer);
          }
          
          if (watermarkImage) {
            const pages = pdfDoc.getPages();
            for (const page of pages) {
              const { width, height } = page.getSize();
              const imgWidth = width * 0.7; // Scale to 70% of page width
              const imgHeight = (watermarkImage.height / watermarkImage.width) * imgWidth;
              page.drawImage(watermarkImage, {
                x: width / 2 - imgWidth / 2,
                y: height / 2 - imgHeight / 2,
                width: imgWidth,
                height: imgHeight,
                opacity: 0.15, // Perfect watermark opacity
              });
            }
            pdfBuffer = Buffer.from(await pdfDoc.save());
          }
        } catch(e) {
          console.error("Failed to re-apply watermark:", e);
        }
      }
      
      return pdfBuffer;

    } catch (error) {
      console.error('Error during DOCX/HTML to PDF conversion:', error);
      throw error;
    } finally {
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {}
    }
  }

  async hydrateToHTML(templateBuffer, data, schemaMappings, language) {
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    const PizZip = require('pizzip');
    const Docxtemplater = require('docxtemplater');
    const crypto = require('crypto');
    const mammoth = require('mammoth');

    const jobId = crypto.randomUUID();
    const jobDir = path.join(os.tmpdir(), `hydrate_${jobId}`);
    fs.mkdirSync(jobDir, { recursive: true });
    const inputDocxPath = path.join(jobDir, 'input.docx');

    try {
      // 1. Unzip Template
      const zip = new PizZip(templateBuffer);
      
      // 2. Hydrate Document
      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });

      doc.render(data);

      let buf = doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });

      // 3. Optional translation (simplified - ideally refactor shared code)
      if (language === 'zh') {
        const zip2 = new PizZip(buf);
        const xml = zip2.file("word/document.xml").asText();
        try {
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
          const { DOMParser, XMLSerializer } = require('@xmldom/xmldom');
          const { translate } = require('bing-translate-api');
          const xmlDoc = new DOMParser().parseFromString(xml, 'text/xml');
          const paragraphs = xmlDoc.getElementsByTagName('w:p');

          let tasks = [];
            for (let i = 0; i < paragraphs.length; i++) {
              const p = paragraphs[i];
              let elements = [];
              function getTextsAndBreaks(node) {
                if (node.nodeName === 'w:t' || node.nodeName === 'w:br') elements.push(node);
                else if (node.childNodes) {
                  for (let k = 0; k < node.childNodes.length; k++) getTextsAndBreaks(node.childNodes[k]);
                }
              }
              getTextsAndBreaks(p);
              let currentText = '';
              let lastTextNode = null;
              for (let j = 0; j < elements.length; j++) {
                const el = elements[j];
                if (el.nodeName === 'w:t') {
                  currentText += el.textContent || '';
                  lastTextNode = el;
                } else if (el.nodeName === 'w:br') {
                  if (currentText.trim().length > 0 && lastTextNode) tasks.push({ text: currentText.trim(), node: lastTextNode });
                  currentText = '';
                  lastTextNode = null;
                }
              }
              if (currentText.trim().length > 0 && lastTextNode) tasks.push({ text: currentText.trim(), node: lastTextNode });
            }

            if (tasks.length > 0) {
              let chunks = [];
              let currentChunk = [];
              let currentLen = 0;
              for (let t of tasks) {
                if (currentLen + t.text.length + 1 > 900 && currentChunk.length > 0) {
                  chunks.push(currentChunk);
                  currentChunk = [];
                  currentLen = 0;
                }
                currentChunk.push(t);
                currentLen += t.text.length + 1;
              }
              if (currentChunk.length > 0) chunks.push(currentChunk);

              for (let chunk of chunks) {
                const combined = chunk.map(t => t.text).join('\n');
                try {
                  const res = await translate(combined, null, 'zh-Hans');
                  const tLines = res.translation.split('\n');
                  for (let j = 0; j < chunk.length; j++) {
                    const translatedText = tLines[j] ? tLines[j].trim() : chunk[j].text;
                    const targetNode = chunk[j].node;
                    const newText = xmlDoc.createElement('w:t');
                    newText.setAttribute('xml:space', 'preserve');
                    newText.textContent = ' / ' + translatedText;
                    targetNode.parentNode.insertBefore(newText, targetNode.nextSibling);
                    let rNode = targetNode.parentNode;
                    while (rNode && rNode.nodeName !== 'w:r') rNode = rNode.parentNode;
                    if (rNode) {
                      let rPr = null;
                      for (let k = 0; k < rNode.childNodes.length; k++) {
                        if (rNode.childNodes[k].nodeName === 'w:rPr') { rPr = rNode.childNodes[k]; break; }
                      }
                      if (!rPr) { rPr = xmlDoc.createElement('w:rPr'); rNode.insertBefore(rPr, rNode.firstChild); }
                      let rFonts = null;
                      for (let k = 0; k < rPr.childNodes.length; k++) {
                        if (rPr.childNodes[k].nodeName === 'w:rFonts') { rFonts = rPr.childNodes[k]; break; }
                      }
                      if (!rFonts) { rFonts = xmlDoc.createElement('w:rFonts'); rPr.appendChild(rFonts); }
                      rFonts.setAttribute('w:eastAsia', 'Microsoft YaHei');
                    }
                  }
                } catch (err) { console.error("Batch translate failed:", err); }
              }
            }
          const serializer = new XMLSerializer();
          const translatedXml = serializer.serializeToString(xmlDoc);
          zip2.file("word/document.xml", translatedXml);
          buf = zip2.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
        } catch(e) {}
      }

      fs.writeFileSync(inputDocxPath, buf);

      // Convert to HTML using Mammoth
      const result = await mammoth.convertToHtml({ path: inputDocxPath });
      return result.value;

    } catch (error) {
      console.error('Error during DOCX to HTML:', error);
      throw error;
    } finally {
      try {
        if (fs.existsSync(jobDir)) {
          fs.rmSync(jobDir, { recursive: true, force: true });
        }
      } catch (cleanupError) {}
    }
  }
}

module.exports = new DocumentHydratorService();
