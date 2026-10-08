// Run with: node scripts/check-contact-events.cjs
// Executes every page's inline JavaScript together with the shared contact script.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const shared = fs.readFileSync(path.join(root, 'site-contact.js'), 'utf8');
function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('.')) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? pages(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}
const cases = [
  ['tel:+13213109375', 'lead_phone_click'],
  ['sms:+13213109375?body=PRIVATE_MESSAGE', 'lead_sms_click'],
  ['mailto:contact@pelican-canvas.com?subject=PRIVATE_MESSAGE', 'lead_email_click'],
  ['https://wa.me/13213109375?text=PRIVATE_MESSAGE', 'lead_whatsapp_click'],
  ['/contact/?service=boat-covers', 'lead_estimate_click'],
];
let checked = 0;
for (const file of pages(root)) {
  const html = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  assert.equal((html.match(/src=["']\/site-contact\.js[^"']*["']/g) || []).length, 1, `${rel}: shared script loaded once`);
  const handlers = [];
  const sandbox = {
    URL, URLSearchParams,
    location: { origin: 'https://pelican-canvas.com', pathname: '/' + rel.replace(/index\.html$/, ''), search: '' },
    navigator: { userAgent: 'Test' },
    document: {
      addEventListener(name, callback) { if (name === 'click') handlers.push(callback); },
      getElementById() { return null; },
    },
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=|application\/ld\+json/.test(match[1])) continue;
    vm.runInContext(match[2], context, { filename: rel });
  }
  vm.runInContext(shared, context, { filename: 'site-contact.js' });
  for (const [href, expected] of cases) {
    sandbox.dataLayer = [];
    const link = { getAttribute() { return href; }, closest() { return null; } };
    const event = { target: { closest() { return link; } } };
    for (const handler of handlers) handler(event);
    const events = sandbox.dataLayer.filter(args => args[0] === 'event');
    assert.equal(events.length, 1, `${rel}: ${expected} emitted once`);
    assert.equal(events[0][1], expected, `${rel}: correct event`);
    assert.ok(!JSON.stringify(events[0][2]).includes('PRIVATE_MESSAGE'), `${rel}: message stays out of analytics`);
  }
  checked++;
}
console.log(`Contact events: ${checked} pages passed; each action emitted once with no message content.`);
