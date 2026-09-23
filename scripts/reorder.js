// Vite's single-file build puts the inlined font CSS and script ahead of everything.
// Move them so <title> and the page styles sit at the top of the file.
import { readFileSync, writeFileSync } from 'node:fs';
const p = 'dist/index.html';
let s = readFileSync(p, 'utf8');
const pull = (open, close) => {
  const out = [];
  let i;
  while ((i = s.indexOf(open)) >= 0) {
    const j = s.indexOf(close, i) + close.length;
    out.push(s.slice(i, j));
    s = s.slice(0, i) + s.slice(j);
  }
  return out;
};
const scripts = pull('<script type="module"', '</script>');
const styles = pull('<style rel="stylesheet"', '</style>');
s = s.trim();
const t = s.indexOf('</title>') + '</title>'.length;
s = s.slice(0, t) + '\n' + styles.join('\n') + s.slice(t) + '\n' + scripts.join('\n') + '\n';
writeFileSync(p, s);
console.log(`moved ${styles.length} style and ${scripts.length} script blocks`);
