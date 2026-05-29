import { useState, useEffect } from "react";
import { MovieInfo, MovieInfoResponse } from "../types";
import { 
  Film, Clock, Calendar, Globe, Tag, Shield, 
  Users, Building, Loader2, Info, X, Trophy
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
  const [activeTab, setActiveTab ] = useState<"info" | "cast" | "company">("info");

  useEffect(() => {
    if (!movieCd) {
      setMovieInfo(null);
      return;
    }

    const fetchMovieDetail = async () => {
      setLoading(true);
      setError(null);
      setActiveTab("info");
      try {
        const response = await fetch(`/api/movieinfo?movieCd=${movieCd}`);
        if (!response.ok) {
          throw new Error("영화 상세 정보를 가져오는 데 실패했습니다.");
        }
        const data: MovieInfoResponse = await response.json();
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
