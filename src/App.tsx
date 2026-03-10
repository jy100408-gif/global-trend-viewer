/**
 * App.tsx - 메인 앱 컴포넌트
 *
 * useTrends 훅을 통해 실시간 트렌드 데이터를 불러오고,
 * 에이전트 미실행 시 Mock 데이터로 자동 폴백합니다.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe as GlobeIcon, TrendingUp, Wifi, WifiOff } from 'lucide-react';
import Globe from './components/Globe';
import TrendCard from './components/TrendCard';
import AISummaryModal from './components/AISummaryModal';
import { useTrends } from './hooks/useTrends';
import type { TrendItem } from './data/mockData';

function App() {
  const { trends, displayDate, isLive, loading } = useTrends();
  const [page, setPage] = useState(0);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [hoveredRank, setHoveredRank] = useState<number | null>(null);

  // 현재 페이지에 표시할 트렌드 (1~10 / 11~20)
  const currentTrends = page === 0 ? trends.slice(0, 10) : trends.slice(10, 20);

  // 카드 클릭 시 AI 요약 바텀시트 열기
  const handleCardClick = (trend: TrendItem) => {
    setSelectedTrend(trend);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold" style={{ background: 'linear-gradient(135deg, #fff 0%, #8b95a1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Trend 24/7
          </h1>
          {/* 업데이트 날짜: 로딩 중이면 스켈레톤, 완료 후 실제 날짜 표시 */}
          {loading ? (
            <div className="h-3 w-36 bg-white/10 rounded-full mt-1 animate-pulse" />
          ) : (
            <p className="text-[11px] text-grey-400 mt-0.5">{displayDate}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Live/Mock 상태 배지 */}
          {!loading && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-grey-700/60 text-grey-400 border border-grey-600'
            }`}>
              {isLive ? <Wifi size={10} /> : <WifiOff size={10} />}
              {isLive ? 'LIVE' : 'MOCK'}
            </div>
          )}
          <div className="w-10 h-10 rounded-full glass flex items-center justify-center">
            <GlobeIcon size={20} className="text-toss-blue" />
          </div>
        </div>
      </header>

      {/* Hero Section with Globe */}
      <section className="mt-2 mb-6">
        <Globe hoveredRank={hoveredRank} trends={trends} onMarkerClick={handleCardClick} />
        <div className="text-center mt-5">
          <span className="px-3 py-1 bg-toss-blue/10 border border-toss-blue/20 rounded-full text-[10px] text-toss-blue font-bold uppercase tracking-widest">
            <TrendingUp size={10} className="inline mr-1" />
            Live Global Trends
          </span>
          <h2 className="text-lg font-semibold mt-2.5 text-white/90">
            {page === 0 ? '🏆 Global Top 1 ~ 10' : '🌐 Global Top 11 ~ 20'}
          </h2>
        </div>
      </section>

      {/* Trend List */}
      <main className="flex-1 px-4 max-w-lg mx-auto w-full">
        {loading ? (
          // 로딩 스켈레톤 UI
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="glass p-4 rounded-toss animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-6 bg-white/10 rounded" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/10 rounded w-1/3" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
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
                  onClick={handleCardClick}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Pagination */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center items-center gap-6">
        <button
          onClick={() => setPage(0)}
          disabled={loading}
          className={`h-11 px-5 rounded-full font-bold text-sm transition-all ${
            page === 0
              ? 'bg-toss-blue text-white shadow-[0_0_20px_rgba(49,130,246,0.4)]'
              : 'glass text-grey-400 opacity-60'
          }`}
        >
          Top 1-10
        </button>
        <div className="flex gap-1.5">
          <div className={`h-1.5 rounded-full transition-all ${page === 0 ? 'w-8 bg-toss-blue' : 'w-2 bg-white/20'}`} />
          <div className={`h-1.5 rounded-full transition-all ${page === 1 ? 'w-8 bg-toss-blue' : 'w-2 bg-white/20'}`} />
        </div>
        <button
          onClick={() => setPage(1)}
          disabled={loading}
          className={`h-11 px-5 rounded-full font-bold text-sm transition-all ${
            page === 1
              ? 'bg-toss-blue text-white shadow-[0_0_20px_rgba(49,130,246,0.4)]'
              : 'glass text-grey-400 opacity-60'
          }`}
        >
          Top 11-20
        </button>
      </div>

      {/* AI 요약 바텀시트 */}
      {selectedTrend && (
        <AISummaryModal
          trend={selectedTrend}
          onClose={() => setSelectedTrend(null)}
        />
      )}
    </div>
  );
}

export default App;
