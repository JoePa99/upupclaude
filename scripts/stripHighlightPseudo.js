const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), 'app', 'globals.css');

if (!fs.existsSync(cssPath)) {
  process.exit(0);
}

const cssSource = fs.readFileSync(cssPath, 'utf8');

if (!cssSource.includes('::highlight(')) {
  process.exit(0);
}

const sanitized = cssSource
  .split('\n')
  .filter((line) => !line.includes('::highlight('))
  .join('\n');

fs.writeFileSync(cssPath, sanitized, 'utf8');

console.warn(
  'Removed ::highlight pseudo-element rules from app/globals.css to prevent Turbopack CSS parse errors. The runtime pin selection highlight handles styling instead.'
);
