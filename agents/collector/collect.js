/**
 * 📡 데이터 수집 에이전트 (Data Collector Agent)
 *
 * ✅ 소스 구성 (상업 배포 안전):
 *   1. Newsdata.io  — 무료 200크레딧/일, 상업 사용 명시 허용, 카테고리별 글로벌 뉴스
 *   2. Google Trends — 구글 공개 RSS, 검색량 신호용
 *
 * Newsdata.io 카테고리 → Top 20 슬롯 배정:
 *   politics (4) · business (4) · technology (3)
 *   health (2) · science (2) · world (3) · sports (1) · entertainment (1)
 *
 * 실행: node collect.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ===== 1. Newsdata.io 수집 =====
// 무료 플랜: 200 크레딧/일 = 2,000건/일, 상업 사용 허용
// https://newsdata.io/documentation
const NEWSDATA_CATEGORIES = [
  'politics',
  'business',
  'technology',
  'health',
  'science',
  'world',
  'top',
  'sports',
  'entertainment',
];

async function collectFromNewsdata() {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.warn('  ⚠️  NEWSDATA_API_KEY 없음 → Newsdata.io 수집 건너뜀');
    return [];
  }

  console.log('  📡 Newsdata.io 수집 중...');
  const results = [];

  for (const category of NEWSDATA_CATEGORIES) {
    try {
      const url =
        `https://newsdata.io/api/1/latest` +
        `?apikey=${apiKey}` +
        `&category=${category}` +
        `&language=en` +
        `&size=5`; // 카테고리당 5건 수집 (랭킹에서 슬롯에 맞게 선별)

      const res = await fetchWithRetry(url);
      const data = await res.json();

      if (data.status !== 'success' || !data.results?.length) {
        console.warn(`    ⚠️  ${category}: 결과 없음`);
        continue;
      }

      const articles = data.results.map(article => ({
        source: 'newsdata',
        newsdataCategory: category,
        title: article.title || '',
        description: article.description || article.content?.slice(0, 200) || '',
        url: article.link || '',
        publishedAt: article.pubDate
          ? new Date(article.pubDate).toISOString()
          : new Date().toISOString(),
        sourceName: article.source_id || 'Newsdata.io',
        rawScore: 1, // Newsdata는 engagement 점수 없음 → 최신성으로 차별화
        commentCount: 0,
      }));

      results.push(...articles);
      console.log(`    ✅ ${category}: ${articles.length}건`);

      // 카테고리 간 요청 간격 (무료 플랜 rate limit 대응)
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.warn(`    ⚠️  ${category} 수집 실패: ${err.message}`);
    }
  }

  return results;
}

// ===== 2. Google Trends RSS (검색량 신호용) =====
async function collectFromGoogleTrends() {
  try {
    console.log('  📡 Google Trends 수집 중...');
    const res = await fetchWithRetry('https://trends.google.com/trending/rss?geo=US');
    const xml = await res.text();

    const items = [...xml.matchAll(/<item[^>]*>[\s\S]*?<\/item>/g)].map(m => m[0]);

    return items
      .map((item, index) => {
        const titleMatch =
          item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ||
          item.match(/<title>([^<]+)<\/title>/);
        const trafficMatch = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/);
        return {
          term: titleMatch?.[1]?.trim() || '',
          rank: index + 1,
          traffic: trafficMatch?.[1]?.trim() || '0',
        };
      })
      .filter(t => t.term);
  } catch (err) {
    console.warn('  ⚠️  Google Trends 수집 실패 (순위 반영 안됨):', err.message);
    return [];
  }
}

// ===== 유틸: 재시도 로직 =====
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`    재시도 ${attempt}/${maxRetries}... (${err.message})`);
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

// ===== 메인 실행 =====
async function main() {
  const startTime = Date.now();

  console.log('🚀 데이터 수집 에이전트 시작...');
  console.log('='.repeat(50));
  console.log('✅ 상업 배포 안전 소스:');
  console.log('   • Newsdata.io (글로벌 뉴스 — 정치·경제·건강·과학·스포츠·엔터·테크)');
  console.log('   • Google Trends RSS (검색량 신호)');
  console.log('='.repeat(50));

  // 순차 수집 (Newsdata rate limit 대응)
  const newsdataData = await collectFromNewsdata();
  const trendTerms = await collectFromGoogleTrends();

  const totalCount = newsdataData.length;

  console.log('\n📊 수집 결과:');
  console.log(`  - Newsdata.io:   ${newsdataData.length}건`);
  console.log(`  - Google Trends: ${trendTerms.length}개 트렌딩 검색어`);

  if (totalCount === 0) {
    console.error('\n❌ 수집된 데이터가 없습니다. 네트워크 및 API 키를 확인하세요.');
    process.exit(1);
  }

  const output = {
    collectedAt: new Date().toISOString(),
    commercialSafe: true,
    sources: {
      newsdata: newsdataData,
    },
    trendTerms,
    totalCount,
  };

  const outputPath = path.join(OUTPUT_DIR, 'raw_trends.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ 수집 완료! 기사 ${totalCount}건 + 트렌딩 키워드 ${trendTerms.length}개 → ${outputPath}`);
  console.log(`⏱️  소요 시간: ${elapsed}초`);
}

main().catch(err => {
  console.error('\n💥 예상치 못한 오류:', err);
  process.exit(1);
});
