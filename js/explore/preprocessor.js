export const preprocessCppForJSCPP = (originalCode) => {
  const notes = [];
  let code = originalCode;

  const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const hasInclude = (h) => new RegExp(`#include\\s*<${escRe(h)}>`).test(code);

  const injectHeaderAfterIncludes = (h) => {
    if (hasInclude(h)) return;
    const lines = code.split("\n");
    let last = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*#include\b/.test(lines[i])) last = i;
    }
    if (last >= 0) lines.splice(last + 1, 0, `#include <${h}>`);
    else lines.unshift(`#include <${h}>`);
    code = lines.join("\n");
  };

  if (/#include\s*<string\s*\.\s*h>/.test(code) || /#include\s*<string>/.test(code)) {
    code = code.replace(/#include\s*<string\s*\.\s*h>/g, "#include <cstring>");
    code = code.replace(/#include\s*<string>/g, "#include <cstring>");
    notes.push("#include <string> → <cstring>");
  }

  for (const h of ["vector", "algorithm", "map", "set", "unordered_map", "unordered_set"]) {
    const re = new RegExp(`#include\\s*<${escRe(h)}>`, "g");
    if (re.test(code)) {
      code = code.replace(re, `// [preprocessor] #include <${h}> dihapus (tidak didukung JSCPP)`);
      notes.push(`#include <${h}> dihapus (tidak didukung JSCPP)`);
    }
  }

  if (/\bstring\s+[A-Za-z_]\w*/.test(code)) {
    code = code.replace(
      /\bstring\s+([A-Za-z_]\w*)\s*(\[\s*\d+\s*\])?\s*(=\s*"([^"]*)")?\s*;/g,
      (_, name, arrPart, __, initVal) => {
        if (arrPart) {
          const n = arrPart.match(/\d+/)[0];
          return `char ${name}[${n}][256];`;
        }
        if (initVal !== undefined) return `char ${name}[256] = "${initVal}";`;
        return `char ${name}[256];`;
      }
    );

    if (/\bstring\s+[A-Za-z_]\w*/.test(code)) {
      notes.push("⚠️ Masih ada `string` yang belum ketranspile. Pakai `char[]` manual.");
    } else {
      notes.push("Tipe `string` → `char[256]`");
    }

    code = code.replace(/\b([A-Za-z_]\w*)\s*==\s*"([^"]*)"/g, (_, n, v) => `strcmp(${n}, "${v}") == 0`);
    code = code.replace(/"([^"]*)"\s*==\s*([A-Za-z_]\w*)/g, (_, v, n) => `strcmp(${n}, "${v}") == 0`);
    code = code.replace(/\b([A-Za-z_]\w*)\s*!=\s*"([^"]*)"/g, (_, n, v) => `strcmp(${n}, "${v}") != 0`);
    code = code.replace(/"([^"]*)"\s*!=\s*([A-Za-z_]\w*)/g, (_, v, n) => `strcmp(${n}, "${v}") != 0`);

    code = code.replace(
      /getline\s*\(\s*cin\s*,\s*([A-Za-z_]\w*)\s*\)/g,
      (_, name) => `cin.getline(${name}, 256)`
    );

    injectHeaderAfterIncludes("cstring");
    notes.push("Perbandingan string → strcmp()");
  }

  return { code, notes };
};