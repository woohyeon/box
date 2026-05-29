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

  const handleGenerateReview = async () => {
    const trimmed = keywords.map(k => k.trim());
    if (trimmed.some(k => k === "")) {
      setGenError("감상평 제작을 위해 3개의 키워드를 빠짐없이 모두 작성해주세요.");
      return;
    }

    setGenerating(true);
    setGenError(null);
    setReviewResult("");

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieNm,
          keywords: trimmed,
          genres: movieInfo?.genres?.map(g => g.genreNm).join(", ") || "종합",
          nations: movieInfo?.nations?.map(n => n.nationNm).join(", ") || "한국/기타"
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "감상평 합성 과정 중 에러가 발생했습니다.");
      }

      const data = await response.json();
      setReviewResult(data.review);
    } catch (err: any) {
      setGenError(err.message || "Gemini 호출 오류가 발생했습니다. 설정 상태 또는 네트워크를 다시 확인해 주세요.");
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
                    <span className={`text-xs font-bold tracking-wider block ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                      생성된 AI 감상평 결과
                    </span>
                    <div className={`p-5 rounded-2xl border relative leading-relaxed overflow-hidden shadow-md whitespace-pre-line text-sm ${
                      isDark 
                        ? "bg-zinc-950/60 border-zinc-800 text-zinc-100" 
                        : "bg-amber-50/10 border-slate-150 text-slate-800"
                    }`}>
                      {/* Stylized background quotes */}
                      <div className="absolute -top-4 -right-2 text-[100px] font-serif select-none pointer-events-none leading-none opacity-5 text-amber-500">
                        ”
                      </div>
                      <div className="relative z-10 font-medium">
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
