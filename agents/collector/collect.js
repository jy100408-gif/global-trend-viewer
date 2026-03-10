/**
 * 📡 데이터 수집 에이전트 (Data Collector Agent)
 *
 * 역할: 상업적으로 완전히 안전한 소스에서만 트렌딩 뉴스를 수집
 *
 * ✅ 소스 구성 (상업 배포 100% 안전):
 *   1. Hacker News  — Firebase 공식 오픈 API, 무제한 무료, 상업 허용
 *   2. GDELT        — 전 세계 뉴스 이벤트 DB, 완전 공개 데이터, API 키 불필요
 *
 * ❌ 제거된 소스 (상업용 제한/유료):
 *   - NewsAPI    → 상업용 $449/월
 *   - Reddit     → 2023년부터 상업 앱 유료 ($0.24/1,000 API 호출)
 *   - Guardian   → 상업용 "Commercial Key" 필요 (유료, 가격 협의)
 *   - GNews      → 무료 플랜은 "development & testing only"
 *
 * 실행: node collect.js
 */

import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// __dirname 설정 (ESM 환경용, 이 에이전트는 API 키가 불필요)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 출력 디렉토리 생성
const OUTPUT_DIR = path.join(__dirname, "output");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ===== 1. Hacker News 수집 =====
// 공식 Firebase API, 완전 무료, 인증 불필요, 상업 제한 없음
// 출처: https://github.com/HackerNews/API
async function collectFromHackerNews() {
  try {
    console.log("  📡 Hacker News 수집 중...");

    // Top 스토리 ID 목록 가져오기
    const topStoriesRes = await fetchWithRetry(
      "https://hacker-news.firebaseio.com/v0/topstories.json"
    );
    const topIds = await topStoriesRes.json();

    // 상위 30개 상세 정보 병렬 수집
    const top30Ids = topIds.slice(0, 30);
    const stories = await Promise.allSettled(
      top30Ids.map((id) =>
        fetchWithRetry(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        ).then((r) => r.json())
      )
    );

    // 성공한 항목만 필터링 (URL 있는 스토리만, Ask HN 등 제외)
    return stories
      .filter(
        (result) =>
          result.status === "fulfilled" &&
          result.value?.title &&
          result.value?.url // URL 없는 토론 글 제외
      )
      .map((result) => {
        const story = result.value;
        return {
          source: "hackernews",
          title: story.title,
          description: "",
          url: story.url,
          publishedAt: new Date(story.time * 1000).toISOString(),
          sourceName: "Hacker News",
          rawScore: story.score || 0,           // 커뮤니티 UP 투표 수
          commentCount: story.descendants || 0,
        };
      });
  } catch (err) {
    console.error("  ❌ Hacker News 수집 실패:", err.message);
    return [];
  }
}

// ===== 2. GDELT (Global Database of Events, Language, and Tone) =====
// 전 세계 뉴스를 15분마다 분석하는 완전 공개 학술 데이터베이스
// 완전 무료, API 키 불필요, 상업 제한 없음, 저작권 제한 없음
// 출처: https://www.gdeltproject.org/
async function collectFromGDELT() {
  try {
    console.log("  📡 GDELT 수집 중...");

    // GDELT DOC 2.0 API: 최신 글로벌 뉴스 기사 목록 수집
    // mode=artlist: 기사 목록 반환
    // sort=hybrid: 관련성 + 최신성 혼합 정렬
    // maxrecords=50: 최대 50건
    const url =
      "https://api.gdeltproject.org/api/v2/doc/doc" +
      "?query=world%20news" +
      "&mode=artlist" +
      "&maxrecords=50" +
      "&sort=hybrid" +
      "&format=json" +
      "&timespan=1440"; // 최근 24시간 (분 단위)

    const res = await fetchWithRetry(url);
    const data = await res.json();

    if (!data?.articles || data.articles.length === 0) {
      console.warn("  ⚠️  GDELT: 수집된 기사 없음");
      return [];
    }

    return data.articles.map((article) => ({
      source: "gdelt",
      title: article.title,
      description: "",
      url: article.url,
      publishedAt: parseGDELTDate(article.seendate),
      sourceName: article.domain || "GDELT",
      // GDELT는 engagement score가 없으므로 균일하게 설정
      // 랭킹 에이전트에서 최신성(recency)으로 차별화
      rawScore: 1,
    }));
  } catch (err) {
    console.error("  ❌ GDELT 수집 실패:", err.message);
    return [];
  }
}


// ===== 3. Google Trends RSS =====
// 구글이 공개 제공하는 미국 일일 급상승 검색어 RSS 피드
// API 키 불필요, 완전 무료, 상업 제한 없음 (공개 RSS 피드)
async function collectFromGoogleTrends() {
  try {
    console.log("  📡 Google Trends 수집 중...");
    const url = "https://trends.google.com/trending/rss?geo=US";
    const res = await fetchWithRetry(url);
    const xml = await res.text();

    // RSS XML에서 <item> 블록만 추출 후 제목과 트래픽 파싱
    // CDATA 형식: <title><![CDATA[검색어]]></title>
    // 일반 형식: <title>검색어</title>
    const items = [...xml.matchAll(/<item[^>]*>[\s\S]*?<\/item>/g)].map((m) => m[0]);

    return items
      .map((item, index) => {
        const titleMatch =
          item.match(/<title><!\[CDATA\[(.+?)\]\]><\/title>/) ||
          item.match(/<title>([^<]+)<\/title>/);
        const trafficMatch = item.match(/<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/);

        return {
          term: titleMatch?.[1]?.trim() || "",
          rank: index + 1,        // 1위부터 시작 (높을수록 인기)
          traffic: trafficMatch?.[1]?.trim() || "0",
        };
      })
      .filter((t) => t.term);   // 빈 항목 제외
  } catch (err) {
    console.warn("  ⚠️  Google Trends 수집 실패 (순위 반영 안됨):", err.message);
    return [];
  }
}

// GDELT 날짜 형식 파싱: "20260310T120000Z" → ISO 8601

function parseGDELTDate(dateStr) {
  if (!dateStr) return new Date().toISOString();
  try {
    // 형식: YYYYMMDDTHHMMSSZ
    const y = dateStr.slice(0, 4);
    const mo = dateStr.slice(4, 6);
    const d = dateStr.slice(6, 8);
    const h = dateStr.slice(9, 11);
    const mi = dateStr.slice(11, 13);
    const s = dateStr.slice(13, 15);
    return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
  } catch {
    return new Date().toISOString();
  }
}

// ===== 유틸: 재시도 로직 =====
// 네트워크 불안정 대비 최대 3회 재시도 (지수 백오프)
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000), // GDELT는 응답이 느릴 수 있어 15초
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      console.warn(`    재시도 ${attempt}/${maxRetries}... (${err.message})`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// ===== 메인 실행 =====
async function main() {
  const startTime = Date.now();

  console.log("🚀 데이터 수집 에이전트 시작...");
  console.log("=".repeat(50));
  console.log("✅ 상업 배포 안전 소스만 사용:");
  console.log("   • Hacker News (공식 오픈 API)");
  console.log("   • GDELT (전세계 뉴스 공개 DB)");
  console.log("   • Google Trends RSS (구글 공개 검색량 피드)");
  console.log("=".repeat(50));

  // 세 소스 병렬 수집
  const [hnData, gdeltData, trendTerms] = await Promise.all([
    collectFromHackerNews(),
    collectFromGDELT(),
    collectFromGoogleTrends(),
  ]);

  console.log("\n📊 수집 결과:");
  console.log(`  - Hacker News:   ${hnData.length}건`);
  console.log(`  - GDELT:         ${gdeltData.length}건`);
  console.log(`  - Google Trends: ${trendTerms.length}개 트렌딩 검색어`);

  const totalCount = hnData.length + gdeltData.length;

  if (totalCount === 0) {
    console.error("\n❌ 수집된 데이터가 없습니다. 네트워크를 확인하세요.");
    process.exit(1);
  }

  // 결과 저장 (랭킹 에이전트가 읽을 파일)
  const output = {
    collectedAt: new Date().toISOString(),
    commercialSafe: true,
    sources: {
      hackernews: hnData,
      gdelt: gdeltData,
    },
    // 기사 목록이 아닌 트렌딩 키워드 신호로 별도 관리
    trendTerms,
    totalCount,
  };

  const outputPath = path.join(OUTPUT_DIR, "raw_trends.json");
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), "utf-8");

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ 수집 완료! 기사 ${totalCount}건 + 트렌딩 키워드 ${trendTerms.length}개 → ${outputPath}`);
  console.log(`⏱️  소요 시간: ${elapsed}초`);
}

main().catch((err) => {
  console.error("\n💥 예상치 못한 오류:", err);
  process.exit(1);
});
