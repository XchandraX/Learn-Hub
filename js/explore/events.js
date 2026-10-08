import { state } from "./state.js";
import { getExt } from "./utils.js";
import { runByExtension } from "./runners/index.js";
import { toggleMarkdownView, toggleHtmlView } from "./viewer.js";
import { IMAGE_EXTS, AUDIO_EXTS, VIDEO_EXTS, PDF_EXTS } from "./constants.js";

export const bindEvents = () => {
  document.getElementById("copy-btn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.currentContent);
    const btn = document.getElementById("copy-btn");
    const orig = btn.textContent;
    btn.textContent = "✓ Copied!";
    setTimeout(() => (btn.textContent = orig), 1500);
  });

  document.getElementById("download-btn").addEventListener("click", async () => {
    const filename = state.currentFile.split("/").pop();
    const ext = getExt(state.currentFile);

    if ([...IMAGE_EXTS, ...AUDIO_EXTS, ...VIDEO_EXTS, ...PDF_EXTS].includes(ext)) {
      const a = document.createElement("a");
      a.href = state.currentContent;
      a.download = filename;
      a.target = "_blank";
      a.click();
      return;
    }

    const blob = new Blob([state.currentContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("view-toggle").addEventListener("click", () => {
    const ext = getExt(state.currentFile);
    if (ext === "html" || ext === "htm") {
      toggleHtmlView();
    } else {
      toggleMarkdownView();
    }
  });
  document.getElementById("run-btn").addEventListener("click", () => {
    const ext = getExt(state.currentFile);
    if (ext === "md") {
      document.getElementById("view-toggle").click();
      return;
    }
    runByExtension(ext, state.currentContent);
  });

  document.getElementById("clear-output").addEventListener("click", () => {
    document.getElementById("output-panel").style.display = "none";
  });

  document.getElementById("collapse-all").addEventListener("click", () => {
    document.querySelectorAll("#file-tree .tree-children").forEach((el) => {
      el.classList.remove("open");
    });
    document.querySelectorAll("#file-tree .tree-item.folder .tree-arrow").forEach((el) => {
      el.textContent = "▸";
    });
  });

  document.getElementById("expand-all").addEventListener("click", () => {
    document.querySelectorAll("#file-tree .tree-children").forEach((el) => {
      el.classList.add("open");
    });
    document.querySelectorAll("#file-tree .tree-item.folder .tree-arrow").forEach((el) => {
      el.textContent = "▾";
    });
  });

  document.getElementById("mobile-tree-toggle").addEventListener("click", () => {
    document.getElementById("file-tree-panel").classList.toggle("open");
  });
};