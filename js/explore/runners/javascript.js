import { loadScript } from "../utils.js";

let _tsLoaded = false;

export const initTypeScript = async () => {
  if (_tsLoaded) return;
  await loadScript("https://cdn.jsdelivr.net/npm/typescript@5.4.5/lib/typescript.min.js");
  _tsLoaded = true;
};

export const runJavaScript = async (code) => {
  const panel = document.getElementById("output-panel");
  const out = document.getElementById("output-content");
  panel.style.display = "flex";

  let buffer = "▶ Menjalankan JavaScript...\n\n";
  out.textContent = buffer;

  const write = (s) => {
    buffer += s + "\n";
    out.textContent = buffer;
    out.scrollTop = out.scrollHeight;
  };

  window.askInput = (msg = "Input:") => window.prompt(msg) ?? "";

  const orig = { log: console.log, warn: console.warn, error: console.error };
  const fmt = (a) => {
    if (typeof a === "object") {
      try { return JSON.stringify(a); } catch { return String(a); }
    }
    return String(a);
  };
  console.log   = (...a) => { write(a.map(fmt).join(" ")); orig.log(...a); };
  console.warn  = (...a) => { write("⚠️ " + a.map(fmt).join(" ")); orig.warn(...a); };
  console.error = (...a) => { write("❌ " + a.map(fmt).join(" ")); orig.error(...a); };

  try {
    const AsyncFunction = (async () => {}).constructor;
    const fn = new AsyncFunction(code);
    await fn();
  } catch (e) {
    write("❌ " + e.message);
  } finally {
    console.log = orig.log;
    console.warn = orig.warn;
    console.error = orig.error;
  }
};

export const runTypeScript = async (code) => {
  const out = document.getElementById("output-content");
  document.getElementById("output-panel").style.display = "flex";
  out.textContent = "▶ Compiling TypeScript...\n";

  try {
    await initTypeScript();
    const result = window.ts.transpileModule(code, {
      compilerOptions: {
        target: window.ts.ScriptTarget.ES2020,
        module: window.ts.ModuleKind.None,
        removeComments: false,
      },
    });
    await runJavaScript(result.outputText);
  } catch (e) {
    out.textContent += "\n❌ " + e.message;
  }
};