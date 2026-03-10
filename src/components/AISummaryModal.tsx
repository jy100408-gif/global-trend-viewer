/**
 * AISummaryModal.tsx - AI 요약 바텀시트
 *
 * TrendCard 클릭 시 하단에서 올라오는 상세 요약 패널.
 * - summary/aiSummary 두 필드 모두 지원 (live 데이터 / mock 데이터 호환)
 * - 원문 링크 버튼 추가
 * - importance에 따른 뱃지 색상 분기
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, ExternalLink, Bookmark } from 'lucide-react';
import type { TrendItem } from '../data/mockData';

interface AISummaryModalProps {
  trend: TrendItem | null;
  onClose: () => void;
}

// importance 값에 따른 뱃지 스타일 반환
function getImportanceBadge(importance?: string) {
  switch (importance) {
    case 'high':
      return { label: '🔥 주목', className: 'bg-red-500/10 text-red-400 border border-red-500/20' };
    case 'medium':
      return { label: '📌 주요', className: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' };
    case 'low':
      return { label: '📎 일반', className: 'bg-grey-600 text-grey-300 border border-grey-500' };
    default:
      return null;
  }
}

const AISummaryModal: React.FC<AISummaryModalProps> = ({ trend, onClose }) => {
  if (!trend) return null;

  // live 데이터는 summary, mock 데이터는 aiSummary 필드 사용
  const summaryText = trend.summary || trend.aiSummary;
  const importanceBadge = getImportanceBadge(trend.importance);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="bottom-sheet-overlay absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Bottom Sheet */}
        <motion.div
          key={trend.rank}
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-md bg-grey-800 rounded-t-[24px] p-6 shadow-2xl border-t border-white/5 pointer-events-auto"
        >
          {/* Drag handle */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/10 rounded-full" />

          {/* Header */}
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
              <h2 className="text-xl font-black text-white leading-tight tracking-tight">
                {trend.title}
              </h2>
              {trend.originalTitle && (
                <p className="text-[11px] text-grey-500 mt-1 italic">{trend.originalTitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X size={20} className="text-grey-400" />
            </button>
          </div>

          <div className="space-y-5">
            {/* AI 요약 박스 */}
            {summaryText ? (
              <div className="glass p-5 rounded-2xl border-toss-blue/20 bg-toss-blue/5">
                <div className="flex items-center gap-1.5 mb-3 text-toss-blue">
                  <Sparkles size={15} className="fill-current" />
                  <span className="text-[13px] font-bold">AI 트렌드 브리핑</span>
                </div>
                <p className="text-[14px] text-white/80 leading-relaxed">
                  {summaryText}
                </p>
              </div>
            ) : (
              <div className="glass p-5 rounded-2xl text-center">
                <p className="text-grey-500 text-sm">AI 요약이 없습니다. 에이전트를 실행하면 자동 생성됩니다.</p>
              </div>
            )}

            {/* 관련 키워드 */}
            {trend.keywords && trend.keywords.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <h4 className="text-[12px] text-grey-500 font-bold uppercase tracking-widest pl-0.5">관련 키워드</h4>
                <div className="flex flex-wrap gap-2">
                  {trend.keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-3 py-1.5 bg-grey-700 rounded-full text-[12px] text-white/80 font-medium hover:bg-toss-blue/20 hover:text-toss-blue transition-colors cursor-default"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 원문 소스 정보 */}
            {trend.source && (
              <p className="text-[11px] text-grey-600 pl-0.5">
                📡 출처: {trend.source}
                {trend.publishedAt && ` · ${new Date(trend.publishedAt).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </p>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-3 pt-2 border-t border-white/5">
              {trend.url ? (
                <a
                  href={trend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 h-13 bg-toss-blue rounded-toss flex items-center justify-center gap-2 font-bold text-[15px] hover:brightness-110 active:scale-95 transition-all"
                  style={{ height: '52px' }}
                >
                  <ExternalLink size={16} />
                  원문 보기
                </a>
              ) : (
                <button
                  disabled
                  className="flex-1 h-13 bg-grey-700 rounded-toss flex items-center justify-center gap-2 font-bold text-[15px] text-grey-500 cursor-not-allowed"
                  style={{ height: '52px' }}
                >
                  원문 링크 없음
                </button>
              )}
              <button
                className="w-13 bg-white/5 rounded-toss flex items-center justify-center text-grey-400 hover:bg-white/10 active:scale-95 transition-all"
                style={{ width: '52px', height: '52px' }}
                title="북마크"
              >
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AISummaryModal;
