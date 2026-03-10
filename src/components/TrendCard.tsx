import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import type { TrendItem } from '../data/mockData';

interface TrendCardProps {
  trend: TrendItem;
  onHover: (rank: number | null) => void;
  onClick: (trend: TrendItem) => void;
}

// 점수 지표 미니 바
const ScoreBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="flex items-center gap-1">
    <span className="text-[8px] text-grey-500 w-5 shrink-0">{label}</span>
    <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
    </div>
    <span className="text-[8px] tabular-nums" style={{ color }}>{value}</span>
  </div>
);

const TrendCard: React.FC<TrendCardProps> = ({ trend, onHover, onClick }) => {
  return (
    <motion.div
      onMouseEnter={() => onHover(trend.rank)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(trend)}
      className="tds-list-item glass w-full px-4 py-3 mb-2.5 rounded-toss flex items-center justify-between cursor-pointer group select-none overflow-hidden relative"
      whileTap={{ scale: 0.96 }}
    >
      {/* 왼쪽: 랭크 + 정보 */}
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl font-bold italic text-toss-blue/60 w-7 shrink-0">{trend.rank}</span>

        <div className="flex flex-col min-w-0">
          {/* 국가 · 카테고리 */}
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[13px]">{trend.flag}</span>
            <span className="text-[10px] text-grey-400 font-medium uppercase tracking-tighter">{trend.country}</span>
            <span className="w-1 h-1 rounded-full bg-grey-600 mb-0.5 mx-0.5" />
            <span className="text-[10px] text-grey-500 font-medium truncate">{trend.category}</span>
          </div>

          {/* 제목 */}
          <h3 className="text-[15px] text-white/95 font-semibold mt-0.5 tracking-tight truncate max-w-[190px]">
            {trend.title}
          </h3>

          {/* 점수 분류 바 */}
          {trend.scores && (
            <div className="flex flex-col gap-0.5 mt-1.5">
              <ScoreBar label="검색" value={trend.scores.trend}   color="#10b981" />
              <ScoreBar label="최신" value={trend.scores.recency} color="#f59e0b" />
            </div>
          )}
        </div>
      </div>

      {/* 오른쪽: 성장 지표 + 화살표 */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <div className="text-right">
          <div className="flex items-center gap-0.5 text-emerald-400 text-[11px] font-bold">
            <TrendingUp size={11} />
            {trend.growth}
          </div>
          <p className="text-[8px] text-grey-500 mt-0.5 font-medium">실시간 급상승</p>
        </div>
        <ChevronRight size={16} className="text-grey-600 group-hover:text-toss-blue group-hover:translate-x-1 transition-all" />
      </div>

      {/* 호버 오버레이 */}
      <div className="absolute inset-0 bg-toss-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default TrendCard;
