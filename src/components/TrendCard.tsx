import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight } from 'lucide-react';
import type { TrendItem } from '../data/mockData';

interface TrendCardProps {
  trend: TrendItem;
  onHover: (rank: number | null) => void;
  onClick: (trend: TrendItem) => void;
}

const TrendCard: React.FC<TrendCardProps> = ({ trend, onHover, onClick }) => {
  return (
    <motion.div
      onMouseEnter={() => onHover(trend.rank)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(trend)}
      className="tds-list-item glass w-full p-4 mb-3 rounded-toss flex items-center justify-between cursor-pointer group select-none overflow-hidden relative"
      whileTap={{ scale: 0.96 }}
    >
      {/* TDS Rank Column */}
      <div className="flex items-center gap-4">
        <span className="text-xl font-bold italic text-toss-blue/60 w-8">{trend.rank}</span>
        
        {/* Content Column */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-[14px]">{trend.flag}</span>
            <span className="text-[10px] text-grey-400 font-medium uppercase tracking-tighter">
              {trend.country}
            </span>
            <span className="w-1 h-1 rounded-full bg-grey-600 mb-0.5 mx-0.5" />
            <span className="text-[10px] text-grey-500 font-medium">{trend.category}</span>
          </div>
          <h3 className="text-[16px] text-white/95 font-semibold mt-1 tracking-tight truncate max-w-[200px]">
            {trend.title}
          </h3>
        </div>
      </div>

      {/* Stats Column */}
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className="flex items-center gap-0.5 text-emerald-400 text-[12px] font-bold">
            <TrendingUp size={12} />
            {trend.growth}
          </div>
          <p className="text-[9px] text-grey-500 mt-0.5 font-medium">실시간 급상승</p>
        </div>
        <ChevronRight size={18} className="text-grey-600 group-hover:text-toss-blue group-hover:translate-x-1 transition-all" />
      </div>

      {/* Hover background splash */}
      <div className="absolute inset-0 bg-toss-blue/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
};

export default TrendCard;
