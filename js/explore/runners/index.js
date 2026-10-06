import { RUNNABLE } from "../../config.js";
import { initPyodide, runPython } from "./python.js";
import { runJavaScript, runTypeScript, initTypeScript } from "./javascript.js";
import { initJSCPP, runCpp } from "./cpp.js";
import { initFengari, runLua } from "./lua.js";
import { initSqlJs, runSql } from "./sql.js";

export const runners = {
  python: { label: "Python", init: initPyodide, run: runPython },
  javascript: { label: "JavaScript", init: async () => {}, run: runJavaScript },
  typescript: { label: "TypeScript", init: initTypeScript, run: runTypeScript },
  cpp: { label: "C/C++", init: initJSCPP, run: runCpp },
  lua: { label: "Lua", init: initFengari, run: runLua },
  sql: { label: "SQL", init: initSqlJs, run: runSql },
};

export const runByExtension = async (ext, code) => {
  const lang = RUNNABLE[ext];
  if (!lang) return;
  const runner = runners[lang];
  if (!runner) {
    console.warn("[runner] tidak ada runner untuk:", lang);
    return;
  }
  await runner.run(code);
};