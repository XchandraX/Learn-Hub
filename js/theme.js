document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("theme-toggle");
  const body = document.body;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : prefersDark;

  const apply = (dark) => {
    body.classList.toggle("dark-mode", dark);
    if (btn) btn.textContent = dark ? "🌙" : "☀️";
  };
  apply(isDark);

  btn?.addEventListener("click", () => {
    const nowDark = !body.classList.contains("dark-mode");
    apply(nowDark);
    localStorage.setItem("theme", nowDark ? "dark" : "light");
  });
});