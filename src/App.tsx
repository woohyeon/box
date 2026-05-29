import { useState, useEffect, ChangeEvent } from "react";
import { motion } from "motion/react";
import { 
  Film, Calendar, TrendingUp, HelpCircle, 
  Moon, Sun, Loader2, Sparkles, AlertCircle, RefreshCw, ChevronRight, Award
} from "lucide-react";
import { BoxOfficeMovie, BoxOfficeResponse } from "./types";
import MovieDetail from "./components/MovieDetail";

// Get yesterday's date in YYYY-MM-DD
function getYesterdayYmd(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function App() {
  const yesterday = getYesterdayYmd();
  const [selectedDate, setSelectedDate] = useState<string>(yesterday);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [boxOfficeList, setBoxOfficeList] = useState<BoxOfficeMovie[]>([]);
  const [selectedMovieCd, setSelectedMovieCd] = useState<string | null>(null);
  const [selectedMovieNm, setSelectedMovieNm] = useState<string>("");
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : true; // Default to elegant Dark theme
  });

  // Extract year, month, and day strings from selection date
  const [yearStr, monthStr, dayStr] = selectedDate.split("-");

  // Build a validated date string, strictly capping at yesterday as the absolute maximum.
  const sanitizeAndBuildDate = (year: string, month: string, day: string): string => {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);

    const maxLimit = new Date();
    maxLimit.setDate(maxLimit.getDate() - 1); // Yesterday is maximum

    const target = new Date(y, m - 1, d);

    // If invalid target combination or future date, auto-cap to yesterday
    if (isNaN(target.getTime()) || target > maxLimit) {
      const cy = maxLimit.getFullYear();
      const cm = String(maxLimit.getMonth() + 1).padStart(2, "0");
      const cd = String(maxLimit.getDate()).padStart(2, "0");
      return `${cy}-${cm}-${cd}`;
    }

    // Otherwise, ensure correct month and day bounds
    const maxDaysInMonth = new Date(y, m, 0).getDate();
    const finalDay = Math.min(Math.max(d, 1), maxDaysInMonth);
    const finalMonth = String(m).padStart(2, "0");
    const finalDayStr = String(finalDay).padStart(2, "0");

    return `${y}-${finalMonth}-${finalDayStr}`;
  };

  const handleDropdownChange = (part: "Y" | "M" | "D", val: string) => {
    let nextY = yearStr;
    let nextM = monthStr;
    let nextD = dayStr;

    if (part === "Y") nextY = val;
    if (part === "M") nextM = val;
    if (part === "D") nextD = val;

    const updated = sanitizeAndBuildDate(nextY, nextM, nextD);
    setSelectedDate(updated);
  };

  const applyPresetDate = (daysAgo: number | "year") => {
    const d = new Date();
    if (daysAgo === "year") {
      d.setFullYear(d.getFullYear() - 1);
    } else {
      d.setDate(d.getDate() - daysAgo);
    }

    const yesterdayLimit = new Date();
    yesterdayLimit.setDate(yesterdayLimit.getDate() - 1);

    let target = d;
    if (target > yesterdayLimit) {
      target = yesterdayLimit;
    }
    const minLimit = new Date("2004-01-01");
    if (target < minLimit) {
      target = minLimit;
    }

    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
  };

  // Persist light/dark theme preference
  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  const fetchBoxOffice = async (dateStr: string) => {
    setLoading(true);
    setError(null);
    const targetDt = dateStr.replace(/-/g, "");
    
    try {
      let data: BoxOfficeResponse;
      try {
        const response = await fetch(`/api/boxoffice?date=${targetDt}`);
        if (!response.ok) {
          throw new Error("Local backend proxy is unavailable on static frontend hosts.");
        }
        data = await response.json();
      } catch (proxyErr) {
        console.warn("Backend proxy offline or failed. Falling back to direct browser fetch for KOBIS daily box office:", proxyErr);
        const apiKey = (import.meta as any).env.VITE_KOBIS_API_KEY || "0706c198f0f003e8338bd8d99bc4101e";
        const directUrl = `https://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${apiKey}&targetDt=${targetDt}`;
        const directRes = await fetch(directUrl);
        if (!directRes.ok) {
          throw new Error("KOBIS 일일 박스오피스 데이터를 가져오는 데 실패했습니다. (Vercel 프록시 및 직접 통신 모두 실패)");
        }
        data = await directRes.json();
      }
      
      if (data.faultInfo) {
        throw new Error(data.faultInfo.message);
      }

      if (data.boxOfficeResult?.dailyBoxOfficeList) {
        setBoxOfficeList(data.boxOfficeResult.dailyBoxOfficeList);
        // Auto-select the first movie in the list on desktop by default
        if (data.boxOfficeResult.dailyBoxOfficeList.length > 0) {
          setSelectedMovieCd(data.boxOfficeResult.dailyBoxOfficeList[0].movieCd);
          setSelectedMovieNm(data.boxOfficeResult.dailyBoxOfficeList[0].movieNm);
        } else {
          setSelectedMovieCd(null);
          setSelectedMovieNm("");
        }
      } else {
        setBoxOfficeList([]);
        setSelectedMovieCd(null);
        setSelectedMovieNm("");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "데이터를 조회하는 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // Refetch when selected date changes
  useEffect(() => {
    fetchBoxOffice(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const dateInput = e.target.value;
    setSelectedDate(dateInput);
  };

  const handleMovieSelect = (movie: BoxOfficeMovie) => {
    setSelectedMovieCd(movie.movieCd);
    setSelectedMovieNm(movie.movieNm);
    
    // Smooth scroll to container top or side on mobile
    if (window.innerWidth < 1024) {
      const el = document.getElementById("mobile_details_anchor");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Human numerals helper (e.g. 1500000 -> 150만)
  const formatAudiences = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
    if (num >= 10000) {
      const tenThousand = num / 10000;
      return `${tenThousand.toLocaleString(undefined, { maximumFractionDigits: 1 })}만 명`;
    }
    return `${num.toLocaleString()}명`;
  };

  // KRW Currency format (₩10,230,000)
  const formatCurrency = (value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return value;
    return `₩${num.toLocaleString()}`;
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-350 ${
      isDark 
        ? "bg-[#020202] text-slate-200" 
        : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* Decorative gradient glowing spots in Dark Mode */}
      {isDark && (
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_at_70%_30%,#3a0e0e_0%,transparent_60%)] opacity-45 pointer-events-none select-none" />
      )}

      {/* Main Navigation Row */}
      <header className={`border-b backdrop-blur-md sticky top-0 z-40 transition-colors ${
        isDark ? "bg-[#0a0a0a]/80 border-white/5" : "bg-white/90 border-slate-200"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)]">
              <span className="text-xl font-black italic text-white">K</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tighter text-white">
                CINEMA <span className={isDark ? "text-red-500" : "text-red-600"}>FOCUS</span>
              </h1>
              <p className={`text-[10px] uppercase font-bold tracking-widest ${isDark ? "text-red-500" : "text-red-600"}`}>
                Daily Box Office Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              id="theme_toggle"
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                isDark 
                  ? "border-white/10 bg-white/5 text-red-500 hover:bg-white/10" 
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm"
              }`}
              title={isDark ? "라이트 모드 보기" : "다크 모드 보기"}
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Date Selector Banner Panel */}
        <section className={`mb-8 p-5 sm:p-6 rounded-2xl border transition-all ${
          isDark 
            ? "bg-[#070707] border-white/5 shadow-2xl" 
            : "bg-white border-slate-200 shadow-sm"
        }`}>
          <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold flex items-center gap-2 mb-1.5 tracking-tight">
                <Sparkles className="w-5 h-5 text-red-500 shrink-0" />
                영화관 일일 박스오피스 조회
              </h2>
              <p className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"} max-w-xl`}>
                조회하고자 하는 날짜를 선택하세요. 당일 박스오피스는 정산 진행 중이므로 <strong>오늘 이전 날짜(어제까지)</strong>만 조회가 가능합니다.
              </p>
              
              {/* Preset Quick Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider mr-1.5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  조회 지름길 :
                </span>
                <button
                  id="preset_yesterday"
                  onClick={() => applyPresetDate(1)}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-medium transition-all active:scale-95 cursor-pointer ${
                    selectedDate === yesterday 
                      ? "bg-red-600 border-red-600 text-white shadow-sm" 
                      : isDark ? "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  어제
                </button>
                <button
                  id="preset_3days"
                  onClick={() => applyPresetDate(3)}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-medium transition-all active:scale-95 cursor-pointer ${
                    // checks if current date is 3 days ago
                    selectedDate === (() => {
                      const d = new Date(); d.setDate(d.getDate() - 3);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    })()
                      ? "bg-red-600 border-red-600 text-white shadow-sm"
                      : isDark ? "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  3일 전
                </button>
                <button
                  id="preset_7days"
                  onClick={() => applyPresetDate(7)}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-medium transition-all active:scale-95 cursor-pointer ${
                    selectedDate === (() => {
                      const d = new Date(); d.setDate(d.getDate() - 7);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    })()
                      ? "bg-red-600 border-red-600 text-white shadow-sm"
                      : isDark ? "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  1주일 전
                </button>
                <button
                  id="preset_1month"
                  onClick={() => applyPresetDate(30)}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-medium transition-all active:scale-95 cursor-pointer ${
                    selectedDate === (() => {
                      const d = new Date(); d.setDate(d.getDate() - 30);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    })()
                      ? "bg-red-600 border-red-600 text-white shadow-sm"
                      : isDark ? "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  1개월 전
                </button>
                <button
                  id="preset_1year"
                  onClick={() => applyPresetDate("year")}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-medium transition-all active:scale-95 cursor-pointer ${
                    selectedDate === (() => {
                      const d = new Date(); d.setFullYear(d.getFullYear() - 1);
                      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                    })()
                      ? "bg-red-600 border-red-600 text-white shadow-sm"
                      : isDark ? "border-white/5 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  1년 전
                </button>
              </div>
            </div>

            {/* Date Selection Control Blocks */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full xl:w-auto self-stretch xl:self-start">
              
              {/* Dropdowns list row with year month day */}
              <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
                {/* Year Selection Dropdown */}
                <div className="flex-1 sm:flex-initial min-w-[90px]">
                  <label htmlFor="yy_select" className={`text-[10px] font-bold block mb-1 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>년도</label>
                  <select
                    id="yy_select"
                    value={yearStr}
                    onChange={(e) => handleDropdownChange("Y", e.target.value)}
                    className={`w-full text-xs font-bold rounded-xl border p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer transition-all ${
                      isDark ? "bg-[#111] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    {(() => {
                      const list = [];
                      const minYear = 2004;
                      const maxYear = parseInt(yesterday.substring(0, 4), 10);
                      for (let y = maxYear; y >= minYear; y--) {
                        list.push(
                          <option key={y} value={y} className={isDark ? "bg-black text-white" : "bg-white text-black"}>
                            {y}년
                          </option>
                        );
                      }
                      return list;
                    })()}
                  </select>
                </div>

                {/* Month Selection Dropdown */}
                <div className="flex-1 sm:flex-initial min-w-[70px]">
                  <label htmlFor="mm_select" className={`text-[10px] font-bold block mb-1 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>월</label>
                  <select
                    id="mm_select"
                    value={monthStr}
                    onChange={(e) => handleDropdownChange("M", e.target.value)}
                    className={`w-full text-xs font-bold rounded-xl border p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer transition-all ${
                      isDark ? "bg-[#111] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    {(() => {
                      const list = [];
                      const selfYear = parseInt(yearStr, 10);
                      const maxYear = parseInt(yesterday.substring(0, 4), 10);
                      const maxM = selfYear === maxYear ? parseInt(yesterday.substring(5, 7), 10) : 12;
                      for (let m = 1; m <= maxM; m++) {
                        const mStr = String(m).padStart(2, "0");
                        list.push(
                          <option key={mStr} value={mStr} className={isDark ? "bg-black text-white" : "bg-white text-black"}>
                            {m}월
                          </option>
                        );
                      }
                      return list;
                    })()}
                  </select>
                </div>

                {/* Day Selection Dropdown */}
                <div className="flex-1 sm:flex-initial min-w-[70px]">
                  <label htmlFor="dd_select" className={`text-[10px] font-bold block mb-1 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>일</label>
                  <select
                    id="dd_select"
                    value={dayStr}
                    onChange={(e) => handleDropdownChange("D", e.target.value)}
                    className={`w-full text-xs font-bold rounded-xl border p-2 focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer transition-all ${
                      isDark ? "bg-[#111] border-white/15 text-white" : "bg-white border-slate-200 text-slate-900"
                    }`}
                  >
                    {(() => {
                      const list = [];
                      const selfYear = parseInt(yearStr, 10);
                      const selfMonth = parseInt(monthStr, 10);
                      const maxYear = parseInt(yesterday.substring(0, 4), 10);
                      const maxMonth = parseInt(yesterday.substring(5, 7), 10);
                      const daysInM = new Date(selfYear, selfMonth, 0).getDate();
                      
                      const maxD = (selfYear === maxYear && selfMonth === maxMonth) 
                        ? parseInt(yesterday.substring(8, 10), 10) 
                        : daysInM;

                      for (let d = 1; d <= maxD; d++) {
                        const dStr = String(d).padStart(2, "0");
                        list.push(
                          <option key={dStr} value={dStr} className={isDark ? "bg-black text-white" : "bg-white text-black"}>
                            {d}일
                          </option>
                        );
                      }
                      return list;
                    })()}
                  </select>
                </div>
              </div>

              {/* Standard HTML Datepicker Input for Sync & Visual calendar display option */}
              <div className="flex-1 sm:flex-initial">
                <label htmlFor="target_date_picker" className={`text-[10px] font-bold block mb-1 uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}>직접 달력 선택</label>
                <div className={`flex items-center px-3 py-1.5 rounded-xl border ${
                  isDark ? "bg-[#111] border-white/15" : "bg-white border-slate-200"
                }`}>
                  <Calendar className="w-4.5 h-4.5 text-red-500 shrink-0 mr-2" />
                  <input
                    id="target_date_picker"
                    type="date"
                    min="2004-01-01"
                    max={yesterday}
                    value={selectedDate}
                    onChange={handleDateChange}
                    className={`bg-transparent border-none text-xs font-bold tracking-tight focus:ring-0 outline-none cursor-pointer w-full text-center ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Loader/Error or Box Office Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT COLUMN: Box Office list (Takes 7 Cols on Desktop) */}
          <section className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-slate-400">
                <TrendingUp className="w-4.5 h-4.5 text-red-500" />
                Today's Ranking
              </h3>
              
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                isDark ? "bg-[#070707] text-slate-400 border border-white/5" : "bg-slate-100 text-slate-650"
              }`}>
                기준일: {selectedDate ? `${selectedDate.substring(0,4)}년 ${selectedDate.substring(5,7)}월 ${selectedDate.substring(8,10)}일` : ""}
              </span>
            </div>

            {/* State indicators */}
            {loading && (
              <div className={`p-16 text-center border rounded-2xl ${
                isDark ? "bg-[#070707] border-white/5" : "bg-white border-slate-150"
              }`}>
                <Loader2 className="w-10 h-10 animate-spin text-red-500 mx-auto mb-3" />
                <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-550"}`}>
                  해당 날짜의 박스오피스 정보를 불러오는 중입니다...
                </p>
              </div>
            )}

            {error && (
              <div className={`p-6 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center ${
                isDark ? "bg-red-950/10 border-red-900/30 text-red-400" : "bg-red-55 border-red-100 text-red-700"
              }`}>
                <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
                <h4 className="text-base font-bold mb-1">데이터 로드 실패</h4>
                <p className="text-xs mb-4 max-w-md">{error}</p>
                <button
                  id="btn_retry_fetch"
                  onClick={() => fetchBoxOffice(selectedDate)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  다시 시도하기
                </button>
              </div>
            )}

            {!loading && !error && boxOfficeList.length === 0 && (
              <div className={`p-16 text-center border-2 border-dashed rounded-2xl ${
                isDark ? "border-white/5 text-slate-500 bg-[#070707]" : "border-slate-200 text-slate-405"
              }`}>
                <HelpCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-bold mb-1">상영 기록이 없습니다</p>
                <p className="text-xs">이날은 일일 박스오피스 영화 집계 자료가 없거나 제공되지 않는 기간입니다.</p>
              </div>
            )}

            {/* List entries with custom staggered animations */}
            {!loading && !error && boxOfficeList.length > 0 && (
              <motion.div 
                className="space-y-3"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: { staggerChildren: 0.05 }
                  }
                }}
              >
                {boxOfficeList.map((movie) => {
                  const isSelected = selectedMovieCd === movie.movieCd;
                  const rankNum = parseInt(movie.rank, 10);
                  const rankInten = parseInt(movie.rankInten, 10);

                  return (
                    <motion.div
                      id={`movie_card_${movie.movieCd}`}
                      key={movie.movieCd}
                      variants={{
                        hidden: { y: 15, opacity: 0 },
                        visible: { y: 0, opacity: 1 }
                      }}
                      onClick={() => handleMovieSelect(movie)}
                      className={`group p-4 rounded-xl border cursor-pointer flex items-center justify-between gap-4 transition-all hover:-translate-y-0.5 active:translate-y-0 ${
                        isSelected 
                          ? isDark 
                            ? "bg-gradient-to-r from-red-600/20 to-transparent border-l-2 border-l-red-600 border-t-white/5 border-r-white/5 border-b-white/5 shadow-2xl"
                            : "bg-red-500/5 border-l-2 border-l-red-600 border-t-red-200 border-r-red-200 border-b-red-200 shadow-sm"
                          : isDark
                            ? "bg-[#070707] border-white/5 hover:border-white/10 hover:bg-white/5"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 shadow-xs"
                      }`}
                    >
                      {/* Left Block: Rank Visual Accent & Title */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Huge modern visual rank */}
                        <div className="flex flex-col items-center justify-center w-10 shrink-0">
                          <span className={`text-2xl font-black italic select-none leading-none ${
                            rankNum <= 3 
                              ? isDark ? "text-white font-extrabold" : "text-slate-800"
                              : isDark ? "text-slate-650" : "text-slate-400"
                          }`}>
                            {movie.rank.padStart(2, "0")}
                          </span>
                          
                          {/* Rank indicator changes */}
                          <div className="text-[10px] font-bold mt-1">
                            {movie.rankOldAndNew === "NEW" ? (
                              <span className="text-red-500 bg-red-500/10 px-1 rounded-sm text-[9px] uppercase font-semibold">NEW</span>
                            ) : rankInten > 0 ? (
                              <span className="text-green-400 flex items-center">▲{rankInten}</span>
                            ) : rankInten < 0 ? (
                              <span className="text-red-500 flex items-center">▼{Math.abs(rankInten)}</span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-600">0.0</span>
                            )}
                          </div>
                        </div>

                        {/* Title & Daily info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className={`text-base font-bold tracking-tight truncate leading-tight group-hover:text-red-500 transition-colors ${
                              isSelected ? isDark ? "text-white" : "text-red-650" : ""
                            }`}>
                              {movie.movieNm}
                            </h4>
                            {rankNum === 1 && (
                              <span className="flex items-center text-[9px] font-bold bg-red-600 rounded-md px-1 py-0.5 text-white gap-0.5 uppercase tracking-wide">
                                <Award className="w-2.5 h-2.5" /> 1위
                              </span>
                            )}
                          </div>

                          <div className={`text-xs mt-1 flex flex-wrap gap-x-3 items-center font-medium ${
                            isDark ? "text-slate-400" : "text-slate-550"
                          }`}>
                            <span className="inline-flex items-center gap-1">
                              오늘 관객: <strong className="font-semibold text-red-500">{formatAudiences(movie.audiCnt)}</strong>
                            </span>
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isDark ? "bg-white/10" : "bg-slate-200"}`}></span>
                            <span>
                              누적 관객: <strong>{formatAudiences(movie.audiAcc)}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Screen count details or chevron */}
                      <div className="text-right shrink-0 flex items-center gap-3.5">
                        <div className="hidden sm:block">
                          <span className={`text-[10px] tracking-wider uppercase block font-semibold ${
                            isDark ? "text-slate-500" : "text-slate-400"
                          }`}>
                            오늘 매출액
                          </span>
                          <span className="text-xs font-bold font-mono">
                            {formatCurrency(movie.salesAmt)}
                          </span>
                        </div>
                        <ChevronRight className={`w-5 h-5 transition-transform ${
                          isSelected 
                            ? "text-red-500 translate-x-0.5" 
                            : isDark ? "text-slate-600 group-hover:text-slate-400" : "text-slate-350 group-hover:text-slate-600"
                        }`} />
                      </div>

                    </motion.div>
                  );
                })}
              </motion.div>
            )}

          </section>

          {/* Wrapper for responsive micro-scrolling on Mobile view */}
          <div id="mobile_details_anchor" className="h-1 lg:hidden" />

          {/* RIGHT COLUMN: Movie details (Takes 5 Cols on Desktop) */}
          <section className="lg:col-span-5 h-full">
            <div className="lg:sticky lg:top-24 max-w-full">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-4 text-slate-400">
                <Film className="w-4.5 h-4.5 text-red-500" />
                영화 상세 정보 (SYNOPSIS DETAILS)
              </h3>
              
              <MovieDetail 
                movieCd={selectedMovieCd} 
                movieNm={selectedMovieNm} 
                isDark={isDark} 
                onClose={selectedMovieCd ? () => { setSelectedMovieCd(null); setSelectedMovieNm(""); } : undefined}
              />
            </div>
          </section>

        </div>
      </main>

      {/* Primary footer */}
      <footer className={`border-t transition-colors mt-20 ${
        isDark ? "border-white/5 bg-black text-slate-400" : "border-slate-200 bg-slate-100/50 text-slate-500"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-center md:text-left">
          
          <div className="space-y-1.5 animate-fade-in">
            <div className="font-extrabold tracking-tight text-neutral-800 dark:text-neutral-200 uppercase flex items-center justify-center md:justify-start gap-1">
              CINEMA <span className="text-red-500 font-black">FOCUS SYSTEM</span>
            </div>
            <p>본 플랫폼은 영화진흥위원회(KOBIS) OpenAPI 가이드라인을 준수하여 실시간 데이터를 중계 제공합니다.</p>
            <p>&copy; 2026 Cinema Focus. All rights reserved.</p>
          </div>

          <div className={`p-3 rounded-lg border max-w-sm ${
            isDark ? "border-white/5 bg-white/5" : "border-slate-200 bg-white"
          }`}>
            <p className="font-semibold text-red-500 mb-0.5">🔒 보안 가이드</p>
            <p className="leading-relaxed">KOBIS OpenAPI 인증키는 클라이언트에 노출되지 않고, 백엔드 프록시 서버 환경 변수를 통해 안전하게 중계 처리됩니다.</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
