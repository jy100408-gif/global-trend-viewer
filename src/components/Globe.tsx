/**
 * Globe.tsx — react-globe.gl 기반 실제 3D 지구본
 *
 * react-globe.gl은 Three.js WebGL 기반으로 실제 지구처럼 보이는 구체를 렌더링합니다.
 * CDN 이미지 대신 오픈 소스 타일을 사용하며 자동 회전을 지원합니다.
 */

import React, { useRef, useEffect, Suspense } from 'react';
import type { TrendItem } from '../data/mockData';

// react-globe.gl 은 ESM 동적 임포트로 로드 (Three.js SSR 이슈 방지)
const ReactGlobe = React.lazy(() => import('react-globe.gl'));

interface GlobeProps {
  trends: TrendItem[];
  hoveredRank: number | null;
  onMarkerClick?: (trend: TrendItem) => void;
}

const GlobeInner: React.FC<GlobeProps> = ({ trends, hoveredRank, onMarkerClick }) => {
  const globeRef = useRef<any>(null);

  // 자동 회전 설정
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    controls.enableZoom = false; // 줌 방지
    controls.enablePan = false;
    controls.enableRotate = true;  // 사용자 드래그 회전 활성화

    // 초기 시점: 아시아 중심으로 설정
    globe.pointOfView({ lat: 20, lng: 110, altitude: 1.8 });
  }, []);

  // 트렌드 포인트 데이터 (lat/lng 있는 것만)
  const pointsData = trends
    .filter(t => t.lat != null && t.lng != null)
    .map(t => ({
      lat: t.lat!,
      lng: t.lng!,
      size: hoveredRank === t.rank ? 0.8 : 0.4,
      color: hoveredRank === t.rank ? '#f59e0b' : 'rgba(255, 240, 220, 0.8)', // 호버 시 앰버(골드), 평소엔 따뜻한 화이트
      label: t.title,
      url: t.url,
      flag: t.flag,
      originalTrend: t, // 전체 데이터 객체 전달
    }));

  return (
    <ReactGlobe
      ref={globeRef}
      width={180}
      height={180}
      // 도시 불빛이 보이는 밤 지구 텍스처 (훨씬 선명하고 예쁨)
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
      backgroundColor="rgba(0,0,0,0)"
      // 푸른 빛 대신 부드러운 은회색 대기권으로 변경
      atmosphereColor="rgba(200, 200, 220, 0.15)"
      atmosphereAltitude={0.15}
      // HTML 요소로 위치 마커 생성 (국기 이모지 + 발광점)
      htmlElementsData={pointsData}
      htmlElement={(d: any) => {
        const el = document.createElement('div');
        // 부모 클릭 이벤트 방해 방지
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.style.display = 'flex';
        el.style.flexDirection = 'column';
        el.style.alignItems = 'center';
        // 위치를 약간 위로 띄워 마커의 꼬리가 위치를 찍도록 설정
        // 중심점이 정확히 구체를 가리키도록 변경
        el.style.transform = 'translate(-50%, -50%)';

        // 텍스트/이모지와 빛나는 구슬 렌더링
        const sizePx = d.size === 0.8 ? 8 : 4;
        const color = d.color;
        
        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <!-- 실제 점 -->
            <div style="width: ${sizePx}px; height: ${sizePx}px; background-color: ${color}; border-radius: 50%; box-shadow: 0 0 10px ${color}, 0 0 20px ${color};"></div>
            
            <!-- 연결선과 박스는 점의 우측 상단으로 뻗어나감 -->
            <div style="position: absolute; bottom: ${sizePx / 2}px; left: ${sizePx / 2}px; pointer-events: none; display: flex; align-items: flex-end;">
              <!-- 꺾은선 (대각선 위로 올라갔다가 오른쪽으로 꺾임) -->
              <svg width="25" height="20" style="overflow: visible;">
                <polyline points="0,20 10,5 25,5" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
              </svg>
              <!-- 국가명/랭크 깃발 박스 -->
              <div style="transform: translateY(20%); margin-left: -2px; margin-bottom: 5px; background: rgba(15, 23, 42, 0.85); border: 1px solid ${color}; border-radius: 3px; padding: 2px 5px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.5); backdrop-filter: blur(2px);">
                <span style="font-size: 11px; line-height: 1;">${d.flag !== '🌐' ? d.flag : '📍'}</span>
                <span style="font-size: 9px; color: #fff; font-weight: bold; letter-spacing: 0.5px;">
                  ${d.originalTrend.country === 'Global' ? '#' + d.originalTrend.rank : d.originalTrend.country.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        `;

        // 클릭 시 App.tsx의 onMarkerClick 트리거
        el.onclick = () => {
          if (onMarkerClick) onMarkerClick(d.originalTrend);
        };
        
        // 추가: 호버 시 약간 커지는 효과
        // 추가: 호버 시 약간 커지는 효과
        el.onmouseenter = () => { el.style.transform = 'translate(-50%, -50%) scale(1.1)'; el.style.transition = 'transform 0.2s'; el.style.zIndex = '10'; };
        el.onmouseleave = () => { el.style.transform = 'translate(-50%, -50%) scale(1)'; el.style.zIndex = '1'; };

        return el;
      }}
    />
  );
};

// Suspense 래퍼: Three.js 로드 중 로딩 UI 표시
const Globe: React.FC<GlobeProps> = (props) => {
  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      {/* 배경 글로우 */}
      <div className="absolute w-44 h-44 bg-amber-500/5 rounded-full blur-3xl opacity-50" />
      {/* Outer Orbit */}
      <div className="absolute w-52 h-52 border border-white/5 rounded-full" />
      {/* 대기권 글로우 */}
      <div className="absolute w-44 h-44 border border-white/10 rounded-full box-content p-3 -m-3 opacity-30" />

      <Suspense fallback={
        <div className="w-44 h-44 rounded-full flex items-center justify-center"
             style={{ background: 'radial-gradient(circle at 35% 35%, #2a2a2a, #0a0a0a)' }}>
          <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      }>
        <GlobeInner {...props} />
      </Suspense>
    </div>
  );
};

export default Globe;
