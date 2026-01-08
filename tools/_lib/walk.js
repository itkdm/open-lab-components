const fs = require("fs");
const path = require("path");

function walkDir(dir, { filterFile } = {}) {
  const out = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const ent of entries) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
        continue;
      }
      if (ent.isFile()) {
        if (!filterFile || filterFile(p)) out.push(p);
      }
    }
  }
  return out.sort();
}

module.exports = { walkDir };


