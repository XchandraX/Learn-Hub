import { loadScript } from "../utils.js";

let _sqlLoaded = false;

export const initSqlJs = async () => {
  if (_sqlLoaded) return;
  await loadScript("https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js");
  _sqlLoaded = true;
};

export const runSql = async (code) => {
  const panel = document.getElementById("output-panel");
  const out = document.getElementById("output-content");
  panel.style.display = "flex";
  out.textContent = "▶ Menjalankan SQL...\n\n";

  let buffer = out.textContent;

  const write = (s) => {
    buffer += s;
    out.textContent = buffer;
    out.scrollTop = out.scrollHeight;
  };

  try {
    await initSqlJs();
    const SQL = await window.initSqlJs({
      locateFile: (f) => `https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/${f}`,
    });
    const db = new SQL.Database();

    const results = db.exec(code);

    if (!results.length) {
      write("(Query berhasil, tidak ada hasil untuk ditampilkan)\n");
    } else {
      results.forEach((r, i) => {
        if (results.length > 1) write(`--- Result ${i + 1} ---\n`);

        const cols = r.columns;
        const widths = cols.map((c, ci) =>
          Math.max(
            c.length,
            ...r.values.map((row) => String(row[ci] ?? "NULL").length)
          )
        );

        const pad = (s, w) => String(s).padEnd(w, " ");
        write(cols.map((c, ci) => pad(c, widths[ci])).join(" | ") + "\n");
        write(cols.map((_, ci) => "-".repeat(widths[ci])).join("-+-") + "\n");
        r.values.forEach((row) => {
          write(row.map((v, ci) => pad(v ?? "NULL", widths[ci])).join(" | ") + "\n");
        });
        write("\n");
      });
    }
    db.close();
  } catch (e) {
    write("❌ " + e.message);
  }
};