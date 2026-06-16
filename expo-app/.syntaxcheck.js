const ts = require('/opt/toolchains/.nvm/versions/node/v22.22.3/lib/node_modules/typescript');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(e.name) && e.name !== 'expo-env.d.ts') files.push(p);
  }
})(root);
let total = 0;
for (const f of files) {
  const code = fs.readFileSync(f, 'utf8');
  const out = ts.transpileModule(code, {
    reportDiagnostics: true,
    fileName: f,
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      esModuleInterop: true,
    },
  });
  const errs = (out.diagnostics || []).filter(
    (d) => d.category === ts.DiagnosticCategory.Error
  );
  if (errs.length) {
    total += errs.length;
    for (const d of errs) {
      const line = d.start != null
        ? code.slice(0, d.start).split('\n').length
        : '?';
      console.log(
        `${f}:${line} - ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`
      );
    }
  }
}
console.log(
  total === 0
    ? 'OK: ' + files.length + ' files, no syntax errors'
    : 'ERRORS: ' + total
);
