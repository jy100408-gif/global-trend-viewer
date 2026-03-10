/**
 * 🎯 오케스트레이터 에이전트 (Orchestrator Agent)
 * 
 * 역할: 수집 → 랭킹 → 요약 → 프론트엔드 데이터 배포 전체 파이프라인 실행
 * 이 파일 하나만 실행하면 모든 에이전트가 순서대로 자동 실행됩니다.
 * 
 * 실행: node orchestrate.js
 * 스케줄: GitHub Actions에 의해 매일 KST 09:00 자동 실행
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.join(__dirname, '..');
// 프론트엔드가 읽을 최종 데이터 경로
// public/ 폴더에 저장 → 프론트가 fetch('/data/live_trends.json')으로 직접 접근 가능
// (Vite 빌드 없이 에이전트가 데이터만 교체해도 즉시 반영됨)
const FRONTEND_DATA_PATH = path.join(__dirname, '../../public/data/live_trends.json');

// ===== 로깅 유틸리티 =====
const LOG_LEVELS = { INFO: '📋', SUCCESS: '✅', ERROR: '❌', STEP: '▶️ ' };

function log(level, message) {
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  console.log(`[${timestamp}] ${LOG_LEVELS[level] || ''} ${message}`);
}

// ===== 에이전트 실행 함수 =====
function runAgent(agentName, workDir, command) {
  log('STEP', `${agentName} 실행 중...`);
  const startTime = Date.now();

  try {
    // 에이전트 디렉토리에서 명령 실행
    execSync(command, {
      cwd: workDir,
      stdio: 'inherit', // 하위 에이전트 출력을 현재 콘솔에 그대로 표시
      timeout: 120000,  // 최대 2분 타임아웃
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    log('SUCCESS', `${agentName} 완료 (${elapsed}초)`);
    return true;
  } catch (err) {
    log('ERROR', `${agentName} 실패: ${err.message}`);
    return false;
  }
}

// ===== 국가 감지 유틸리티 =====
// 뉴스 제목의 키워드를 분석하여 관련 국가와 국기 이모지를 반환
// 순서 중요: 더 구체적인 키워드(north korea)를 앞에 배치
const COUNTRY_MAP = [
  { keywords: ['north korea', 'kim jong'],              country: 'N.Korea',   flag: '🇰🇵', lat: 39.03, lng: 125.75 },
  { keywords: ['south korea', 'korea', 'korean', 'seoul', 'busan'], country: 'S.Korea', flag: '🇰🇷', lat: 37.56, lng: 126.98 },
  { keywords: ['ireland', 'irish'],                      country: 'Ireland',   flag: '🇮🇪', lat: 53.34, lng: -6.26 },
  { keywords: ['ukraine', 'ukrainian', 'zelensky', 'kyiv'], country: 'Ukraine', flag: '🇺🇦', lat: 50.45, lng: 30.52 },
  { keywords: ['russia', 'russian', 'moscow', 'kremlin', 'putin'], country: 'Russia', flag: '🇷🇺', lat: 55.75, lng: 37.61 },
  { keywords: ['china', 'chinese', 'beijing', 'shanghai', 'xi jinping'], country: 'China', flag: '🇨🇳', lat: 39.90, lng: 116.40 },
  { keywords: ['taiwan', 'taiwanese'],                   country: 'Taiwan',    flag: '🇹🇼', lat: 25.03, lng: 121.56 },
  { keywords: ['japan', 'japanese', 'tokyo', 'osaka'],  country: 'Japan',     flag: '🇯🇵', lat: 35.67, lng: 139.65 },
  { keywords: ['india', 'indian', 'modi', 'delhi', 'mumbai'], country: 'India', flag: '🇮🇳', lat: 28.61, lng: 77.20 },
  { keywords: ['uk', 'britain', 'british', 'england', 'london', 'scotland'], country: 'UK', flag: '🇬🇧', lat: 51.50, lng: -0.12 },
  { keywords: ['germany', 'german', 'berlin'],           country: 'Germany',   flag: '🇩🇪', lat: 52.52, lng: 13.40 },
  { keywords: ['france', 'french', 'paris', 'macron'],  country: 'France',    flag: '🇫🇷', lat: 48.85, lng: 2.35 },
  { keywords: ['israel', 'israeli', 'tel aviv'],        country: 'Israel',    flag: '🇮🇱', lat: 31.04, lng: 34.85 },
  { keywords: ['gaza', 'hamas', 'palestine', 'palestinian'], country: 'Palestine', flag: '🇵🇸', lat: 31.95, lng: 35.23 },
  { keywords: ['iran', 'iranian', 'tehran', 'irgc'],    country: 'Iran',      flag: '🇮🇷', lat: 35.68, lng: 51.38 },
  { keywords: ['canada', 'canadian', 'trudeau', 'ottawa'], country: 'Canada', flag: '🇨🇦', lat: 45.42, lng: -75.69 },
  { keywords: ['australia', 'australian', 'sydney', 'canberra'], country: 'Australia', flag: '🇦🇺', lat: -35.28, lng: 149.12 },
  { keywords: ['brazil', 'brazilian', 'brasilia'],      country: 'Brazil',    flag: '🇧🇷', lat: -15.82, lng: -47.92 },
  { keywords: ['mexico', 'mexican'],                    country: 'Mexico',    flag: '🇲🇽', lat: 19.43, lng: -99.13 },
  { keywords: ['europe', 'european', 'eu ', 'nato'],   country: 'Europe',    flag: '🇪🇺', lat: 50.85, lng: 4.35 },
  // 미국계 빅테크는 기본적으로 USA
  { keywords: ['openai', 'google', 'apple', 'microsoft', 'meta', 'oracle', 'amazon', 'tesla', 'nvidia'],
                                                         country: 'USA',      flag: '🇺🇸', lat: 37.77, lng: -122.41 },
  { keywords: ['us ', 'u.s.', 'america', 'american', 'white house', 'congress', 'senate',
                'florida', 'california', 'texas', 'new york', 'washington'],
                                                         country: 'USA',      flag: '🇺🇸', lat: 38.90, lng: -77.03 },
];

function detectCountry(title) {
  const t = title.toLowerCase();
  for (const { keywords, country, flag, lat, lng } of COUNTRY_MAP) {
    if (keywords.some(kw => t.includes(kw))) {
      return { country, flag, lat, lng };
    }
  }
  // 기본값: 글로벌 (특정 국가가 아니면 위경도는 null로 처리해 지구본에 찍지 않음)
  return { country: 'Global', flag: '🌐', lat: null, lng: null };
}

// ===== 요약된 데이터를 프론트엔드로 복사 =====
function publishToFrontend() {
  const sourcePath = path.join(AGENTS_DIR, 'summarizer/output/top20_summarized.json');

  if (!fs.existsSync(sourcePath)) {
    log('ERROR', '요약 데이터 파일이 없습니다');
    return false;
  }

  const dataDir = path.dirname(FRONTEND_DATA_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const data = JSON.parse(fs.readFileSync(sourcePath, 'utf-8'));

  const frontendData = {
    updatedAt: data.summarizedAt,
    displayDate: new Date(data.summarizedAt).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    trends: data.top20.map(item => {
      // 국가 키워드는 영문이므로 영문 원제(item.title) 우선 사용
      // item.koreanTitle은 AI가 번역한 한국어 제목으로 키워드 매칭 부정확
      const titleForDetect = item.title || item.koreanTitle;
      const { country, flag, lat, lng } = detectCountry(titleForDetect);

      return {
        rank: item.rank,
        title: item.koreanTitle || item.title,
        originalTitle: item.title,
        summary: item.summary,
        keywords: item.keywords || [],
        category: item.category,
        importance: item.importance || 'medium',
        url: item.url,
        source: item.sourceName,
        growth: item.growth,
        publishedAt: item.publishedAt,
        // 국기, 국가명 및 위/경도 (제목 키워드 기반 자동 감지)
        flag,
        country,
        lat,
        lng,
      };
    }),
  };

  fs.writeFileSync(FRONTEND_DATA_PATH, JSON.stringify(frontendData, null, 2), 'utf-8');
  log('SUCCESS', `프론트엔드 데이터 업데이트: ${FRONTEND_DATA_PATH}`);
  return true;
}

// ===== 실행 결과 로그 저장 =====
function saveRunLog(results, totalTime) {
  const logDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const logEntry = {
    date: today,
    runAt: new Date().toISOString(),
    totalTimeSeconds: totalTime,
    results,
  };

  const logPath = path.join(logDir, `run_${today}.json`);
  fs.writeFileSync(logPath, JSON.stringify(logEntry, null, 2), 'utf-8');
  log('INFO', `실행 로그 저장: ${logPath}`);
}

// ===== 의존성 자동 설치 =====
function ensureDependencies(agentDir) {
  const nodeModules = path.join(agentDir, 'node_modules');
  if (!fs.existsSync(nodeModules)) {
    log('INFO', `  의존성 설치 중: ${path.basename(agentDir)}`);
    execSync('npm install --silent', { cwd: agentDir, stdio: 'pipe' });
  }
}

// ===== 메인 파이프라인 =====
async function main() {
  const pipelineStart = Date.now();
  
  console.log('\n' + '='.repeat(60));
  log('INFO', '🌐 글로벌 트렌딩 뉴스 파이프라인 시작');
  console.log('='.repeat(60) + '\n');

  const steps = [
    {
      name: '1️⃣  데이터 수집',
      dir: path.join(AGENTS_DIR, 'collector'),
      cmd: 'node collect.js',
    },
    {
      name: '2️⃣  랭킹 분석',
      dir: path.join(AGENTS_DIR, 'ranker'),
      cmd: 'node rank.js',
    },
    {
      name: '3️⃣  AI 요약',
      dir: path.join(AGENTS_DIR, 'summarizer'),
      cmd: 'node summarize.js',
    },
  ];

  const results = {};
  let hasError = false;

  // 각 에이전트 순차 실행 (의존성 체인이 있으므로 병렬 불가)
  for (const step of steps) {
    console.log('\n' + '-'.repeat(40));

    try {
      ensureDependencies(step.dir);
    } catch { /* 의존성 설치 실패해도 계속 시도 */ }

    const success = runAgent(step.name, step.dir, step.cmd);
    results[step.name] = success ? '✅ 성공' : '❌ 실패';

    // 앞 단계 실패 시 이후 단계는 스킵 (데이터 의존성)
    if (!success) {
      hasError = true;
      log('ERROR', `${step.name} 실패로 파이프라인 중단`);
      break;
    }
  }

  // 프론트엔드 배포 (요약까지 성공했을 때만)
  if (!hasError) {
    console.log('\n' + '-'.repeat(40));
    log('STEP', '4️⃣  프론트엔드 데이터 배포...');
    const published = publishToFrontend();
    results['4️⃣  프론트엔드 배포'] = published ? '✅ 성공' : '❌ 실패';
    if (!published) hasError = true;
  }

  // 최종 결과 요약
  const totalTime = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  saveRunLog(results, parseFloat(totalTime));

  console.log('\n' + '='.repeat(60));
  log('INFO', `📊 파이프라인 결과 (총 ${totalTime}초)`);
  Object.entries(results).forEach(([step, result]) => {
    console.log(`  ${step}: ${result}`);
  });
  console.log('='.repeat(60) + '\n');

  if (hasError) {
    log('ERROR', '파이프라인 일부 실패. 로그를 확인하세요.');
    process.exit(1);
  } else {
    log('SUCCESS', '🎉 모든 파이프라인 완료!');
  }
}

main().catch(err => {
  log('ERROR', `치명적 오류: ${err.message}`);
  process.exit(1);
});
