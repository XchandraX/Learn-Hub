import { CONFIG, SUBJECTS } from "./config.js";

const CACHE_KEY = (key) => `lh_cache_${key}`;
const CACHE_TTL = CONFIG.cacheMinutes * 60 * 1000;

const API_BASE = "/api/github";

const apiFetch = async (githubPath) => {
  const url = `${API_BASE}?path=${encodeURIComponent(githubPath)}`;
  const cacheKey = CACHE_KEY(githubPath);

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch (e) {}

  const res = await fetch(url);

  if (!res.ok) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.warn("[cache] pakai cache lama");
        return data;
      }
    } catch (e) {}

    if (res.status === 403) throw new Error("Akses ditolak proxy.");
    if (res.status === 404) throw new Error("Repo tidak ditemukan.");
    throw new Error(`API error: ${res.status}`);
  }

  const data = await res.json();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {}

  return data;
};

const formatRelative = (iso) => {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Hari ini";
  if (days === 1) return "Kemarin";
  if (days < 30) return `${days} hari lalu`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} bulan lalu`;
  return `${Math.floor(months / 12)} tahun lalu`;
};

const loadSubjects = async () => {
  const grid = document.getElementById("subjects-grid");
  grid.innerHTML = SUBJECTS.map((s) => `
    <div class="subject-card skeleton" data-id="${s.id}">
      <div class="subject-icon">${s.icon}</div>
      <div class="subject-body">
        <h3>${s.name}</h3>
        <p>${s.description}</p>
        <div class="subject-meta">
          <span class="loading-dots">Memuat...</span>
        </div>
      </div>
    </div>
  `).join("");

  const results = await Promise.all(
    SUBJECTS.map(async (s) => {
      try {
        const repo = await apiFetch(`/repos/${CONFIG.githubUsername}/${s.repo}`);
        return { ok: true, subject: s, repo };
      } catch (err) {
        return { ok: false, subject: s, error: err.message };
      }
    })
  );

  let totalUpdated = 0;
  let okCount = 0;

  results.forEach((r) => {
    const card = document.querySelector(`[data-id="${r.subject.id}"]`);
    if (!card) return;
    card.classList.remove("skeleton");

    if (r.ok) {
      okCount++;
      const t = new Date(r.repo.updated_at).getTime();
      if (t > totalUpdated) totalUpdated = t;
      card.querySelector(".subject-meta").innerHTML = `
        <span class="meta-pill">${r.repo.language || "Mixed"}</span>
        <span class="meta-date">Updated ${formatRelative(r.repo.updated_at)}</span>
      `;
      card.addEventListener("click", () => {
        window.location.href = `explore?repo=${encodeURIComponent(r.subject.id)}`;
      });
    } else {
      card.classList.add("error");
      card.querySelector(".subject-meta").innerHTML = `
        <span class="meta-error">${r.error}</span>
      `;
    }
  });

  document.getElementById("stat-subjects").textContent = SUBJECTS.length;
  document.getElementById("stat-repos").textContent = okCount;
  document.getElementById("stat-updated").textContent = totalUpdated
    ? formatRelative(new Date(totalUpdated).toISOString())
    : "-";
};

document.addEventListener("DOMContentLoaded", loadSubjects);