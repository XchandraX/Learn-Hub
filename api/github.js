// Vercel Serverless Function — proxy ke GitHub API
// Token dibaca dari env var, TIDAK kelihatan di client

const GITHUB_API = "https://api.github.com";

const ALLOWED_USERNAME = "XchandraX";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { path } = req.query;

  if (!path || typeof path !== "string") {
    return res.status(400).json({ error: "Missing 'path' query param" });
  }

  const allowedPrefixes = [
    `/repos/${ALLOWED_USERNAME}/`,
    `/users/${ALLOWED_USERNAME}`,
  ];

  const isAllowed = allowedPrefixes.some((prefix) => path.startsWith(prefix));
  if (!isAllowed) {
    return res.status(403).json({ error: "Path tidak diizinkan" });
  }

  const url = `${GITHUB_API}${path}`;

  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "LearnHub-Vercel",
  };

  if (process.env.GH_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GH_TOKEN}`;
  }

  try {
    const ghRes = await fetch(url, { headers });

    // 🔑 Baca text dulu — GitHub kadang balikin HTML, bukan JSON
    const rawText = await ghRes.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Bukan JSON — kemungkinan error page dari GitHub/CDN
      console.error(
        `[proxy] GitHub balikin non-JSON (status ${ghRes.status}):`,
        rawText.slice(0, 200)
      );
      return res.status(502).json({
        error: "GitHub balikin response tidak valid",
        status: ghRes.status,
        preview: rawText.slice(0, 200),
      });
    }

    // Cache hanya untuk response OK
    if (ghRes.ok) {
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=3600, stale-while-revalidate=86400"
      );
    }

    return res.status(ghRes.status).json(data);
  } catch (err) {
    console.error("[proxy] error:", err);
    return res.status(500).json({
      error: "GitHub API gagal dihubungi",
      detail: err?.message || String(err),
    });
  }
}