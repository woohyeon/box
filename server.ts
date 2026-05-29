import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "0706c198f0f003e8338bd8d99bc4101e";

app.use(express.json());

// API: Daily Box Office proxy
app.get("/api/boxoffice", async (req, res) => {
  try {
    const { date } = req.query;
    if (!date || typeof date !== "string" || !/^\d{8}$/.test(date)) {
      return res.status(400).json({ error: "Invalid or missing date parameter. Format must be YYYYMMDD." });
    }

    const url = `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${KOBIS_API_KEY}&targetDt=${date}`;
    console.log(`[API] Fetching box office list for ${date}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`KOBIS API returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[API ERROR] Box office fetch failed:", error);
    res.status(500).json({ error: error.message || "Failed to fetch box office data." });
  }
});

// API: Movie Info detailed report proxy
app.get("/api/movieinfo", async (req, res) => {
  try {
    const { movieCd } = req.query;
    if (!movieCd || typeof movieCd !== "string") {
      return res.status(400).json({ error: "Invalid or missing movieCd parameter." });
    }

    const url = `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${KOBIS_API_KEY}&movieCd=${movieCd}`;
    console.log(`[API] Fetching details for movie code: ${movieCd}...`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`KOBIS API returned status ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error: any) {
    console.error("[API ERROR] Movie details fetch failed:", error);
    res.status(500).json({ error: error.message || "Failed to fetch movie details." });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
