const nunjucks = require("nunjucks");
const { exec } = require("child_process");
const util = require("util");
const fs = require("fs");
const path = require("path");
const os = require("os");
const execPromise = util.promisify(exec);

// Configure nunjucks with custom non-conflicting alphabetical delimiters
const env = nunjucks.configure({
  autoescape: false,
  tags: {
    blockStart: 'LXTMPBSTART',
    blockEnd: 'LXTMPBEND',
    variableStart: 'LXTMPVSTART',
    variableEnd: 'LXTMPVEND',
    commentStart: 'LXTMPCSTART',
    commentEnd: 'LXTMPCEND'
  }
});

function preprocess(latexSource) {
  let processed = latexSource;
  // Replace \VAR{...} with LXTMPVSTART ... LXTMPVEND
  processed = processed.replace(/\\VAR\{([^{}]+)\}/g, "LXTMPVSTART $1 LXTMPVEND");
  // Replace \BLOCK{...} with LXTMPBSTART ... LXTMPBEND
  processed = processed.replace(/\\BLOCK\{([^{}]+)\}/g, "LXTMPBSTART $1 LXTMPBEND");
  // Replace \#{...} with LXTMPCSTART ... LXTMPCEND
  processed = processed.replace(/\\#\{([^{}]+)\}/g, "LXTMPCSTART $1 LXTMPCEND");
  return processed;
}

const latexSpecials = {
  "&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_",
  "{": "\\{", "}": "\\}", "~": "\\textasciitilde{}",
  "^": "\\textasciicircum{}", "\\": "\\textbackslash{}"
};

function latexEscape(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s.split("").map(ch => latexSpecials[ch] || ch).join("");
}
env.addFilter("e", latexEscape);

async function compilePdf(latexSource, context) {
  const safeCtx = {};
  for (const [k, v] of Object.entries(context)) {
    safeCtx[k] = (typeof v === "string" || typeof v === "number" || typeof v === "boolean") ? latexEscape(v) : v;
  }

  const preprocessed = preprocess(latexSource);
  const rendered = env.renderString(preprocessed, safeCtx);
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "docgen_"));
  const texPath = path.join(tmpDir, "doc.tex");
  fs.writeFileSync(texPath, rendered, "utf8");

  try {
    // Copy static template images from backend folder if they exist
    for (const img of ["header_logo.jpg", "signature_stamp.png"]) {
      const imgPath = path.join(__dirname, img);
      if (fs.existsSync(imgPath)) {
        fs.copyFileSync(imgPath, path.join(tmpDir, img));
      }
    }

    // Try using xelatex instead of pdflatex to support Chinese characters and modern fonts, 
    // since the templates might include xeCJK. 
    const cmd = "xelatex -interaction=nonstopmode -halt-on-error doc.tex";
    // Run twice for reference stabilization
    try {
      await execPromise(cmd, { cwd: tmpDir, timeout: 60000 });
      await execPromise(cmd, { cwd: tmpDir, timeout: 60000 });
    } catch (execErr) {
      throw new Error(`LaTeX Error:\n${execErr.stdout || execErr.stderr || execErr.message}`);
    }

    const pdfPath = path.join(tmpDir, "doc.pdf");
    if (!fs.existsSync(pdfPath)) {
      throw new Error("PDF failed to compile. No pdf output file found.");
    }
    return fs.readFileSync(pdfPath);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

module.exports = { compilePdf };
