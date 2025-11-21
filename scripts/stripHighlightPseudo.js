const fs = require('fs');
const path = require('path');

const cssPath = path.join(process.cwd(), 'app', 'globals.css');

if (!fs.existsSync(cssPath)) {
  process.exit(0);
}

const cssSource = fs.readFileSync(cssPath, 'utf8');

// If no ::highlight rules exist, exit early.
if (!cssSource.includes('::highlight(')) {
  process.exit(0);
}

const lines = cssSource.split('\n');
const sanitized = [];
let skippingHighlightBlock = false;

for (const line of lines) {
  if (!skippingHighlightBlock && line.includes('::highlight(')) {
    // Start skipping at the line containing ::highlight( and continue
    // until the matching closing brace, because leaving the lone closing
    // brace behind makes Turbopack error with "Unexpected }".
    skippingHighlightBlock = true;
    // If the block closes on the same line, reset immediately.
    if (line.includes('}')) {
      skippingHighlightBlock = false;
    }
    continue;
  }

  if (skippingHighlightBlock) {
    if (line.includes('}')) {
      skippingHighlightBlock = false;
    }
    continue;
  }

  sanitized.push(line);
}

fs.writeFileSync(cssPath, sanitized.join('\n'), 'utf8');

console.warn(
  'Removed ::highlight pseudo-element rules from app/globals.css to prevent Turbopack CSS parse errors. The runtime pin selection highlight handles styling instead.'
);
