/**
 * useTrends 커스텀 훅
 *
 * 역할: 에이전트가 매일 생성하는 live_trends.json을 로드하고,
 *       파일이 없거나 오류 시 mockData로 자동 폴백합니다.
 *
 * 데이터 흐름:
 *   1. GET /data/live_trends.json (public 폴더)
 *   2. 성공 → live 데이터 반환 (isLive: true)
 *   3. 실패 → mockData.ts 폴백 데이터 반환 (isLive: false)
 */

import { useState, useEffect } from 'react';
import type { TrendItem, LiveTrendsData } from '../data/mockData';
import { mockTrends } from '../data/mockData';

// 현재 날짜를 한국어 형식으로 변환하는 유틸
function formatKoreanDate(date: Date): string {
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Mock 데이터를 LiveTrendsData 형식으로 래핑
function buildMockData(): LiveTrendsData {
  return {
    updatedAt: new Date().toISOString(),
    displayDate: formatKoreanDate(new Date()),
    trends: mockTrends,
  };
}

interface UseTrendsResult {
  trends: TrendItem[];
  displayDate: string;
  isLive: boolean;       // true: 에이전트 실시간 데이터, false: Mock 데이터
  loading: boolean;
  error: string | null;
}

export function useTrends(): UseTrendsResult {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [displayDate, setDisplayDate] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // 컴포넌트 언마운트 시 상태 업데이트 방지

    async function loadTrends() {
      try {
        // 캐시 방지 쿼리스트링 추가 (에이전트가 업데이트 후 바로 반영되도록)
        const res = await fetch(`/data/live_trends.json?t=${Date.now()}`);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: live_trends.json 미존재`);
        }

        const data: LiveTrendsData = await res.json();

        // 데이터 유효성 기본 검사
        if (!data.trends || !Array.isArray(data.trends) || data.trends.length === 0) {
          throw new Error('유효하지 않은 live_trends.json 형식');
        }

        if (!cancelled) {
          setTrends(data.trends);
          setDisplayDate(data.displayDate || formatKoreanDate(new Date(data.updatedAt)));
          setIsLive(true);
        }
      } catch (err) {
        // 에러 발생 시 Mock 데이터로 조용히 폴백
        console.info(
          '[useTrends] live_trends.json 로드 실패 → Mock 데이터 사용:',
          err instanceof Error ? err.message : err
        );

        if (!cancelled) {
          const mock = buildMockData();
          setTrends(mock.trends);
          setDisplayDate(mock.displayDate);
          setIsLive(false);
          setError(err instanceof Error ? err.message : 'unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadTrends();

    return () => {
      cancelled = true;
    };
  }, []);

  return { trends, displayDate, isLive, loading, error };
}
