import { state } from "./state.js";
import { getFileIcon } from "./utils.js";
import { openFile } from "./viewer.js";

export const buildTree = (flatItems) => {
  const root = { name: "root", type: "tree", path: "", children: [] };

  flatItems.forEach((item) => {
    const parts = item.path.split("/");
    let current = root;

    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let child = current.children.find((c) => c.name === part);

      if (!child) {
        child = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          type: isLast ? item.type : "tree",
          size: isLast ? item.size : undefined,
          children: [],
        };
        current.children.push(child);
      }
      current = child;
    });
  });

  const sortRecursive = (node) => {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "tree" ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { numeric: true });
    });
    node.children.forEach(sortRecursive);
  };
  sortRecursive(root);

  return root;
};

const renderTreeNode = (node, depth = 0) => {
  if (node.type === "blob") {
    return `
      <div class="tree-item file" data-path="${node.path}" title="${node.path}"
           style="padding-left:${depth * 14 + 12}px">
        <span class="tree-arrow"></span>
        <span class="tree-icon">${getFileIcon(node.name, "blob")}</span>
        <span class="tree-name">${node.name}</span>
      </div>
    `;
  }

  if (depth === 0) {
    return node.children.map((c) => renderTreeNode(c, 1)).join("");
  }

  const uid = `folder_${node.path.replace(/[^a-z0-9]/gi, "_")}`;

  return `
    <div class="tree-folder">
      <div class="tree-item folder" data-toggle="${uid}"
           style="padding-left:${depth * 14 + 12}px">
        <span class="tree-arrow">▸</span>
        <span class="tree-icon">📁</span>
        <span class="tree-name">${node.name}</span>
      </div>
      <div class="tree-children" id="${uid}">
        ${node.children.map((c) => renderTreeNode(c, depth + 1)).join("")}
      </div>
    </div>
  `;
};

export const renderFileTree = () => {
  const container = document.getElementById("file-tree");
  container.innerHTML = renderTreeNode(state.tree);

  container.querySelectorAll(".tree-item.folder").forEach((el) => {
    el.addEventListener("click", () => {
      const target = document.getElementById(el.dataset.toggle);
      if (!target) return;
      const isOpen = target.classList.toggle("open");
      el.querySelector(".tree-arrow").textContent = isOpen ? "▾" : "▸";
    });
  });

  container.querySelectorAll(".tree-item.file").forEach((el) => {
    el.addEventListener("click", () => openFile(el.dataset.path));
  });

  container.querySelectorAll(":scope > .tree-folder > .tree-item.folder").forEach((el) => {
    const target = document.getElementById(el.dataset.toggle);
    if (target) {
      target.classList.add("open");
      el.querySelector(".tree-arrow").textContent = "▾";
    }
  });
};