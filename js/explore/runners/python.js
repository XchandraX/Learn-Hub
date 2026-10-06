import { state } from "../state.js";
import { loadScript } from "../utils.js";
import { showInputModal } from "../modal.js";

export const initPyodide = async () => {
  if (state.pyodide) return state.pyodide;
  if (state.pyodideLoading) {
    while (state.pyodideLoading) await new Promise((r) => setTimeout(r, 100));
    return state.pyodide;
  }

  state.pyodideLoading = true;
  const t0 = performance.now();

  try {
    const onProgress = (msg) => {
      console.log(`[pyodide ${Math.round(performance.now() - t0)}ms] ${msg}`);
      const el = document.getElementById("output-content");
      if (el) el.textContent = `⏳ ${msg}...\n\n💡 Loading pertama ~10 detik. Kunjungan berikutnya jauh lebih cepat karena cache.`;
    };

    onProgress("Menyiapkan Pyodide");
    await loadScript("https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js");

    onProgress("Downloading WASM (~10MB, sekali saja)");
    state.pyodide = await window.loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });

    onProgress("Init interpreter");
    await state.pyodide.runPythonAsync(/* patch */);

    console.log(`[pyodide] ready in ${Math.round(performance.now() - t0)}ms`);
    return state.pyodide;
  } finally {
    state.pyodideLoading = false;
  }
};

export const runPython = async (code) => {
  const outputPanel = document.getElementById("output-panel");
  const outputContent = document.getElementById("output-content");

  outputPanel.style.display = "flex";

  const initialText =
    "▶ Menjalankan program...\n💡 Kalau ada input(), akan muncul dialog browser.\n\n";
  outputContent.textContent = initialText;

  try {
    const pyodide = await initPyodide();

    let output = initialText;

    const inputCount = (code.match(/\binput\s*\(/g) || []).length;

    if (inputCount > 0) {
      const hint =
        `Program ini punya ~${inputCount} input().\n\n` +
        `Opsi A: Isi semua di sini, satu per baris → program jalan otomatis.\n` +
        `Opsi B: Klik Cancel → akan ditanya satu-satu saat program berjalan.`;

      const bulk = await showInputModal({
        title: "Input Python (opsional)",
        hint: hint.replace(/\n/g, "<br>"),
        placeholder: "Ketik semua input di sini (atau biarkan kosong)...",
      });

      if (bulk !== null && bulk.trim() !== "") {
        window.__inputQueue = bulk.split("\n");
        const lines = window.__inputQueue;
        output += `📥 Bulk input (${lines.length} baris):\n`;
        lines.forEach((l) => (output += `   > ${l}\n`));
        output += "\n";
        outputContent.textContent = output;
      } else {
        window.__inputQueue = [];
      }
    } else {
      window.__inputQueue = [];
    }

    const recentLines = [];
    const MAX_RECENT = 3;

    window.__getInputContext = () => {
      if (recentLines.length === 0) return "";
      return recentLines[recentLines.length - 1];
    };

    pyodide.setStdout({
      batched: (str) => {
        const chunk = str.endsWith("\n") ? str : str + "\n";
        output += chunk;
        outputContent.textContent = output;

        chunk.split("\n").forEach((line) => {
          const t = line.trim();
          if (!t) return;
          if (/^[=\-─━_*~#\s]+$/.test(t)) return;
          recentLines.push(t);
          if (recentLines.length > MAX_RECENT) recentLines.shift();
        });

        outputContent.scrollTop = outputContent.scrollHeight;
      },
    });

    pyodide.setStderr({
      batched: (str) => {
        const chunk = str.endsWith("\n") ? str : str + "\n";
        output += "⚠️ " + chunk;
        outputContent.textContent = output;
        outputContent.scrollTop = outputContent.scrollHeight;
      },
    });

    await pyodide.runPythonAsync(code);

    window.__inputQueue = [];

    if (!output.trim() || output.trim() === initialText.trim()) {
      outputContent.textContent = "(Program selesai tanpa output)";
    }
  } catch (err) {
    console.error("[runPython] error:", err);
    if (err.message && err.message.includes("EOFError")) {
      outputContent.textContent += "\n⚠️ Program dihentikan (input dibatalkan).";
    } else {
      outputContent.textContent += `\n❌ Error:\n${err.message}`;
    }
  }
};