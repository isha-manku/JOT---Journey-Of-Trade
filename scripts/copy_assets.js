const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../docplatform-frontend/dist");
const dest = path.join(__dirname, "../backend/public/docplatform");

console.log(`Copying built frontend assets from ${src} to ${dest}...`);

if (!fs.existsSync(src)) {
  console.error(`Error: Source directory ${src} does not exist. Did you run the build first?`);
  process.exit(1);
}

// Clean destination directory
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

// Copy files recursively
fs.cpSync(src, dest, { recursive: true });

console.log("✅ Assets copied successfully!");
