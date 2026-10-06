import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { encodePath } from "./utils.js";
import { renderCode } from "./code.js";

let currentRenderMode = "preview";

export const renderMarkdown = (content, path) => {
  currentRenderMode = "preview";
  const html = marked.parse(content, { breaks: true, gfm: true });

  const temp = document.createElement("div");
  temp.innerHTML = html;

  const baseDir = path.includes("/")
    ? path.substring(0, path.lastIndexOf("/") + 1)
    : "";

  const toRawUrl = (rel) => {
    if (!rel) return rel;
    if (/^(https?:)?\/\//i.test(rel)) return rel;
    if (rel.startsWith("data:") || rel.startsWith("#") || rel.startsWith("mailto:")) return rel;
    const full = baseDir + rel;
    return `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${state.subject.repo}/${state.branch}/${encodePath(full)}`;
  };

  temp.querySelectorAll("img[src]").forEach((el) => {
    el.setAttribute("src", toRawUrl(el.getAttribute("src")));
    el.setAttribute("loading", "lazy");
  });
  temp.querySelectorAll("a[href]").forEach((el) => {
    const href = el.getAttribute("href");
    if (href && !/^(https?:)?\/\//i.test(href) && !href.startsWith("#") && !href.startsWith("mailto:")) {
      el.setAttribute("href", toRawUrl(href));
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener");
    }
  });

  document.getElementById("viewer-body").innerHTML = `
    <div class="markdown-body">${temp.innerHTML}</div>
  `;
  document.getElementById("view-toggle").textContent = "👁 Source";
};

export const renderMarkdownSource = (content) => {
  currentRenderMode = "source";
  renderCode(content, "markdown");
  document.getElementById("view-toggle").textContent = "👁 Preview";
};

export const getCurrentRenderMode = () => currentRenderMode;