import { loadScript } from "../utils.js";
import { showInputModal } from "../modal.js";
import { preprocessCppForJSCPP } from "../preprocessor.js";

let _jscppLoaded = false;

export const initJSCPP = async () => {
  if (_jscppLoaded && window.JSCPP) return;

  const SOURCES = [
    "https://felixhao28.github.io/JSCPP/dist/JSCPP.es5.min.js",
    "https://cdn.jsdelivr.net/npm/JSCPP@2.0.9/dist/JSCPP.es5.min.js",
    "https://cdn.jsdelivr.net/npm/JSCPP/dist/JSCPP.es5.min.js",
    "https://raw.githubusercontent.com/felixhao28/JSCPP/master/dist/JSCPP.es5.min.js",
    "https://cdn.jsdelivr.net/npm/jscpp_patched@2.0.10/dist/JSCPP.es5.min.js",
  ];

  const errors = [];

  for (const url of SOURCES) {
    try {
      console.log("[JSCPP] mencoba:", url);
      await loadScript(url);
      if (window.JSCPP) {
        console.log("[JSCPP] ✅ berhasil dari:", url);
        _jscppLoaded = true;
        return;
      } else {
        errors.push(`${url} → file ter-load tapi window.JSCPP kosong`);
      }
    } catch (e) {
      errors.push(`${url} → ${e.message}`);
    }
  }

  console.error("[JSCPP] semua CDN gagal:", errors);
  throw new Error(
    "JSCPP gagal dimuat dari semua CDN. Kemungkinan diblokir firewall/adblock. " +
      "Cek DevTools → Network lalu buka salah satu URL CDN manual."
  );
};

// ============================================================
// UTIL — unescape escape-sequence C++ di string literal
// ============================================================
// Contoh: literal di source C++ = "\nMasukkan Operasi: "  (backslash + n)
// Harus jadi = "\nMasukkan Operasi: " (newline sungguhan) supaya bisa
// di-indexOf di output program.
const unescapeCppLiteral = (s) =>
  s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r");

// ============================================================
// ECHO INPUT KE OUTPUT
// ============================================================
// Cari setiap prompt di output program → sisipkan " nilai\n" tepat
// setelah prompt. Prompt yang muncul berkali-kali (loop) dapat input
// berikutnya secara berurutan.
const insertInputEchoes = (text, prompts, inputs) => {
  if (!prompts.length || !inputs.length) return text;

  const inputsLeft = [...inputs];
  let result = "";
  let pos = 0;

  while (pos < text.length && inputsLeft.length > 0) {
    // Cari prompt mana yang paling awal muncul setelah pos
    let bestIdx = -1;
    let bestPrompt = null;
    for (const p of prompts) {
      if (!p) continue;
      const idx = text.indexOf(p, pos);
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) {
        bestIdx = idx;
        bestPrompt = p;
      }
    }
    if (bestIdx === -1) break;

    const endIdx = bestIdx + bestPrompt.length;
    result += text.slice(pos, endIdx);

    // Spasi kosmetik — hanya kalau prompt belum berakhir whitespace
    const spacer = /\s$/.test(bestPrompt) ? "" : " ";
    // Nilai + newline: meniru user yang menekan Enter setelah mengetik
    result += spacer + inputsLeft.shift() + "\n";

    pos = endIdx;
  }

  result += text.slice(pos);
  return result;
};

export const runCpp = async (code) => {
  const panel = document.getElementById("output-panel");
  const out = document.getElementById("output-content");
  panel.style.display = "flex";

  let buffer = "▶ Menjalankan C/C++ (JSCPP)...\n\n";
  out.textContent = buffer;
  out.scrollTop = 0;

  const write = (s) => {
    buffer += s;
    out.textContent = buffer;
    out.scrollTop = out.scrollHeight;
  };

  try {
    await initJSCPP();

    const { code: patched, notes } = preprocessCppForJSCPP(code);
    if (notes.length) {
      write("ℹ️ Preprocessor:\n");
      notes.forEach((n) => write("   • " + n + "\n"));
      write("\n");
    }

    const unsupported = [
      { re: /\bnew\s+\w+/, msg: "Operator 'new' tidak didukung JSCPP." },
      {
        re: /\bdelete\s+\[?\]?/,
        msg: "Operator 'delete' tidak didukung JSCPP.",
      },
      { re: /\btemplate\s*</, msg: "Template lanjutan tidak didukung JSCPP." },
      { re: /\bvector\s*</, msg: "STL vector tidak didukung JSCPP." },
      { re: /\bmap\s*</, msg: "STL map tidak didukung JSCPP." },
    ];
    for (const u of unsupported) {
      if (u.re.test(patched)) write("⚠️ " + u.msg + "\n");
    }

    const stdinNeeded =
      /\b(cin\s*>>|scanf\s*\(|getchar\s*\(|gets\s*\(|fgets\s*\(|getline\s*\()/.test(
        patched
      );

    const cinChunks = patched.match(/cin\s*>>[^;]*/g) || [];
    let approxCount = 0;
    cinChunks.forEach((chunk) => {
      approxCount += (chunk.match(/>>/g) || []).length;
    });

    const cinMatches = [...patched.matchAll(/\bcin\s*>>/g)];
    const prompts = [];
    let lastScanPos = 0;

    cinMatches.forEach((m) => {
      const before = patched.slice(lastScanPos, m.index);
      const lits = [...before.matchAll(/"([^"]+)"/g)];
      if (lits.length) {
        const raw = lits[lits.length - 1][1];
        // 🔑 Unescape dulu, baru trim — supaya "\nMasukkan Operasi: " jadi
        //    newline sungguhan + "Masukkan Operasi:" (tanpa spasi akhir).
        const unescaped = unescapeCppLiteral(raw).trim();
        const isDecorative = /^[=\-─━_*~#\s]+$/.test(unescaped);
        if (unescaped && !isDecorative) {
          if (unescaped !== prompts[prompts.length - 1]) prompts.push(unescaped);
        }
      }
      lastScanPos = m.index;
    });

    let usedInputs = [];

    if (stdinNeeded) {
      const hintParts = [];

      const MAX_PREVIEW = 6;
      if (prompts.length > 0) {
        const preview = prompts
          .slice(0, MAX_PREVIEW)
          .map((p, i) => `${i + 1}. ${p.replace(/[\r\n]+/g, " ").trim()}`)
          .join("\n");
        const more =
          prompts.length > MAX_PREVIEW
            ? `\n… dan ${prompts.length - MAX_PREVIEW} prompt lainnya`
            : "";
        hintParts.push(`Program ini minta:\n${preview}${more}`);
      }

      if (approxCount > 0) {
        hintParts.push(
          `Terlihat butuh ~${approxCount} input. ` +
            `Kalau program pakai loop, jumlahnya bisa lebih.`
        );
      } else {
        hintParts.push(`Program ini butuh input (cin).`);
      }

      hintParts.push(
        `Opsi A: Tulis semua input di sini, satu per baris.\n` +
          `Opsi B: Klik Cancel → mode interaktif (ditanya satu-satu via dialog).`
      );

      const hint = hintParts.join("\n\n");

      const placeholder =
        prompts.length > 0
          ? `Contoh urutan input:\n${prompts
              .slice(0, 3)
              .map((_, i) => `(isi untuk prompt ${i + 1})`)
              .join("\n")}`
          : "Ketik input di sini, satu per baris...";

      const userInput = await showInputModal({
        title: "Input C++ (cin)",
        hint: hint.replace(/\n/g, "<br>").replace(/ /g, "&nbsp;"),
        placeholder,
      });

      // ============================================================
      // MODE A — bulk input dari modal
      // ============================================================
      if (userInput !== null && userInput.trim() !== "") {
        const lines = userInput.split("\n");
        while (lines.length && lines[lines.length - 1] === "") lines.pop();
        usedInputs = lines;

        write(`📥 Input (${lines.length} baris):\n`);
        lines.forEach((line) => write(`   > ${line}\n`));
        write("\n");
      }

      // ============================================================
      // MODE B — fallback interaktif via window.prompt
      // ============================================================
      else {
        const estimate = Math.max(approxCount, prompts.length, 1);

        write(`📥 Mode interaktif — ~${estimate} input\n`);
        write(`   (klik Cancel di dialog untuk berhenti lebih awal)\n\n`);

        for (let i = 0; i < estimate; i++) {
          const raw = prompts[i] || `Input #${i + 1}`;
          const label = raw.replace(/[\r\n]+/g, " ").trim() || `Input #${i + 1}`;
          const display = `[${i + 1}/${estimate}] ${label}`;
          const val = window.prompt(display);
          if (val === null) break;
          usedInputs.push(val);
        }

        if (usedInputs.length === 0) {
          write(
            "(Tidak ada input — program akan jalan dengan stdin kosong)\n\n"
          );
        } else {
          write(`📥 ${usedInputs.length} input terkumpul\n\n`);
        }
      }
    }

    const stdinContent = usedInputs.join("\n");

    // Tandai posisi awal output program — biar post-process cuma
    // nyentuh bagian output program, bukan prefix (notes/mode info).
    const programOutStart = buffer.length;

    let exitCode;
    try {
      exitCode = window.JSCPP.run(patched, stdinContent, {
        stdio: {
          write: (s) => write(s),
          isatty: () => false,
        },
      });
    } catch (jscppErr) {
      console.error("[JSCPP] raw error:", jscppErr);
      write(
        "\n❌ " +
          (typeof jscppErr === "string"
            ? jscppErr
            : jscppErr?.message || String(jscppErr)) +
          "\n"
      );
    }

    // ============================================================
    // POST-PROCESS — sisipkan nilai input inline setelah prompt
    // ============================================================
    if (prompts.length > 0 && usedInputs.length > 0) {
      const before = buffer.slice(0, programOutStart);
      const programPart = buffer.slice(programOutStart);
      buffer = before + insertInputEchoes(programPart, prompts, usedInputs);
      out.textContent = buffer;
      out.scrollTop = out.scrollHeight;
    }

    if (typeof exitCode === "number" && exitCode !== 0) {
      write(`\n⚠️ Program keluar dengan exit code ${exitCode}\n`);
    }
  } catch (e) {
    console.error("[runCpp] fatal:", e);
    write(
      "\n❌ " + (typeof e === "string" ? e : e?.message || String(e)) + "\n"
    );
  }
};