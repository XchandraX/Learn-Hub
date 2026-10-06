import { CONFIG } from "../config.js";
import { state } from "./state.js";
import { encodePath } from "./utils.js";

const API_BASE = "/api/github";

export const gh = async (endpoint) => {
  let githubPath = endpoint;
  if (endpoint.startsWith("https://api.github.com")) {
    githubPath = endpoint.replace("https://api.github.com", "");
  }

  const url = `${API_BASE}?path=${encodeURIComponent(githubPath)}`;
  const cacheKey = `lh_cache_${githubPath}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CONFIG.cacheMinutes * 60 * 1000) {
        return data;
      }
    }
  } catch (e) {}

  const res = await fetch(url);

  if (!res.ok) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data } = JSON.parse(cached);
        console.warn("[cache] rate limit — pakai cache lama");
        return data;
      }
    } catch (e) {}

    if (res.status === 403) throw new Error("Akses ditolak.");
    if (res.status === 404) throw new Error("Repo tidak ditemukan.");
    throw new Error(`GitHub error: ${res.status}`);
  }

  const data = await res.json();
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ data, ts: Date.now() }));
  } catch (e) {}

  return data;
};

export const fetchRaw = async (path) => {
  const url = `https://raw.githubusercontent.com/${CONFIG.githubUsername}/${state.subject.repo}/${state.branch}/${encodePath(path)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal ambil file: ${res.status}`);
  return res.text();
};