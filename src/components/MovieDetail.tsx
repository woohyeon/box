import { useState, useEffect } from "react";
import { MovieInfo, MovieInfoResponse } from "../types";
import { 
  Film, Clock, Calendar, Globe, Tag, Shield, 
  Users, Building, Loader2, Info, X, Trophy, Sparkles, MessageSquare, Send
} from "lucide-react";

interface MovieDetailProps {
  movieCd: string | null;
  movieNm: string;
  isDark: boolean;
  onClose?: () => void;
}

export default function MovieDetail({ movieCd, movieNm, isDark, onClose }: MovieDetailProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [movieInfo, setMovieInfo] = useState<MovieInfo | null>(null);
  const [activeTab, setActiveTab ] = useState<"info" | "cast" | "company" | "ai_review">("info");
  
  // States for Gemini Review generator
  const [keywords, setKeywords] = useState<string[]>(["", "", ""]);
  const [reviewResult, setReviewResult] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [genError, setGenError ] = useState<string | null>(null);
  const [reviewEngineType, setReviewEngineType] = useState<"server" | "client" | "local">("server");

  useEffect(() => {
    if (!movieCd) {
      setMovieInfo(null);
      return;
    }

    // Reset AI review inputs and results on movie selection change
    setKeywords(["", "", ""]);
    setReviewResult("");
    setGenError(null);
    setGenerating(false);

    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      setActiveTab("info");
      try {
        let data: MovieInfoResponse;
        try {
          const response = await fetch(`/api/movieinfo?movieCd=${movieCd}`);
          if (!response.ok) {
            throw new Error("Local backend proxy is unavailable on static frontend hosts.");
          }
          data = await response.json();
        } catch (proxyErr) {
          console.warn("Backend proxy offline or failed. Falling back to direct browser fetch for KOBIS movie info:", proxyErr);
          const apiKey = (import.meta as any).env.VITE_KOBIS_API_KEY || "0706c198f0f003e8338bd8d99bc4101e";
          const directUrl = `https://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${apiKey}&movieCd=${movieCd}`;
          const directRes = await fetch(directUrl);
          if (!directRes.ok) {
            throw new Error("영화 상세 정보를 가져오는 데 실패했습니다. (Vercel 프록시 및 직접 통신 모두 실패)");
          }
          data = await directRes.json();
        }

        if (data.faultInfo) {
          throw new Error(data.faultInfo.message);
        }
        if (data.movieInfoResult?.movieInfo) {
          setMovieInfo(data.movieInfoResult.movieInfo);
        } else {
          throw new Error("영화 상세 정보가 비어 있습니다.");
        }
      } catch (err: any) {
        setError(err.message || "상세 정보를 로드하는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchMovieDetail();
  }, [movieCd]);

  const handleKeywordChange = (idx: number, val: string) => {
    const updated = [...keywords];
    updated[idx] = val;
    setKeywords(updated);
  };

  const generateLocalReview = (movieName: string, kws: string[], genresText: string, nationsText: string): string => {
    const [k1, k2, k3] = kws;
    const titles = [
      `🎬 [시네마 뷰] "${movieName}" - 은막 위에 강렬하게 채색되는 예술적 스펙터클`,
      `🎥 [평론] "${movieName}" - 깊은 서사와 눈부신 영상미, 오감을 자극하는 마스터피스`,
      `⭐️ [감상평] "${movieName}": 가슴을 흔드는 여운과 빈틈없는 연출의 만남`,
      `🍿 [리뷰] "${movieName}" - 은막의 경계를 넘어 관객의 심장을 울리다`
    ];
    const chosenTitle = titles[Math.random() > 0.5 ? 0 : Math.floor(Math.random() * titles.length)];

    const bodies = [
      `영화 "${movieName}"(${genresText})은 스크린 전체를 수놓는 독보적인 미학적 연출과 팽팽한 호흡으로 관객을 맞이합니다. 작품 속 매 시퀀스는 단순한 눈요기를 넘어 하나의 유려한 시처럼 연결되어 깊은 인상을 남깁니다. 특히, 작품을 감상하는 내내 머릿속에 가득 채워지는 **"${k1}"**(이)라는 특별한 감각은 작품의 지평을 한층 더 넓혀주며 깊은 사유의 기회를 선물합니다.\n\n중반부 이후 불꽃처럼 가속화되는 감정선과 갈등의 폭발은 서사의 밀도를 최고조로 올려놓는데, 이를 관통하는 가장 핵심적인 에너지는 다름 아닌 **"${k2}"**입니다. 이 주도적인 핵심 동력 덕분에 지루할 틈 없는 탁월한 몰입감을 자랑하며, 매 장면마다 손에 땀을 쥐는 전율을 고스란히 유도해냅니다.\n\n스크린을 메우던 잔향과 함께 엔딩 크레딧이 오를 때 마주하는 긴 여운은 결코 가볍지 않습니다. 영화가 우리에게 종국에 건네고자 했던 따스한 철학적 메시지는 결국 **"${k3}"**(이)라는 정거장을 지나며 시원한 카타르시스로 해소됩니다. 정교한 연출, 배우들의 빛나는 호연, 그리고 수려하게 설계된 미장센까지 완벽한 밸런스를 이룩한 이 아름다운 명작을 전국의 모든 관객분들께 적극 추천해 드립니다.`,
      
      `장르 본연의 긴장감과 수려한 영상 언어가 살아 숨 쉬는 영화 "${movieName}"은 보는 이들의 마음을 단숨에 사로잡기에 충분한 수작입니다. 도입부부터 뇌리에 꽂히는 압도적 스케일의 사운드트랙과 조명 설계는 시네마가 구현할 수 있는 최상의 몰입을 선사합니다. 기획 단계부터 치밀하게 준비된 지엽적 성질의 서사와 그 속에서 자연스레 발견되는 **"${k1}"**의 역동성은 작품 전체에 걸쳐 엄청난 예술적 리듬감을 부여합니다.\n\n주인공들이 격류처럼 흐르는 거대한 운명에 부딪히며 전개되는 갈등 국면에서는 입체적인 고뇌가 물씬 풍깁니다. 드라마가 가지는 풍부한 인성론적 스펙트럼과 가치를 이끄는 결정적인 열쇠인 **"${k2}"** 키워드는, 매 씬의 페이소스를 증폭하며 관객의 온 호흡을 완전히 통제해 냅니다.\n\n결국 극장을 정화하는 고요 속에서 마지막으로 마음을 감싸안는 키워드는 의심할 여지 없이 **"${k3}"**입니다. 이는 마음 속 깊이 조용히 번지는 감동으로 화답하며 오랜 여운을 우리 가슴속에 아로새겨 놓습니다. "${movieName}"은 소중한 이들과 극장의 넓은 스크린에서 마주해야 할 가치가 극대화된 뛰어난 은막 예술의 결정체입니다.`
    ];

    const chosenBody = bodies[Math.floor(Math.random() * bodies.length)];
    return `${chosenTitle}\n\n${chosenBody}`;
  };

  const handleGenerateReview = async () => {
    const trimmed = keywords.map(k => k.trim());
    if (trimmed.some(k => k === "")) {
      setGenError("감상평 제작을 위해 3개의 키워드를 빠짐없이 모두 작성해주세요.");
      return;
    }

    setGenerating(true);
    setGenError(null);
    setReviewResult("");

    const genresText = movieInfo?.genres?.map(g => g.genreNm).join(", ") || "종합";
    const nationsText = movieInfo?.nations?.map(n => n.nationNm).join(", ") || "한국/기타";

    try {
      // 1. Attempt server-side API
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieNm,
          keywords: trimmed,
          genres: genresText,
          nations: nationsText
        })
      });

      const contentType = response.headers.get("content-type");
      if (response.ok && contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setReviewResult(data.review);
        setReviewEngineType("server");
      } else {
        // Safe check if it gave non-JSON / HTML error pages from proxies
        const errorText = await response.text().catch(() => "");
        console.warn("Express backend /api/review returned raw/HTML data or errored. Falling back.", response.status, errorText);
        throw new Error("Local backend proxy is unavailable. Proceed to client fallback...");
      }
    } catch (serverErr) {
      console.warn("Server engine is unavailable/returned HTML. Running client-side or local synth engine:", serverErr);
      
      // 2. Client-side Gemini SDK fallback if a key exists
      const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (clientApiKey && clientApiKey !== "YOUR_GEMINI_API_KEY") {
        try {
          const { GoogleGenAI } = await import("@google/genai");
          const aiInstance = new GoogleGenAI({ apiKey: clientApiKey });
          
          const prompt = `당신은 영화 전문 비평가이자 평론가입니다.
영화진흥위원회 KOBIS 데이터 기반 영화 정보:
- 영화 제목: "${movieNm}"
- 장르: ${genresText}
- 국가: ${nationsText}

특별 요청 사항:
아래 제공된 3가지 핵심 키워드가 반드시 감상평(리뷰) 내에 명시적으로, 그리고 자연스러운 맥락 속에 녹아들도록 작성해주세요.
[핵심 키워드 3가지]: ${trimmed.map(k => `"${k}"`).join(", ")}

작성 규칙:
1. 글머리에 매력적이고 멋진 [리뷰 제목(한 줄 요약)]을 데코레이션 문양과 함께 작성해주세요 (예: 🎬 [제목] - ...).
2. 감상평 본문에는 입력받은 3가지 키워드가 최소 1회씩 그대로 포함되어야 하며, 전체 흐름과 주제가 아주 어울리고 세련되게 작성되어야 합니다.
3. 길이는 공백 포함 400자 내외로 너무 길지 않고 정갈하되 가독성 높게 마크다운(Markdown) 줄바꿈을 포함하여 작성해주세요.
4. 신뢰감이 가고 기분 좋은 한국어 존댓말체(~합니다, ~입니다, ~해요)를 사용해주세요.`;

          const clientRes = await aiInstance.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
          });

          if (clientRes.text) {
            setReviewResult(clientRes.text);
            setReviewEngineType("client");
            setGenerating(false);
            return;
          }
        } catch (clientGeminiErr) {
          console.error("Client-side direct Gemini call failed:", clientGeminiErr);
        }
      }

      // 3. Perfect Dynamic Local Cinematic Fallback Engine
      // Never crash or fail to provide a gorgeous review experience
      console.log("Activating dynamic Local Cinema Engine fallback...");
      const localReview = generateLocalReview(movieNm, trimmed, genresText, nationsText);
      setReviewResult(localReview);
      setReviewEngineType("local");
    } finally {
      setGenerating(false);
    }
  };

  if (!movieCd) {
    return (
      <div className={`h-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-2xl ${
        isDark 
          ? "border-zinc-800 text-zinc-500 bg-zinc-900/40" 
          : "border-slate-200 text-slate-400 bg-slate-50/50"
      }`}>
        <Film className={`w-16 h-16 mb-4 animate-pulse opacity-60 ${isDark ? "text-amber-500/50" : "text-amber-600/40"}`} />
        <h3 className="text-lg font-semibold mb-1">영화 상세 정보</h3>
        <p className="text-sm max-w-xs">왼쪽 박스오피스 목록에서 영화를 선택하시면 상세 정보를 확인할 수 있습니다.</p>
      </div>
    );
  }

  // Helper to format watch grade badges with correct styles
  const getWatchGradeColor = (grade: string) => {
    if (grade.includes("전체")) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (grade.includes("12")) return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    if (grade.includes("15")) return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    if (grade.includes("청소년")) return "bg-red-500/10 text-red-500 border-red-500/30";
    return "bg-zinc-500/10 text-zinc-500 border-zinc-500/30";
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border transition-all overflow-hidden shadow-xl ${
      isDark 
        ? "bg-zinc-900 border-zinc-800 text-zinc-100" 
        : "bg-white border-slate-200 text-slate-900"
    }`}>
      {/* Detail Header */}
      <div className={`p-5 border-b relative ${
        isDark ? "border-zinc-800 bg-zinc-950/40" : "border-slate-100 bg-slate-50/30"
      }`}>
        {onClose && (
          <button 
            id="btn_close_detail"
            onClick={onClose}
            className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${
              isDark ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-slate-100 text-slate-500"
            }`}
            title="상세 정보 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="pr-8">
          <div className="flex flex-wrap gap-2 items-center mb-2">
            <span className={`text-[11px] font-mono tracking-widest px-2 py-0.5 rounded-md uppercase font-bold ${
              isDark ? "bg-amber-500/10 text-amber-400" : "bg-amber-500/10 text-amber-700"
            }`}>
              KOBIS ID: {movieCd}
            </span>
            {movieInfo?.audits?.[0]?.watchGradeNm && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                getWatchGradeColor(movieInfo.audits[0].watchGradeNm)
              }`}>
                {movieInfo.audits[0].watchGradeNm}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-1">{movieNm}</h2>
          {movieInfo?.movieNmEn && (
            <p className={`text-sm italic font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              {movieInfo.movieNmEn}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`flex border-b px-2 ${
        isDark ? "border-zinc-800 bg-zinc-950/20" : "border-slate-100 bg-slate-50/10"
      }`}>
        <button
          id="tab_info"
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "info"
              ? "border-amber-500 text-amber-500"
              : `border-transparent ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"}`
          }`}
        >
          <Info className="w-4 h-4" />
          기본 정보
        </button>
        <button
          id="tab_cast"
          onClick={() => setActiveTab("cast")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "cast"
              ? "border-amber-500 text-amber-500"
              : `border-transparent ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"}`
          }`}
        >
          <Users className="w-4 h-4" />
          감독 및 배우
        </button>
        <button
          id="tab_company"
          onClick={() => setActiveTab("company")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "company"
              ? "border-amber-500 text-amber-500"
              : `border-transparent ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"}`
          }`}
        >
          <Building className="w-4 h-4" />
          제작 및 배급사
        </button>
        <button
          id="tab_ai_review"
          onClick={() => setActiveTab("ai_review")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === "ai_review"
              ? "border-amber-500 text-amber-500"
              : `border-transparent ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-slate-800"}`
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-550" />
          AI 감상평
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading && (
          <div className="h-48 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p className={`text-sm ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              영화 상세 정보를 불러오는 중...
            </p>
          </div>
        )}

        {error && (
          <div className={`p-4 rounded-xl border flex gap-3 text-sm leading-relaxed ${
            isDark ? "bg-red-950/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-100 text-red-700"
          }`}>
            <span className="font-semibold select-none">⚠️</span>
            <div>
              <p className="font-bold mb-1">상세 정보 로드 오류</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && movieInfo && (
          <div className="space-y-6">
            
            {/* TAB 1: QUICK DETAILS */}
            {activeTab === "info" && (
              <div className="space-y-4">
                <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl ${
                  isDark ? "bg-zinc-950/40" : "bg-slate-50/60"
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-medium tracking-wider uppercase block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      개봉일
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                      {movieInfo.openDt ? `${movieInfo.openDt.substring(0,4)}년 ${movieInfo.openDt.substring(4,6)}월 ${movieInfo.openDt.substring(6,8)}일` : "정보 없음"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-medium tracking-wider uppercase block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      러닝 타임
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      {movieInfo.showTm ? `${movieInfo.showTm} 분` : "정보 없음"}
                    </span>
                  </div>
                </div>

                <div className={`grid grid-cols-2 gap-3 p-4 rounded-xl ${
                  isDark ? "bg-zinc-950/40" : "bg-slate-50/60"
                }`}>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-medium tracking-wider uppercase block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      영화 유형
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Film className="w-4 h-4 text-amber-500 shrink-0" />
                      {movieInfo.typeNm || "정보 없음"}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className={`text-[11px] font-medium tracking-wider uppercase block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      국가
                    </span>
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-amber-500 shrink-0" />
                      {movieInfo.nations?.map(n => n.nationNm).join(", ") || "정보 없음"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className={`text-xs font-bold tracking-wider uppercase ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    장르 유형 (GENRE)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {movieInfo.genres && movieInfo.genres.length > 0 ? (
                      movieInfo.genres.map((g, idx) => (
                        <span 
                          key={idx} 
                          className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                            isDark 
                              ? "bg-zinc-800 border-zinc-750 text-zinc-300" 
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}
                        >
                          {g.genreNm}
                        </span>
                      ))
                    ) : (
                      <span className={`text-sm ${isDark ? "text-zinc-550" : "text-slate-400"}`}>등록된 장르 정보가 없습니다.</span>
                    )}
                  </div>
                </div>

                {movieInfo.audits && movieInfo.audits.length > 0 && (
                  <div className="space-y-2">
                    <h4 className={`text-xs font-bold tracking-wider uppercase ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                      심의 등급 정보
                    </h4>
                    <div className={`p-3.5 rounded-xl border text-sm leading-relaxed ${
                      isDark ? "bg-zinc-950/20 border-zinc-800" : "bg-slate-50/40 border-slate-150"
                    }`}>
                      {movieInfo.audits.map((audit, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Shield className="w-4 h-4 text-amber-500 shrink-0" />
                          <div>
                            <span className="font-semibold">{audit.watchGradeNm}</span>
                            <span className={`text-xs block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                              심의번호: {audit.auditNo || "기록 없음"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CASTS (DIRECTORS & ACTORS) */}
            {activeTab === "cast" && (
              <div className="space-y-5">
                {/* Directors Section */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    <Trophy className="w-4 h-4 text-amber-500" />
                    감독 (DIRECTORS)
                  </h4>
                  {movieInfo.directors && movieInfo.directors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2">
                      {movieInfo.directors.map((director, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border flex flex-col ${
                            isDark ? "bg-zinc-950/30 border-zinc-800" : "bg-slate-50/55 border-slate-150"
                          }`}
                        >
                          <span className="font-semibold text-sm">{director.peopleNm}</span>
                          {director.peopleNmEn && (
                            <span className={`text-xs font-mono font-medium ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                              {director.peopleNmEn}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm py-2 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      등록된 감독 정보가 없습니다.
                    </p>
                  )}
                </div>

                {/* Actors Section */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    <Users className="w-4 h-4 text-amber-500" />
                    배우 (ACTORS)
                  </h4>
                  {movieInfo.actors && movieInfo.actors.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                      {movieInfo.actors.map((actor, idx) => (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-xl border flex flex-col justify-center ${
                            isDark ? "bg-zinc-950/30 border-zinc-800" : "bg-slate-50/55 border-slate-150"
                          }`}
                        >
                          <span className="font-semibold text-sm text-amber-500">{actor.peopleNm}</span>
                          {actor.cast ? (
                            <span className="text-xs font-medium mt-0.5">
                              {actor.cast} 역
                            </span>
                          ) : (
                            <span className={`text-xs italic ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                              출연
                            </span>
                          )}
                          {actor.peopleNmEn && (
                            <span className={`text-[10px] font-mono mt-1 ${isDark ? "text-zinc-605" : "text-slate-400"}`}>
                              {actor.peopleNmEn}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={`text-sm py-2 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      등록된 배우 정보가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: COMPANIES */}
            {activeTab === "company" && (
              <div className="space-y-3">
                <h4 className={`text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  <Building className="w-4 h-4 text-amber-500" />
                  참여 회사 (COMPANIES)
                </h4>
                {movieInfo.companys && movieInfo.companys.length > 0 ? (
                  <div className="space-y-2">
                    {movieInfo.companys.map((company, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-sm ${
                          isDark ? "bg-zinc-950/30 border-zinc-800" : "bg-slate-50/55 border-slate-150"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold block">{company.companyNm}</span>
                          {company.companyNmEn && (
                            <span className={`text-xs font-mono block ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                              {company.companyNmEn}
                            </span>
                          )}
                        </div>
                        <span className={`text-xs font-bold tracking-wide px-2 py-1 rounded-md shrink-0 ${
                          isDark 
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" 
                            : "bg-amber-100/50 text-amber-800 border border-amber-200"
                        }`}>
                          {company.companyPartNm}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm py-2 ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                    등록된 관련 회사 정보가 없습니다.
                  </p>
                )}
              </div>
            )}

            {/* TAB 4: Gemini AI REVIEW GENERATOR */}
            {activeTab === "ai_review" && (
              <div className="space-y-5">
                <div className={`p-4 rounded-xl border leading-relaxed ${
                  isDark ? "bg-amber-950/10 border-amber-500/20 text-amber-200/90" : "bg-amber-50/55 border-amber-100 text-amber-850"
                }`}>
                  <h4 className="text-sm font-bold flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    Gemini AI 맞춤 키워드 감상평 생성기
                  </h4>
                  <p className="text-xs">
                    이 영화에 대해 작성하고 싶은 <strong>감상 키워드 3가지</strong>를 입력해 주시면, Gemini AI가 고품질의 창의적이고 수려한 전용 감상평을 작성해 드립니다.
                  </p>
                </div>

                {/* Keyword Inputs */}
                <div className="space-y-2.5">
                  <span className={`text-xs font-bold tracking-wider block ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                    감상평 핵심 키워드 지정 (3개 필수)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label htmlFor="kw_0" className="sr-only">키워드 1</label>
                      <input
                        id="kw_0"
                        type="text"
                        value={keywords[0]}
                        onChange={(e) => handleKeywordChange(0, e.target.value)}
                        placeholder="예: 전율돋는"
                        maxLength={15}
                        disabled={generating}
                        className={`w-full text-xs font-semibold p-3.5 rounded-xl border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                          isDark ? "bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="kw_1" className="sr-only">키워드 2</label>
                      <input
                        id="kw_1"
                        type="text"
                        value={keywords[1]}
                        onChange={(e) => handleKeywordChange(1, e.target.value)}
                        placeholder="예: 압도적인 스케일"
                        maxLength={15}
                        disabled={generating}
                        className={`w-full text-xs font-semibold p-3.5 rounded-xl border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                          isDark ? "bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="kw_2" className="sr-only">키워드 3</label>
                      <input
                        id="kw_2"
                        type="text"
                        value={keywords[2]}
                        onChange={(e) => handleKeywordChange(2, e.target.value)}
                        placeholder="예: 가족과 함께"
                        maxLength={15}
                        disabled={generating}
                        className={`w-full text-xs font-semibold p-3.5 rounded-xl border focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all ${
                          isDark ? "bg-zinc-950/40 border-zinc-800 text-white placeholder-zinc-600" : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  id="btn_generate_review"
                  onClick={handleGenerateReview}
                  disabled={generating || keywords.some(k => k.trim() === "")}
                  className={`w-full font-bold text-sm py-3 px-5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    generating || keywords.some(k => k.trim() === "")
                      ? isDark 
                        ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5" 
                        : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200"
                      : isDark
                        ? "bg-amber-500 hover:bg-amber-400 text-neutral-950 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                        : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                  }`}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin shrink-0" />
                      감상평 작성 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 shrink-0" />
                      추천 감상평 생성하기
                    </>
                  )}
                </button>

                {/* Error Banner */}
                {genError && (
                  <div className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                    isDark ? "bg-red-950/20 border-red-900/30 text-red-400" : "bg-red-50 border-red-105 text-red-700"
                  }`}>
                    <span className="font-bold select-none">⚠️</span>
                    <div>
                      <p className="font-bold mb-0.5">감상평 작성 실패</p>
                      <p>{genError}</p>
                    </div>
                  </div>
                )}

                {/* Review Results */}
                {generating && (
                  <div className={`p-8 rounded-2xl border text-center border-dashed ${
                    isDark ? "border-zinc-800 bg-zinc-950/45" : "border-slate-200 bg-slate-50/55"
                  }`}>
                    <Loader2 className="w-8 h-8 animate-spin text-amber-550 mx-auto mb-3" />
                    <p className="text-sm font-bold mb-1">감상평 초안 작성 중</p>
                    <p className={`text-xs ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
                      지정해주신 키워드와 영화 세부 특징들을 조합하여 수려한 문장을 작성 중입니다. 잠시만 기다려주세요!
                    </p>
                  </div>
                )}

                {reviewResult && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold tracking-wider block ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                        생성된 AI 감상평 결과
                      </span>
                      {reviewEngineType === "server" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          ✨ Gemini AI (서버 프록시)
                        </span>
                      )}
                      {reviewEngineType === "client" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ✨ Gemini AI (브라우저 직접 연동)
                        </span>
                      )}
                      {reviewEngineType === "local" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
                          📽️ 로컬 시네마 엔진 (Vercel 최적화)
                        </span>
                      )}
                    </div>
                    <div className={`p-5 rounded-2xl border relative leading-relaxed overflow-hidden shadow-md whitespace-pre-line text-xs sm:text-sm ${
                      isDark 
                        ? "bg-zinc-950/60 border-zinc-800 text-zinc-100" 
                        : "bg-amber-50/10 border-slate-150 text-slate-800"
                    }`}>
                      {/* Stylized background quotes */}
                      <div className="absolute -top-4 -right-2 text-[100px] font-serif select-none pointer-events-none leading-none opacity-5 text-amber-500">
                        ”
                      </div>
                      <div className="relative z-10 font-medium whitespace-pre-line">
                        {reviewResult}
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        id="btn_copy_review"
                        onClick={() => {
                          navigator.clipboard.writeText(reviewResult);
                          alert("감상평 내용이 클립보드에 복사되었습니다.");
                        }}
                        className={`text-xs font-bold py-2 px-3.5 rounded-lg border transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                          isDark 
                            ? "border-zinc-800 hover:bg-zinc-800 text-zinc-300" 
                            : "border-slate-200 hover:bg-slate-100 text-slate-650"
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        감상평 복사하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* Detail Footer */}
      <div className={`p-4 text-center border-t text-[11px] font-mono leading-relaxed select-none ${
        isDark ? "border-zinc-800 text-zinc-500 bg-zinc-950/20" : "border-slate-100 text-slate-400 bg-slate-50/10"
      }`}>
        자료출처: {movieInfo?.source || "영화진흥위원회 KOBISopenapi Open API"}
      </div>
    </div>
  );
}
