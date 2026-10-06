// ============================================================
// KONFIGURASI — Ganti username dengan punyamu!
// ============================================================
export const CONFIG = {
  githubUsername: "XchandraX", 
  cacheMinutes: 60, // Berapa lama cache GitHub API (menit)
};

// Daftar subject/repo yang mau ditampilkan
export const SUBJECTS = [
  {
    id: "python",
    name: "Python",
    icon: "🐍",
    description: "Belajar Python dari Dasar",
    repo: "Python_Learn",
    language: "python",
    accent: "#3776AB",
  },
  {
    id: "git",
    name: "Git & GitHub",
    icon: "📚",
    description: "Latihan Git dan GitHub",
    repo: "Git_And_Github",
    language: "markdown",
    accent: "#F05032",
  },
  {
    id: "cpp",
    name: "C++",
    icon: "⚙️",
    description: "Belajar C++ dari dasar hingga mini project",
    repo: "Cpp_Learn",
    language: "cpp",
    accent: "#00599C",
  },
  {
    id: "sql",
    name: "SQL",
    icon: "🗃️",
    description: "Belajar SQL dari dasar hingga query kompleks",
    repo: "Sql_Learn",
    language: "sql",
    accent: "#00758F",
  },
  {
    id: "dsa",
    name: "Data Structures & Algorithms",
    icon: "🧮",
    description: "Algoritma & Struktur Data",
    repo: "Data_Structures_Algorithms",
    language: "python",
    accent: "#10B981",
  },
];

// Mapping ekstensi file → bahasa Prism.js
export const LANG_MAP = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  ts: "typescript",
  jsx: "jsx",
  tsx: "tsx",
  cpp: "cpp", cc: "cpp", cxx: "cpp", hpp: "cpp", h: "cpp",
  c: "c",
  md: "markdown", markdown: "markdown",
  json: "json",
  html: "markup", htm: "markup",
  css: "css",
  scss: "scss",
  sql: "sql",
  sh: "bash", bash: "bash",
  yml: "yaml", yaml: "yaml",
  java: "java",
  go: "go",
  rs: "rust",
  php: "php",
  rb: "ruby",
  kt: "kotlin",
  swift: "swift",
  dart: "dart",
  txt: "none",
};

// File yang bisa di-run — mapping ext → nama runner
export const RUNNABLE = {
  py: "python",
  js: "javascript",
  mjs: "javascript",
  ts: "typescript",
  cpp: "cpp", cc: "cpp", cxx: "cpp", c: "cpp",
  lua: "lua",
  sql: "sql",
};