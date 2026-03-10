/**
 * 🧠 랭킹/분석 에이전트 (Ranking Analyzer Agent)
 * 
 * 역할: 수집된 raw 데이터를 점수화하여 Top 20을 선별
 * 입력: ../collector/output/raw_trends.json
 * 출력: ./output/top20.json
 * 
 * 점수 산정 공식:
 *   최종점수 = (정규화 소스점수 × 0.5) + (소스 신뢰도 × 0.3) + (최신성 × 0.2)
 * 
 * 실행: node rank.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_PATH = path.join(__dirname, '../collector/output/raw_trends.json');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ===== 소스별 신뢰도 가중치 =====
// ✅ 상업 배포 안전 소스만 포함
const SOURCE_WEIGHTS = {
  hackernews: { reliability: 0.90, label: 'Hacker News' },   // 공식 오픈 API, 커뮤니티 검증
  gdelt:      { reliability: 0.80, label: 'GDELT 글로벌 뉴스' }, // 전세계 공개 뉴스 DB
};

// ===== 카테고리 자동 분류 =====
// 제목에서 키워드를 감지하여 카테고리를 자동 부여
const CATEGORY_KEYWORDS = {
  '🤖 AI·테크':   ['AI', 'artificial intelligence', 'ChatGPT', 'OpenAI', 'tech', 'software', 'robot', 'LLM', 'Claude', 'Gemini'],
  '💰 경제·금융': ['economy', 'market', 'stock', 'crypto', 'bitcoin', 'inflation', 'Fed', 'recession', 'GDP'],
  '🌍 정치·외교': ['election', 'president', 'government', 'war', 'policy', 'congress', 'senate', 'UN', 'NATO'],
  '🔬 과학·환경': ['science', 'climate', 'NASA', 'space', 'research', 'discovery', 'energy', 'environment'],
  '⚽ 스포츠':    ['football', 'soccer', 'NBA', 'NFL', 'Olympics', 'World Cup', 'championship', 'sport'],
  '🎬 엔터':     ['movie', 'music', 'celebrity', 'entertainment', 'Netflix', 'award', 'box office', 'album'],
  '🏥 건강':     ['health', 'medical', 'vaccine', 'disease', 'cancer', 'drug', 'FDA', 'hospital'],
};

// 제목에서 카테고리를 자동으로 분류
function categorize(title) {
  const titleLower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => titleLower.includes(kw.toLowerCase()))) {
      return category;
    }
  }
  return '🌐 글로벌';
}

// ===== 최신성 점수 계산 =====
// 24시간 이내 기사에 높은 점수, 오래될수록 감점
function calcRecencyScore(publishedAt) {
  const now = Date.now();
  const pubTime = new Date(publishedAt).getTime();
  const hoursAgo = (now - pubTime) / (1000 * 60 * 60);

  if (hoursAgo <= 2)  return 1.0;
  if (hoursAgo <= 6)  return 0.8;
  if (hoursAgo <= 12) return 0.6;
  if (hoursAgo <= 24) return 0.4;
  return 0.2;
}

// ===== 점수 정규화 (소스별 rawScore 범위가 다름) =====
function normalizeScores(items, sourceKey) {
  if (!items || items.length === 0) return [];

  const scores = items.map(i => i.rawScore || 0);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const range = maxScore - minScore || 1;

  return items.map(item => ({
    ...item,
    source: sourceKey,
    normalizedScore: (item.rawScore - minScore) / range,
  }));
}

// ===== Google Trends 키워드 매칭 점수 =====
// 제목에 트렌딩 검색어가 포함되어 있으면 가산점 부여
function calcTrendScore(title, trendTerms) {
  if (!trendTerms || trendTerms.length === 0) return 0;

  const titleLower = title.toLowerCase();

  for (const { term, rank } of trendTerms) {
    const termLower = term.toLowerCase();
    // 전체 키워드 매칭 또는 3자 이상 단어 중 하나라도 매칭
    const matched =
      titleLower.includes(termLower) ||
      termLower.split(' ').filter(w => w.length >= 4).some(w => titleLower.includes(w));

    if (matched) {
      // 1위일수록 1.0에 가까울수록, 순위가 낮을수록 감소 (floor 0.3)
      return Math.max(0.3, 1.0 - (rank - 1) * 0.04);
    }
  }
  return 0;
}

// ===== 중복 기사 제거 =====
// 제목이 80% 이상 유사하면 같은 이슈로 판단 (점수 더 높은 것만 남김)
function deduplicateByTitle(items) {
  const unique = [];

  for (const item of items) {
    const isDuplicate = unique.some(existing => {
      const similarity = calcTitleSimilarity(item.title, existing.title);
      return similarity > 0.7; // 70%+ 유사하면 중복으로 판단
    });

    if (!isDuplicate) {
      unique.push(item);
    }
  }

  return unique;
}

// 제목 유사도 계산 (Jaccard 유사도 + 불용어 제거)
// 관사/전치사 등은 제외하여 핵심 단어 기반으로 비교
const STOPWORDS = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'but', 'it']);

function calcTitleSimilarity(title1, title2) {
  const tokenize = t => new Set(
    t.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w))
  );
  const words1 = tokenize(title1);
  const words2 = tokenize(title2);
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

// ===== 실질적인 트렌드 지표 레이블 =====
// growth 필드: 소스별로 실제 의미 있는 수치를 표시
//   - Google Trends 매칭: 해당 검색어 실제 트래픽 (예: "500K+ 검색")
//   - Hacker News: 실제 커뮤니티 투표 수 (예: "↑1,234 votes")
//   - 그 외 (GDELT): 최종 점수 (예: "87점")
function calcGrowthLabel(item, trendTerms) {
  // Google Trends 매칭된 경우 → 해당 검색어의 실제 트래픽 표시
  if (item.trendScore > 0 && trendTerms.length > 0) {
    const titleLower = item.title.toLowerCase();
    for (const { term, traffic } of trendTerms) {
      const termLower = term.toLowerCase();
      const matched =
        titleLower.includes(termLower) ||
        termLower.split(' ').filter(w => w.length >= 4).some(w => titleLower.includes(w));
      if (matched && traffic && traffic !== '0') {
        return `${traffic} 검색`;
      }
    }
  }

  // Hacker News → 실제 투표 수
  if (item.source === 'hackernews' && item.rawScore > 0) {
    return `↑${item.rawScore.toLocaleString()} pts`;
  }

  // GDELT 등 나머지 → 최종 점수 퍼센트
  return `${Math.round(item.finalScore * 100)}점`;
}

// async 불필요 (내부에 await 없음)
function main() {
  console.log('🧠 랭킹/분석 에이전트 시작...');
  console.log('='.repeat(50));

  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error('❌ raw_trends.json을 찾을 수 없습니다. 먼저 수집 에이전트를 실행하세요.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
  console.log(`📂 원본 데이터: ${rawData.totalCount}건 로드`);

  // soureKey를 normalizeScores 내부에서 명시적으로 부여
  const normalizedHN    = normalizeScores(rawData.sources.hackernews || [], 'hackernews');
  const normalizedGDELT = normalizeScores(rawData.sources.gdelt      || [], 'gdelt');

  const allItems = [...normalizedHN, ...normalizedGDELT];

  // Google Trends 키워드 목록 (없으면 빈 배열로 폴백)
  const trendTerms = rawData.trendTerms || [];
  if (trendTerms.length > 0) {
    console.log(`🔍 Google Trends 키워드: ${trendTerms.slice(0, 5).map(t => t.term).join(', ')} ...`);
  }

  const scored = allItems.map(item => {
    const sourceWeight = SOURCE_WEIGHTS[item.source]?.reliability || 0.5;
    const recency = calcRecencyScore(item.publishedAt);
    const trendScore = calcTrendScore(item.title, trendTerms);

    // 가중 평균 최종 점수
    // 트렌드 점수를 15%로 신규 반영, 나머지 수치 조정
    const finalScore =
      (item.normalizedScore * 0.40) +
      (sourceWeight        * 0.25) +
      (recency             * 0.20) +
      (trendScore          * 0.15);

    return { ...item, finalScore, trendScore, category: categorize(item.title) };
  });

  scored.sort((a, b) => b.finalScore - a.finalScore);

  const deduped = deduplicateByTitle(scored);
  console.log(`🔍 중복 제거: ${allItems.length}건 → ${deduped.length}건`);

  const top20 = deduped.slice(0, 20).map((item, index) => ({
    rank: index + 1,
    title: item.title,
    description: item.description,
    url: item.url,
    source: item.source,
    sourceName: item.sourceName,
    category: item.category,
    publishedAt: item.publishedAt,
    finalScore: Math.round(item.finalScore * 100) / 100,
    growth: calcGrowthLabel(item, trendTerms),
  }));

  const outputPath = path.join(OUTPUT_DIR, 'top20.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    rankedAt: new Date().toISOString(),
    basedOn: rawData.collectedAt,
    top20,
  }, null, 2), 'utf-8');

  console.log('\n🏆 Top 5 미리보기:');
  top20.slice(0, 5).forEach(item => {
    console.log(`  ${item.rank}. [${item.category}] ${item.title}`);
  });

  console.log(`\n✅ 랭킹 완료! Top 20 → ${outputPath}`);
}

main();
