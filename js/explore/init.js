import { CONFIG, SUBJECTS } from "../config.js";
import { state } from "./state.js";
import { gh } from "./api.js";
import { buildTree, renderFileTree } from "./tree.js";
import { bindEvents } from "./events.js";
import { setLoading } from "./utils.js";

export const init = async () => {
  const params = new URLSearchParams(window.location.search);
  const subjectId = params.get("repo");

  const subject = SUBJECTS.find(
    (s) =>
      s.id === subjectId ||
      s.repo === subjectId ||
      s.id.toLowerCase() === (subjectId || "").toLowerCase() ||
      s.repo.toLowerCase() === (subjectId || "").toLowerCase()
  );

  if (!subject) {
    console.warn("[explore] subject tidak ditemukan untuk:", subjectId);
    window.location.href = "index";
    return;
  }

  state.subject = subject;

  document.title = `${subject.name} | Learning Journal`;
  document.getElementById("topbar-icon").textContent = subject.icon;
  document.getElementById("topbar-repo").textContent = subject.name;
  document.getElementById("topbar-github").href =
    `https://github.com/${CONFIG.githubUsername}/${subject.repo}`;

  try {
    setLoading(true, "Mengambil info repo...");
    const repoInfo = await gh(`/repos/${CONFIG.githubUsername}/${subject.repo}`);
    state.branch = repoInfo.default_branch || "main";

    setLoading(true, "Membangun file tree...");
    const treeData = await gh(
      `/repos/${CONFIG.githubUsername}/${subject.repo}/git/trees/${state.branch}?recursive=1`
    );

    state.tree = buildTree(treeData.tree);
    renderFileTree();
    bindEvents();
    setLoading(false);
  } catch (err) {
    setLoading(true, `❌ ${err.message}`);
    setTimeout(() => setLoading(false), 3000);
  }
};