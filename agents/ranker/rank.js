/**
 * 🧠 랭킹/분석 에이전트 (Ranking Analyzer Agent)
 *
 * 역할: "신문 1면" 모델 — 카테고리별 슬롯을 먼저 배정하고,
 *       각 슬롯 안에서 최고 기사를 선별하여 균형 잡힌 Top 20 구성
 *
 * 슬롯 배정 (총 20개):
 *   🌍 정치·외교  4개  ← Newsdata politics
 *   💰 경제·금융  4개  ← Newsdata business
 *   🤖 AI·테크    3개  ← Newsdata technology
 *   🔬 과학·환경  2개  ← Newsdata science
 *   🏥 건강       2개  ← Newsdata health
 *   🌐 글로벌     3개  ← Newsdata world/top
 *   ⚽ 스포츠     1개  ← Newsdata sports
 *   🎬 엔터       1개  ← Newsdata entertainment
 *
 * 실행: node rank.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');
const RAW_DATA_PATH = path.join(__dirname, '../collector/output/raw_trends.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const CATEGORY_SLOTS = [
  { key: '🌍 정치·외교', slots: 4, newsdataCategories: ['politics']              },
  { key: '💰 경제·금융', slots: 4, newsdataCategories: ['business']              },
  { key: '🤖 AI·테크',  slots: 3, newsdataCategories: ['technology']             },
  { key: '🔬 과학·환경', slots: 2, newsdataCategories: ['science', 'environment'] },
  { key: '🏥 건강',      slots: 2, newsdataCategories: ['health']                 },
  { key: '🌐 글로벌',    slots: 3, newsdataCategories: ['world', 'top']           },
  { key: '⚽ 스포츠',    slots: 1, newsdataCategories: ['sports']                 },
  { key: '🎬 엔터',      slots: 1, newsdataCategories: ['entertainment']          },
];

function calcRecencyScore(publishedAt) {
  const h = (Date.now() - new Date(publishedAt).getTime()) / 3_600_000;
  if (h <= 2)  return 1.0;
  if (h <= 6)  return 0.8;
  if (h <= 12) return 0.6;
  if (h <= 24) return 0.4;
  return 0.2;
}

function calcTrendBoost(title, trendTerms) {
  if (!trendTerms?.length) return 0;
  const tl = title.toLowerCase();
  for (const { term, rank } of trendTerms) {
    const tl2 = term.toLowerCase();
    const matched = tl.includes(tl2) ||
      tl2.split(' ').filter(w => w.length >= 4).some(w => tl.includes(w));
    if (matched) return Math.max(0.3, 1.0 - (rank - 1) * 0.04);
  }
  return 0;
}

const STOPWORDS = new Set(['a','an','the','is','are','was','were','in','on','at','to','for','of','and','or','but','it']);

function titleSimilarity(t1, t2) {
  const tok = t => new Set(t.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w)));
  const w1 = tok(t1), w2 = tok(t2);
  const inter = [...w1].filter(w => w2.has(w)).length;
  const union = new Set([...w1, ...w2]).size;
  return union === 0 ? 0 : inter / union;
}

function deduplicate(items) {
  const unique = [];
  for (const item of items) {
    if (!unique.some(u => titleSimilarity(item.title, u.title) > 0.7)) unique.push(item);
  }
  return unique;
}

function calcGrowthLabel(item, trendTerms) {
  if (item.trendBoost > 0 && trendTerms.length > 0) {
    const tl = item.title.toLowerCase();
    for (const { term, traffic } of trendTerms) {
      const matched = tl.includes(term.toLowerCase()) ||
        term.toLowerCase().split(' ').filter(w => w.length >= 4).some(w => tl.includes(w));
      if (matched && traffic && traffic !== '0') return `${traffic} 검색`;
    }
  }
  return `${Math.round(item.finalScore * 100)}점`;
}

function main() {
  console.log('🧠 랭킹/분석 에이전트 시작...');
  console.log('='.repeat(50));

  if (!fs.existsSync(RAW_DATA_PATH)) {
    console.error('❌ raw_trends.json을 찾을 수 없습니다.');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(RAW_DATA_PATH, 'utf-8'));
  const trendTerms = rawData.trendTerms || [];
  const newsdataItems = rawData.sources.newsdata || [];

  console.log(`📂 Newsdata.io: ${newsdataItems.length}건`);
  if (trendTerms.length > 0) {
    console.log(`🔍 Google Trends: ${trendTerms.slice(0, 5).map(t => t.term).join(', ')} ...`);
  }

  const scoreItem = item => {
    const recency    = calcRecencyScore(item.publishedAt);
    const trendBoost = calcTrendBoost(item.title, trendTerms);
    const finalScore = recency * 0.6 + trendBoost * 0.4;
    return { ...item, recency, trendBoost, finalScore };
  };

  const scoredNewsdata = newsdataItems.map(scoreItem);

  const selected = [];
  const usedUrls = new Set();

  for (const slot of CATEGORY_SLOTS) {
    const pool = scoredNewsdata.filter(
      item => slot.newsdataCategories.includes(item.newsdataCategory)
    );

    const candidates = deduplicate(
      pool.filter(item => item.title && item.url && !usedUrls.has(item.url))
    ).sort((a, b) => b.finalScore - a.finalScore);

    const picks = candidates.slice(0, slot.slots);
    picks.forEach(item => {
      usedUrls.add(item.url);
      selected.push({ ...item, assignedCategory: slot.key });
    });

    console.log(`  ${slot.key}: ${picks.length}/${slot.slots}개`);
  }

  selected.sort((a, b) => b.finalScore - a.finalScore);

  const top20 = selected.map((item, i) => ({
    rank:        i + 1,
    title:       item.title,
    description: item.description,
    url:         item.url,
    source:      item.source,
    sourceName:  item.sourceName,
    category:    item.assignedCategory,
    publishedAt: item.publishedAt,
    finalScore:  Math.round(item.finalScore * 100) / 100,
    growth:      calcGrowthLabel(item, trendTerms),
    scores: {
      recency: Math.round(item.recency    * 100),
      trend:   Math.round(item.trendBoost * 100),
    },
  }));

  const outputPath = path.join(OUTPUT_DIR, 'top20.json');
  fs.writeFileSync(outputPath, JSON.stringify({ rankedAt: new Date().toISOString(), basedOn: rawData.collectedAt, top20 }, null, 2), 'utf-8');

  console.log('\n🏆 Top 5 미리보기:');
  top20.slice(0, 5).forEach(item => console.log(`  ${item.rank}. [${item.category}] ${item.title.slice(0, 60)}`));
  console.log(`\n✅ 랭킹 완료! Top 20 → ${outputPath}`);
}

main();
