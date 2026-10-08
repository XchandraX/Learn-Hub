import { CONFIG, RUNNABLE } from "../config.js";
import { state } from "./state.js";
import {
  getExt,
  getLang,
  getFileIcon,
  encodePath,
  closeMobileTree,
} from "./utils.js";
import { fetchRaw } from "./api.js";
import { renderCode } from "./code.js";
import {
  renderMarkdown,
  renderMarkdownSource,
  getCurrentRenderMode,
} from "./markdown.js";
import { IMAGE_EXTS, AUDIO_EXTS, VIDEO_EXTS, PDF_EXTS } from "./constants.js";
import { runners } from "./runners/index.js";
import { renderHtmlPreview, resetHtmlRenderMode, getHtmlRenderMode } from "./html.js";

export const openFile = async (path) => {
  state.currentFile = path;
  resetHtmlRenderMode();
  state.currentContent = "";

  document.querySelectorAll(".tree-item.file").forEach((el) => {
    el.classList.toggle("active", el.dataset.path === path);
  });

  document.getElementById("welcome-panel").style.display = "none";
  document.getElementById("file-viewer").style.display = "flex";
  document.getElementById("output-panel").style.display = "none";

  const parts = path.split("/");
  document.getElementById("breadcrumb").innerHTML = parts
    .map((p, i) => {
      const isLast = i === parts.length - 1;
      return isLast
        ? `<span class="crumb current">${getFileIcon(p, "blob")} ${p}</span>`
        : `<span class="crumb">${p}</span><span class="crumb-sep">/</span>`;
    })
    .join("");

  document.getElementById("view-toggle").style.display = "none";
  document.getElementById("run-btn").style.display = "none";

  const ext = getExt(path);
  const lang = getLang(path);
  const viewerBody = document.getElementById("viewer-body");

  const rawUrl = `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${state.subject.repo}/${state.branch}/${encodePath(path)}`;

  if (IMAGE_EXTS.includes(ext)) {
    state.currentContent = rawUrl;
    viewerBody.innerHTML = `
      <div class="media-viewer">
        <img src="${rawUrl}" alt="${path}" loading="lazy"
             onerror="this.parentElement.innerHTML='<p class=\\'viewer-error\\'>❌ Gagal load gambar</p>'" />
        <p class="media-caption">${path}</p>
      </div>
    `;
    return closeMobileTree();
  }

  if (AUDIO_EXTS.includes(ext)) {
    state.currentContent = rawUrl;
    viewerBody.innerHTML = `
      <div class="media-viewer">
        <audio controls src="${rawUrl}" style="width:100%;max-width:600px;"></audio>
        <p class="media-caption">${path}</p>
      </div>
    `;
    return closeMobileTree();
  }

  if (VIDEO_EXTS.includes(ext)) {
    state.currentContent = rawUrl;
    viewerBody.innerHTML = `
      <div class="media-viewer">
        <video controls src="${rawUrl}" style="max-width:100%;max-height:70vh;border-radius:8px;"></video>
        <p class="media-caption">${path}</p>
      </div>
    `;
    return closeMobileTree();
  }

  if (PDF_EXTS.includes(ext)) {
    state.currentContent = rawUrl;
    viewerBody.innerHTML = `<iframe src="${rawUrl}" class="pdf-viewer" title="${path}"></iframe>`;
    return closeMobileTree();
  }

  viewerBody.innerHTML = `<div class="viewer-loading"><div class="spinner"></div><p>Memuat file...</p></div>`;

  try {
    const content = await fetchRaw(path);
    state.currentContent = content;

    if (ext === "md") {
      renderMarkdown(content, path);
      document.getElementById("view-toggle").style.display = "inline-flex";
    } else if (ext === "html" || ext === "htm") {
      renderCode(content, lang || "markup");
      const toggleBtn = document.getElementById("view-toggle");
      toggleBtn.textContent = "▶ Preview";
      toggleBtn.style.display = "inline-flex";
    } else {
      renderCode(content, lang);
    }

    // Tombol Run hanya untuk bahasa "runnable" (bukan HTML — HTML punya Preview)
    if (RUNNABLE[ext] && ext !== "html" && ext !== "htm") {
      const langName = runners[RUNNABLE[ext]]?.label || "Code";
      const btn = document.getElementById("run-btn");
      btn.style.display = "inline-flex";
      btn.innerHTML = `▶ Run <span style="opacity:.7;font-size:.85em">(${langName})</span>`;
    }
  } catch (err) {
    viewerBody.innerHTML = `<div class="viewer-error"><p>❌ ${err.message}</p></div>`;
  }

  closeMobileTree();
};

export const toggleMarkdownView = () => {
  if (getCurrentRenderMode() === "preview") {
    renderMarkdownSource(state.currentContent);
  } else {
    renderMarkdown(state.currentContent, state.currentFile);
  }
};

export const toggleHtmlView = () => {
  const toggleBtn = document.getElementById("view-toggle");

  if (getHtmlRenderMode() === "preview") {
    // Kembali ke source
    renderCode(state.currentContent, getLang(state.currentFile) || "markup");
    resetHtmlRenderMode();
    toggleBtn.textContent = "▶ Preview";
  } else {
    // Tampilkan preview
    renderHtmlPreview(state.currentContent, state.currentFile);
    toggleBtn.textContent = "👁 Source";
  }
};