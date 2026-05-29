import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;
const KOBIS_API_KEY = process.env.KOBIS_API_KEY || "0706c198f0f003e8338bd8d99bc4101e";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

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

// API: Write custom review using Gemini API based on 3 keywords
app.post("/api/review", async (req, res) => {
  try {
    const { movieNm, keywords, genres, nations } = req.body;
    
    if (!movieNm) {
      return res.status(400).json({ error: "영화 이름(movieNm)이 비어있습니다." });
    }

    if (!keywords || !Array.isArray(keywords) || keywords.filter(Boolean).length === 0) {
      return res.status(400).json({ error: "감상평 생성에 반영할 키워드가 전달되지 않았습니다." });
    }

    const validKeywords = keywords.filter(Boolean);
    if (validKeywords.length !== 3) {
      return res.status(400).json({ 
        error: `3개의 키워드를 올바르게 입력해주세요. (현재 입력된 키워드 개수: ${validKeywords.length}개)` 
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Gemini API 키가 설정되지 않았습니다. 관리 콘솔의 'Settings > Secrets' 메뉴에서 GEMINI_API_KEY를 설정해주시기 바랍니다."
      });
    }

    console.log(`[Gemini API] Generating review for ${movieNm} containing keywords: ${validKeywords.join(", ")}...`);

    const prompt = `당신은 영화 전문 비평가이자 평론가입니다.
영화진흥위원회 KOBIS 데이터 기반 영화 정보:
- 영화 제목: "${movieNm}"
- 장르: ${genres || "종합"}
- 국가: ${nations || "한국/기타"}

특별 요청 사항:
아래 제공된 3가지 핵심 키워드가 반드시 감상평(리뷰) 내에 명시적으로, 그리고 자연스러운 맥락 속에 녹아들도록 작성해주세요.
[핵심 키워드 3가지]: ${validKeywords.map(k => `"${k}"`).join(", ")}

작성 규칙:
1. 글머리에 매력적이고 멋진 [리뷰 제목(한 줄 요약)]을 데코레이션 문양과 함께 작성해주세요 (예: 🎬 [제목] - ...).
2. 감상평 본문에는 입력받은 3가지 키워드(${validKeywords.map(k => `"${k}"`).join(", ")})가 최소 1회씩 그대로 포함되어야 하며, 전체 흐름과 주제가 아주 어울리고 세련되게 작성되어야 합니다.
3. 길이는 공백 포함 400자 내외로 너무 길지 않고 정갈하되 가독성 높게 마크다운(Markdown) 줄바꿈을 포함하여 작성해주세요.
4. 신뢰감이 가고 기분 좋은 한국어 존댓말체(~합니다, ~입니다, ~해요)를 사용해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    const reviewText = response.text || "감상평이 생성되지 않았습니다.";
    res.json({ review: reviewText });
  } catch (error: any) {
    console.error("[Gemini API Error] Review generation failed:", error);
    res.status(500).json({ 
      error: error.message || "Gemini AI 모델 통신 과정 중 예기치 못한 에러가 발생했습니다." 
    });
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
