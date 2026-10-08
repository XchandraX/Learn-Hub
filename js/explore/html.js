// js/explore/html.js
import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { encodePath } from "./utils.js";

/**
 * HTML Preview — render .html / .htm di dalam iframe ter-sandbox.
 * Aset relatif (CSS, gambar, script lokal di repo) tetap bisa dimuat
 * karena kita inject <base href> ke raw.githubusercontent.com.
 */

let currentMode = "source";

export const getHtmlRenderMode = () => currentMode;
export const resetHtmlRenderMode = () => { currentMode = "source"; };

const buildBaseHref = (path) => {
  const baseDir = path.includes("/")
    ? path.substring(0, path.lastIndexOf("/") + 1)
    : "";
  return `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${state.subject.repo}/${state.branch}/${encodePath(baseDir)}`;
};

const injectBase = (html, baseHref) => {
  // Hormati <base> milik user kalau ada
  if (/<base\s/i.test(html)) return html;

  const baseTag = `<base href="${baseHref}">`;

  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}`);
  }
  if (/<html[^>]*>/i.test(html)) {
    return html.replace(/<html([^>]*)>/i, `<html$1><head>${baseTag}</head>`);
  }
  // Dokumen tanpa struktur HTML sama sekali
  return `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`;
};

export const renderHtmlPreview = (content, path) => {
  currentMode = "preview";
  const viewerBody = document.getElementById("viewer-body");
  const baseHref = buildBaseHref(path);
  const html = injectBase(content, baseHref);

  viewerBody.innerHTML = `
    <div class="html-preview-wrap">
      <iframe class="html-preview-frame" title="HTML Preview"
        sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin allow-downloads"
        referrerpolicy="no-referrer"></iframe>
    </div>
  `;

  const iframe = viewerBody.querySelector(".html-preview-frame");
  iframe.srcdoc = html;

  // Sinkronkan tema saat iframe selesai load
  iframe.addEventListener("load", () => {
    const theme = document.body.classList.contains("dark-mode") ? "dark" : "light";
    try {
      iframe.contentWindow?.postMessage({ type: "set-theme", theme }, "*");
      iframe.contentWindow?.postMessage({ type: "APPLY_THEME", theme }, "*");
    } catch (e) { /* ignore */ }
  });
};