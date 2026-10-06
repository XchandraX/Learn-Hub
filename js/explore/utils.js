import { LANG_MAP } from "../config.js";

export const encodePath = (path) =>
  path.split("/").map(encodeURIComponent).join("/");

export const getExt = (path) => {
  const parts = path.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
};

export const getLang = (path) => LANG_MAP[getExt(path)] || "none";

export const getFileIcon = (name, type) => {
  if (type === "tree") return "📁";
  const ext = getExt(name);
  const icons = {
    py: "🐍", js: "📜", mjs: "📜", ts: "📘", tsx: "📘",
    cpp: "⚙️", cc: "⚙️", cxx: "⚙️", hpp: "⚙️", h: "⚙️", c: "⚙️",
    md: "📝", markdown: "📝",
    json: "🔧", html: "🌐", css: "🎨",
    sql: "🗃️", sh: "💻", yml: "🔧", yaml: "🔧",
    txt: "📄",
    png: "🖼️", jpg: "🖼️", jpeg: "🖼️", gif: "🖼️", webp: "🖼️",
    svg: "🖼️", ico: "🖼️", bmp: "🖼️", avif: "🖼️",
    mp3: "🎵", wav: "🎵", ogg: "🎵", m4a: "🎵",
    mp4: "🎬", webm: "🎬", mov: "🎬",
    pdf: "📕",
  };
  return icons[ext] || "📄";
};

export const setLoading = (show, text = "Memuat...") => {
  const overlay = document.getElementById("loading-overlay");
  const loadingText = document.getElementById("loading-text");
  if (loadingText) loadingText.textContent = text;
  if (overlay) overlay.style.display = show ? "flex" : "none";
};

export const loadScript = (url, timeoutMs = 15000) =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${url}"]`);
    if (existing && existing.dataset.loaded === "1") return resolve();
    if (existing) existing.remove();

    const s = document.createElement("script");
    s.src = url;
    s.async = true;

    const timer = setTimeout(() => {
      s.onload = s.onerror = null;
      reject(new Error(`Timeout ${timeoutMs}ms untuk: ${url}`));
    }, timeoutMs);

    s.onload = () => {
      clearTimeout(timer);
      s.dataset.loaded = "1";
      resolve();
    };
    s.onerror = () => {
      clearTimeout(timer);
      s.remove();
      reject(new Error(`Gagal load: ${url}`));
    };

    document.head.appendChild(s);
  });

export const closeMobileTree = () => {
  if (window.innerWidth <= 768) {
    document.getElementById("file-tree-panel")?.classList.remove("open");
  }
};