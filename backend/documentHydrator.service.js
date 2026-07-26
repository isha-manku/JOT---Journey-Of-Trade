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
  async hydrateAndRenderPDF(templateBuffer, formValues, schemaMappings = []) {
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

        const xmlRegexStr = targetText.split('').map(char => char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('(?:<[^>]+>)*');
        const xmlRegex = new RegExp(xmlRegexStr, 'g');

        mappings.forEach((mapping) => {
          const userValue = formValues[mapping.field_key] || '';
          if (userValue) {
            const sanitizedUserValue = String(userValue)
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;');

            let matchCount = 0;
            xml = xml.replace(xmlRegex, (match) => {
              if (mapping.occurrence_index === undefined || matchCount === mapping.occurrence_index) {
                matchCount++;
                return sanitizedUserValue;
              }
              matchCount++;
              return match;
            });
          }
        });
      });

      // 3. Save modified XML back into archive
      zip.file("word/document.xml", xml);
      const hydratedDocxBuffer = zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
      fs.writeFileSync(inputDocxPath, hydratedDocxBuffer);

      // 4. Convert to PDF
      await new Promise((resolve, reject) => {
        let cmd, args;
        
        if (process.platform === 'linux') {
            cmd = 'unoconv';
            args = ['-f', 'pdf', '-o', outputPdfPath, inputDocxPath];
        } else {
            const profileDir = path.join(jobDir, 'lo_profile').replace(/\\/g, '/');
            cmd = '"D:\\Downloads\\program\\soffice.com"';
            args = [`-env:UserInstallation=file:///${profileDir}`, '--headless', '--invisible', '--nologo', '--nodefault', '--norestore', '--convert-to', 'pdf', '--outdir', `"${jobDir}"`, `"${inputDocxPath}"`];
            cmd = `${cmd.replace(/"/g, '')} ${args.join(' ')}`;
            args = []; // spawn shell mode requires command string
        }
        
        const child = process.platform === 'linux' 
          ? spawn(cmd, args, { timeout: 10000 })
          : spawn(cmd, { shell: true, timeout: 30000 });
        
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
}

module.exports = new DocumentHydratorService();
