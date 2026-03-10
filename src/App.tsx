/**
 * App.tsx - 메인 앱 컴포넌트
 *
 * - 데스크톱: 스마트폰 프레임 안에 앱 표시
 * - 모바일: 풀스크린
 * - 모달은 스크롤 영역 밖(프레임 레벨)에서 렌더링 → 프레임 내부에 고정
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe as GlobeIcon, TrendingUp, RefreshCw } from 'lucide-react';
import Globe from './components/Globe';
import TrendCard from './components/TrendCard';
import AISummaryModal from './components/AISummaryModal';
import { useTrends } from './hooks/useTrends';
import type { TrendItem } from './data/mockData';

// ===== 앱 스크롤 콘텐츠 (모달 제외) =====
interface AppContentProps {
  onSelect: (trend: TrendItem) => void;
}

function AppContent({ onSelect }: AppContentProps) {
  const { trends, displayDate, updatedAt, isLive, loading } = useTrends();

  // 갱신 시각을 "HH:MM 갱신" 형식으로 포맷
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' 갱신'
    : '';
  const [page, setPage] = useState(0);
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  const currentTrends = page === 0 ? trends.slice(0, 10) : trends.slice(10, 20);

  return (
    <div className="flex flex-col min-h-full pb-20">

      {/* 헤더 */}
      <header className="px-5 pt-4 pb-2 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold" style={{ background: 'linear-gradient(135deg, #fff 0%, #8b95a1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trend 24/7
          </h1>
          {loading ? (
            <div className="h-2.5 w-32 bg-white/10 rounded-full mt-1 animate-pulse" />
          ) : (
            <p className="text-[10px] text-grey-400 mt-0.5">{displayDate}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && updatedLabel && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-bold ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-grey-700/60 text-grey-400 border border-grey-600'
            }`}>
              <RefreshCw size={8} />
              {updatedLabel}
            </div>
          )}
          <div className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <GlobeIcon size={16} className="text-toss-blue" />
          </div>
        </div>
      </header>

      {/* 지구본 */}
      <section className="mt-1 mb-3">
        <Globe hoveredRank={hoveredRank} trends={trends} onMarkerClick={onSelect} />
        <div className="text-center mt-3">
          <span className="px-2.5 py-1 bg-toss-blue/10 border border-toss-blue/20 rounded-full text-[9px] text-toss-blue font-bold uppercase tracking-widest">
            <TrendingUp size={9} className="inline mr-1" />
            실시간 글로벌 트렌드
          </span>
          <h2 className="text-sm font-semibold mt-2 text-white/90">
            {page === 0 ? '🏆 글로벌 Top 1 ~ 10' : '🌐 글로벌 Top 11 ~ 20'}
          </h2>
        </div>
      </section>

      {/* 트렌드 카드 */}
      <main className="flex-1 px-3">
        {loading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass p-4 rounded-toss animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-7 h-5 bg-white/10 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-white/10 rounded w-1/3" />
                    <div className="h-3.5 bg-white/10 rounded w-2/3" />
                    <div className="h-2 bg-white/10 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: page === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: page === 0 ? 20 : -20 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
            >
              {currentTrends.map((trend) => (
                <TrendCard
                  key={trend.rank}
                  trend={trend}
                  onHover={setHoveredRank}
                  onClick={onSelect}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* 하단 페이지네이션 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-10">
        <button
          onClick={() => setPage(0)}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-all ${
            page === 0
              ? 'bg-toss-blue text-white shadow-[0_0_16px_rgba(49,130,246,0.4)]'
              : 'glass text-grey-400 opacity-60'
          }`}
        >
          Top 1-10
        </button>
        <div className="flex gap-1">
          <div className={`h-1.5 rounded-full transition-all ${page === 0 ? 'w-6 bg-toss-blue' : 'w-1.5 bg-white/20'}`} />
          <div className={`h-1.5 rounded-full transition-all ${page === 1 ? 'w-6 bg-toss-blue' : 'w-1.5 bg-white/20'}`} />
        </div>
        <button
          onClick={() => setPage(1)}
          className={`h-9 px-4 rounded-full font-bold text-xs transition-all ${
            page === 1
              ? 'bg-toss-blue text-white shadow-[0_0_16px_rgba(49,130,246,0.4)]'
              : 'glass text-grey-400 opacity-60'
          }`}
        >
          Top 11-20
        </button>
      </div>
    </div>
  );
}

// ===== 폰 프레임 (데스크톱) =====
// relative + overflow:hidden → AISummaryModal의 absolute 기준점
interface PhoneFrameProps {
  children: React.ReactNode;
  modal: React.ReactNode;
}

function PhoneFrame({ children, modal }: PhoneFrameProps) {
  return (
    <div className="hidden md:flex min-h-screen items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #1a1f2e 0%, #080b12 100%)' }}>
      <div className="relative"
           style={{
             width: 390,
             height: 844,
             background: '#0d1117',
             borderRadius: 52,
             border: '2px solid #2a2a3a',
             boxShadow: '0 0 0 6px #111118, 0 40px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
             overflow: 'hidden',  // ← 모달이 이 경계 밖으로 나가지 않음
           }}>

        {/* 상단 노치 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
             style={{ width: 120, height: 34, background: '#0d1117', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full" />
        </div>

        {/* 상태바 */}
        <div className="absolute top-0 left-0 right-0 h-11 flex items-start justify-between px-8 pt-3 z-40 text-[11px] font-semibold text-white/70 pointer-events-none">
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            <span>●●●</span>
            <span>WiFi</span>
            <span>🔋</span>
          </div>
        </div>

        {/* 스크롤 콘텐츠 영역 */}
        <div className="absolute inset-0 pt-11 overflow-y-auto overflow-x-hidden"
             style={{
               background: 'radial-gradient(circle at top right, #1e293b 0%, #101317 100%)',
               scrollbarWidth: 'none',
             }}>
          {children}
        </div>

        {/* 모달: 스크롤 영역 밖, 프레임 내부에 absolute로 고정 */}
        {modal}

        {/* 홈 인디케이터 */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 bg-white/30 rounded-full z-50 pointer-events-none" />
      </div>
    </div>
  );
}

// ===== 메인 앱 =====
function App() {
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const closeModal = () => setSelectedTrend(null);

  const modal = <AISummaryModal trend={selectedTrend} onClose={closeModal} />;

  return (
    <>
      {/* 모바일: 풀스크린 (relative + overflow:hidden → 모달 기준점) */}
      <div className="md:hidden relative min-h-screen overflow-hidden"
           style={{ background: 'radial-gradient(circle at top right, #1e293b 0%, #101317 100%)' }}>
        <AppContent onSelect={setSelectedTrend} />
        {modal}
      </div>

      {/* 데스크톱: 폰 프레임 */}
      <PhoneFrame modal={modal}>
        <AppContent onSelect={setSelectedTrend} />
      </PhoneFrame>
    </>
  );
}

export default App;
