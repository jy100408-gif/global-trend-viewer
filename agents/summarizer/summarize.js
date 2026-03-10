/**
 * ✍️ AI 요약 에이전트 (Summarizer Agent)
 *
 * 역할: Top 20 뉴스를 한국어로 3줄 요약
 * 입력: ../ranker/output/top20.json
 * 출력: ./output/top20_summarized.json
 *
 * 지원 모델 (AI_PROVIDER 환경변수로 선택):
 *   anthropic → Claude 3.5 Sonnet (최고 품질, 유료)
 *   gemini    → Gemini Flash (무료 티어 있음)
 *   openai    → GPT-4o-mini (폴백)
 *
 * 실행: node summarize.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const OUTPUT_DIR = path.join(__dirname, 'output');
const TOP20_PATH = path.join(__dirname, '../ranker/output/top20.json');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ===== 공통 프롬프트 =====
// 세 AI 모두 동일한 지침을 사용 → 일관된 출력 형식 보장
function buildPrompt(title, description) {
  return `다음 해외 뉴스를 한국 독자를 위해 요약해주세요.

제목: ${title}
내용: ${description || '(내용 없음 - 제목만 보고 요약)'}

아래 JSON 형식으로만 답변하세요. 다른 텍스트는 포함하지 마세요:
{
  "koreanTitle": "한국어 제목 (핵심을 담아 자연스럽게 번역)",
  "summary": "3줄 요약. 이 뉴스가 왜 중요한지, 무슨 일이 있었는지, 어떤 영향이 있는지 설명.",
  "keywords": ["키워드1", "키워드2", "키워드3"],
  "importance": "high | medium | low"
}`;
}

// AI 응답에서 JSON만 추출 (마크다운 코드블록 제거)
function parseJsonResponse(rawText) {
  const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(clean);
}

// ===== Gemini API =====
async function summarizeWithGemini(title, description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY가 없습니다');

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(title, description) }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
    }),
  });

  if (!res.ok) throw new Error(`Gemini API 오류: ${res.status} - ${await res.text()}`);

  const data = await res.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseJsonResponse(rawText);
}

// ===== Anthropic Claude API =====
async function summarizeWithAnthropic(title, description) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 없습니다');

  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 512,
      system: '당신은 해외 뉴스를 한국어로 요약하는 전문 에디터입니다. 항상 순수 JSON 형식으로만 답변하세요.',
      messages: [{ role: 'user', content: buildPrompt(title, description) }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API 오류: ${res.status} - ${await res.text()}`);

  const data = await res.json();
  return parseJsonResponse(data.content[0].text);
}

// ===== OpenAI API =====
async function summarizeWithOpenAI(title, description) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY가 없습니다');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '당신은 해외 뉴스를 한국어로 요약하는 전문 에디터입니다. 항상 JSON 형식으로만 답변하세요.' },
        { role: 'user', content: buildPrompt(title, description) },
      ],
      max_tokens: 512,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    }),
  });

  // OpenAI도 동일하게 응답 상태 검증
  if (!res.ok) throw new Error(`OpenAI API 오류: ${res.status} - ${await res.text()}`);

  const data = await res.json();
  return JSON.parse(data.choices[0].message.content);
}

// ===== 폴백: API 없을 때 원문 유지 =====
function fallbackSummarize(item) {
  return {
    koreanTitle: item.title,
    summary: item.description || '요약 없음 - 원문 링크를 확인하세요.',
    keywords: [],
    importance: 'medium',
    isFallback: true,
  };
}

// provider별 요약 함수 맵
const SUMMARIZERS = {
  anthropic: summarizeWithAnthropic,
  gemini: summarizeWithGemini,
  openai: summarizeWithOpenAI,
};

// provider별 최소 호출 간격 (ms)
// Gemini 무료 티어: 15 req/min → 4,000ms 이상 필요 (여유 포함 4,500ms)
// Anthropic / OpenAI: 유료 플랜, 300ms로 충분
const RATE_LIMIT_DELAY = {
  anthropic: 300,
  gemini:    4500,
  openai:    300,
};

// ===== 메인 실행 =====
async function main() {
  console.log('✍️  AI 요약 에이전트 시작...');
  console.log('='.repeat(50));

  if (!fs.existsSync(TOP20_PATH)) {
    console.error('❌ top20.json을 찾을 수 없습니다. 먼저 랭킹 에이전트를 실행하세요.');
    process.exit(1);
  }

  const top20Data = JSON.parse(fs.readFileSync(TOP20_PATH, 'utf-8'));
  console.log('📂 Top 20 뉴스 로드 완료');

  // 활성화된 API 키 확인
  const hasKey = {
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    gemini:    !!process.env.GEMINI_API_KEY,
    openai:    !!process.env.OPENAI_API_KEY,
  };

  console.log(`🔑 API 상태: Anthropic ${hasKey.anthropic ? '✅' : '❌'} | Gemini ${hasKey.gemini ? '✅' : '❌'} | OpenAI ${hasKey.openai ? '✅' : '❌'}`);

  // AI_PROVIDER 환경변수 우선, 없으면 키 있는 것 중 첫 번째 선택
  const provider = process.env.AI_PROVIDER ||
    Object.keys(hasKey).find(p => hasKey[p]) ||
    'fallback';

  console.log(`🎯 선택된 제공자: ${provider}`);
  if (provider === 'fallback') console.warn('⚠️  API 키 없음. 폴백 모드로 실행합니다.');

  const summarize = SUMMARIZERS[provider];
  const summarized = [];

  for (let i = 0; i < top20Data.top20.length; i++) {
    const item = top20Data.top20[i];
    console.log(`  [${i + 1}/${top20Data.top20.length}] ${item.title.slice(0, 50)}...`);

    let summary;
    try {
      summary = summarize
        ? await summarize(item.title, item.description)
        : fallbackSummarize(item);

      // 레이트 리밋 방지: provider별 최소 간격 유지
      if (summarize) await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY[provider] ?? 1000));
    } catch (err) {
      console.warn(`    ⚠️  요약 실패 (폴백 사용): ${err.message}`);
      summary = fallbackSummarize(item);
    }

    summarized.push({ ...item, ...summary });
  }

  // 결과 저장
  const outputPath = path.join(OUTPUT_DIR, 'top20_summarized.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    summarizedAt: new Date().toISOString(),
    basedOn: top20Data.rankedAt,
    top20: summarized,
  }, null, 2), 'utf-8');

  const fallbackCount = summarized.filter(i => i.isFallback).length;
  console.log(`\n✅ 요약 완료! AI 요약: ${summarized.length - fallbackCount}건, 폴백: ${fallbackCount}건`);
  console.log(`💾 저장: ${outputPath}`);
}

main().catch(err => {
  console.error('\n💥 예상치 못한 오류:', err);
  process.exit(1);
});
