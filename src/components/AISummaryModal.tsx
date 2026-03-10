/**
 * AISummaryModal.tsx - AI 요약 바텀시트
 *
 * fixed → absolute로 변경하여 폰 프레임 내부에 고정됩니다.
 * 부모 컨테이너가 position:relative + overflow:hidden 이어야 합니다.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ExternalLink, Bookmark } from 'lucide-react';
import type { TrendItem } from '../data/mockData';

interface AISummaryModalProps {
  trend: TrendItem | null;
  onClose: () => void;
}

function getImportanceBadge(importance?: string) {
  switch (importance) {
    case 'high':   return { label: '🔥 주목', className: 'bg-red-500/10 text-red-400 border border-red-500/20' };
    case 'medium': return { label: '📌 주요', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
    case 'low':    return { label: '📎 일반', className: 'bg-grey-600 text-grey-300 border border-grey-500' };
    default:       return null;
  }
}

const AISummaryModal: React.FC<AISummaryModalProps> = ({ trend, onClose }) => {
  const summaryText = trend?.summary || trend?.aiSummary;
  const importanceBadge = getImportanceBadge(trend?.importance);

  return (
    <AnimatePresence>
      {trend && (
        // absolute: 가장 가까운 relative 부모(폰 프레임) 기준으로 위치
        <div className="absolute inset-0 z-50 flex items-end justify-center">
          {/* 백드롭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
          />

          {/* 바텀시트 */}
          <motion.div
            key={trend.rank}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full bg-grey-800 rounded-t-[24px] p-6 shadow-2xl border-t border-white/5 overflow-y-auto"
            style={{ maxHeight: '80%' }}
          >
            {/* 드래그 핸들 */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />

            {/* 헤더 */}
            <div className="flex justify-between items-start mb-5 mt-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-toss-blue/10 border border-toss-blue/20 rounded-full text-[10px] text-toss-blue font-bold uppercase tracking-wider">
                    {trend.category}
                  </span>
                  {trend.flag && (
                    <span className="text-sm font-medium text-grey-400">
                      {trend.flag} {trend.country}
                    </span>
                  )}
                  {importanceBadge && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${importanceBadge.className}`}>
                      {importanceBadge.label}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-white leading-tight tracking-tight">
                  {trend.title}
                </h2>
                {trend.originalTitle && (
                  <p className="text-[10px] text-grey-500 mt-1 italic">{trend.originalTitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={18} className="text-grey-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* AI 요약 */}
              {summaryText ? (
                <div className="glass p-4 rounded-2xl border-toss-blue/20 bg-toss-blue/5">
                  <div className="flex items-center gap-1.5 mb-2.5 text-toss-blue">
                    <Sparkles size={14} className="fill-current" />
                    <span className="text-[12px] font-bold">AI 트렌드 브리핑</span>
                  </div>
                  <p className="text-[13px] text-white/80 leading-relaxed">{summaryText}</p>
                </div>
              ) : (
                <div className="glass p-4 rounded-2xl text-center">
                  <p className="text-grey-500 text-sm">AI 요약이 없습니다. 에이전트를 실행하면 자동 생성됩니다.</p>
                </div>
              )}

              {/* 키워드 */}
              {trend.keywords && trend.keywords.length > 0 && (
                <div className="flex flex-col gap-2">
                  <h4 className="text-[11px] text-grey-500 font-bold uppercase tracking-widest">관련 키워드</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {trend.keywords.map((kw) => (
                      <span key={kw} className="px-2.5 py-1 bg-grey-700 rounded-full text-[11px] text-white/80 font-medium hover:bg-toss-blue/20 hover:text-toss-blue transition-colors cursor-default">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 출처 */}
              {trend.source && (
                <p className="text-[10px] text-grey-600">
                  📡 출처: {trend.source}
                  {trend.publishedAt && ` · ${new Date(trend.publishedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                </p>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                {trend.url ? (
                  <a href={trend.url} target="_blank" rel="noopener noreferrer"
                     className="flex-1 h-12 bg-toss-blue rounded-toss flex items-center justify-center gap-2 font-bold text-[14px] hover:brightness-110 active:scale-95 transition-all">
                    <ExternalLink size={15} />원문 보기
                  </a>
                ) : (
                  <button disabled className="flex-1 h-12 bg-grey-700 rounded-toss flex items-center justify-center gap-2 font-bold text-[14px] text-grey-500 cursor-not-allowed">
                    원문 링크 없음
                  </button>
                )}
                <button className="w-12 h-12 bg-white/5 rounded-toss flex items-center justify-center text-grey-400 hover:bg-white/10 active:scale-95 transition-all" title="북마크">
                  <Bookmark size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AISummaryModal;
