/**
 * TrendItem 타입 정의
 * 
 * 에이전트가 생성한 live_trends.json과 기존 mockData 모두 이 타입을 공유합니다.
 * live 데이터에는 없는 필드(lat, lng, flag 등)는 optional로 처리했어요.
 */

export interface TrendItem {
  rank: number;
  title: string;           // 한국어 제목 (AI 요약 시) or 원문 제목
  originalTitle?: string;  // 원문 영어 제목 (AI 요약된 경우)
  summary?: string;        // AI 한국어 3줄 요약
  aiSummary?: string;      // 기존 mockData 호환용 (summary와 동일 역할)
  keywords: string[];
  category: string;
  importance?: 'high' | 'medium' | 'low';
  url?: string;            // 원문 링크
  source?: string;         // 소스 (NewsAPI, Hacker News, Reddit 등)
  publishedAt?: string;    // 원문 발행 시각
  growth: string;          // 검색 급상승률 표시 (예: "+450%")
  // 글로브 표시용 (mock 데이터 호환)
  lat?: number;
  lng?: number;
  country?: string;
  flag?: string;
}

export interface LiveTrendsData {
  updatedAt: string;       // ISO 8601
  displayDate: string;     // "2026년 3월 9일 오전 09:00" 형식
  trends: TrendItem[];
}

// ===== Mock 데이터 (API 키 없거나 에이전트 미실행 시 폴백용) =====
export const mockTrends: TrendItem[] = [
  {
    rank: 1,
    title: "ChatGPT-5 유출 소식",
    originalTitle: "ChatGPT-5 Leak",
    summary: "OpenAI의 차세대 모델인 GPT-5의 성능과 출시일에 대한 유출 소식이 전 세계 개발자들 사이에서 기대를 모으고 있습니다. 기존 모델 대비 추론 능력이 획기적으로 개선될 것으로 보입니다.",
    category: "🤖 AI·테크",
    growth: "+450%",
    importance: "high",
    url: "https://openai.com",
    source: "Hacker News",
    lat: 37.7749, lng: -122.4194,
    country: "USA", flag: "🇺🇸",
    keywords: ["OpenAI", "GPT-5", "LLM", "Sam Altman"]
  },
  {
    rank: 2,
    title: "유로 2026 예선 결과",
    originalTitle: "Euro 2026 Qualifiers",
    summary: "독일에서 개최될 유로 2026의 예선 결과가 발표되면서 축구 팬들의 검색량이 급증했습니다. 주요 국가들의 본선 진출 여부에 관심이 쏠립니다.",
    category: "⚽ 스포츠",
    growth: "+320%",
    importance: "high",
    url: "https://www.uefa.com",
    source: "NewsAPI",
    lat: 52.5200, lng: 13.4050,
    country: "Germany", flag: "🇩🇪",
    keywords: ["Euro 2026", "UEFA", "Football", "Berlin"]
  },
  {
    rank: 3,
    title: "K-Pop 글로벌 투어 발표",
    originalTitle: "K-Pop Global Tour",
    summary: "주요 K-Pop 그룹들의 월드투어 일정이 공개되어 전세계 팬들이 열광하고 있습니다. SNS에서 관련 해시태그가 실시간 트렌딩 1위를 기록했습니다.",
    category: "🎬 엔터",
    growth: "+210%",
    importance: "medium",
    url: "https://www.billboard.com",
    source: "Reddit",
    lat: 37.5665, lng: 126.9780,
    country: "South Korea", flag: "🇰🇷",
    keywords: ["K-POP", "Seoul", "World Tour", "Global Wave"]
  },
  {
    rank: 4,
    title: "EU 친환경 에너지 펀드 조성",
    originalTitle: "Sustainable Energy Breakthrough",
    summary: "유럽 연합이 탄소 중립을 위해 대규모 친환경 에너지 펀드를 조성한다고 발표했습니다. 수소 에너지와 태양광 관련 기업들의 주가가 큰 영향을 받았습니다.",
    category: "🔬 과학·환경",
    growth: "+180%",
    importance: "high",
    url: "https://ec.europa.eu",
    source: "NewsAPI",
    lat: 50.8503, lng: 4.3517,
    country: "EU", flag: "🇪🇺",
    keywords: ["SDGs", "Net Zero", "EU Commission", "Green Fund"]
  },
  {
    rank: 5,
    title: "도쿄 패션 위크 트렌드",
    originalTitle: "Tokyo Fashion Week",
    summary: "도쿄 패션 위크에서 공개된 레트로-퓨처리즘 스타일이 전 세계 SNS에서 확산 중입니다. 관련 의류 브랜드들의 온라인 매출이 급성장했습니다.",
    category: "🎬 엔터",
    growth: "+150%",
    importance: "medium",
    url: "https://www.vogue.com",
    source: "NewsAPI",
    lat: 35.6762, lng: 139.6503,
    country: "Japan", flag: "🇯🇵",
    keywords: ["Harajuku", "Retro-Future", "Fashion Week", "Y2K"]
  },
  {
    rank: 6,
    title: "아마존 보호법안 통과",
    originalTitle: "Amazon Rainforest Policy",
    summary: "브라질 정부가 아마존 밀림 보호를 위한 강력한 새 법안을 통과시켰습니다. 불법 벌채 처벌이 대폭 강화되고 원주민 보호 구역이 확대됩니다.",
    category: "🌍 정치·외교",
    growth: "+130%",
    importance: "high",
    url: "https://www.reuters.com",
    source: "NewsAPI",
    lat: -15.7975, lng: -47.8919,
    country: "Brazil", flag: "🇧🇷",
    keywords: ["Amazon", "Environment", "Protection Bill", "Lula"]
  },
  {
    rank: 7,
    title: "런던 디지털 자산 규제 샌드박스",
    originalTitle: "London Finance Summit",
    summary: "런던 시티가 디지털 자산 거래의 글로벌 허브로 거듭나기 위한 규제 샌드박스를 도입했습니다. 전 세계 핀테크 스타트업들이 주목하고 있습니다.",
    category: "💰 경제·금융",
    growth: "+110%",
    importance: "medium",
    url: "https://www.ft.com",
    source: "NewsAPI",
    lat: 51.5074, lng: -0.1278,
    country: "UK", flag: "🇬🇧",
    keywords: ["Fintech", "The City", "Digital Asset", "London"]
  },
  {
    rank: 8,
    title: "NASA 달 탐사 미션 업데이트",
    originalTitle: "NASA Moon Mission",
    summary: "NASA의 아르테미스 프로그램의 최신 일정이 공개되었습니다. 2027년 유인 달 착륙을 향한 구체적인 로드맵이 제시되면서 전세계의 이목이 집중되었습니다.",
    category: "🔬 과학·환경",
    growth: "+95%",
    importance: "high",
    url: "https://www.nasa.gov",
    source: "Hacker News",
    lat: 28.5623, lng: -80.5774,
    country: "USA", flag: "🇺🇸",
    keywords: ["NASA", "Artemis", "Moon", "Space"]
  },
  {
    rank: 9,
    title: "두바이 테크 위크 자율주행 공개",
    originalTitle: "Dubai Tech Week",
    summary: "두바이에서 개최된 GITEX 기술 주간에서 자율 주행 택시와 스마트 시티 기술이 대거 공개되었습니다. 중동의 기술 투자가 더욱 가속화되고 있습니다.",
    category: "🤖 AI·테크",
    growth: "+88%",
    importance: "medium",
    url: "https://www.gitex.com",
    source: "NewsAPI",
    lat: 25.2048, lng: 55.2708,
    country: "UAE", flag: "🇦🇪",
    keywords: ["GITEX", "Smart City", "Tech Week", "Self-Driving"]
  },
  {
    rank: 10,
    title: "스위스 프라이빗 뱅크 암호화폐 수탁",
    originalTitle: "Swiss Banking Crypto Update",
    summary: "스위스 주요 프라이빗 뱅크들이 암호화폐 수탁 서비스를 공식 개시했습니다. 전통 금융권의 디지털 자산 수용이 빠르게 확산되고 있다는 신호로 해석됩니다.",
    category: "💰 경제·금융",
    growth: "+75%",
    importance: "medium",
    url: "https://www.bloomberg.com",
    source: "NewsAPI",
    lat: 47.3769, lng: 8.5417,
    country: "Switzerland", flag: "🇨🇭",
    keywords: ["Swiss Bank", "Crypto", "Wealth Management", "Zurich"]
  },
  {
    rank: 11,
    title: "싱가포르 AI 안전법 세계 최초 제정",
    originalTitle: "Singapore AI Safety",
    summary: "싱가포르 정부가 세계 최초로 AI 거버넌스 및 안전 지침을 법제화했습니다. 글로벌 빅테크 기업들과의 협력 강화가 기대됩니다.",
    category: "🌍 정치·외교",
    growth: "+70%",
    importance: "high",
    url: "https://www.straitstimes.com",
    source: "NewsAPI",
    lat: 1.3521, lng: 103.8198,
    country: "Singapore", flag: "🇸🇬",
    keywords: ["AI Governance", "Safety", "Big Tech", "Policy"]
  },
  {
    rank: 12,
    title: "뭄바이 발리우드 시상식",
    originalTitle: "Mumbai Film Awards",
    summary: "인도 발리우드 최대 시상식이 뭄바이에서 성황리에 열렸습니다. OTT 전용 영화들의 수상 성과가 두드러지며 인도 영화 시장의 변화가 감지됩니다.",
    category: "🎬 엔터",
    growth: "+68%",
    importance: "medium",
    url: "https://www.hindustantimes.com",
    source: "Reddit",
    lat: 19.0760, lng: 72.8777,
    country: "India", flag: "🇮🇳",
    keywords: ["Bollywood", "Cinema", "Awards", "OTT"]
  },
  {
    rank: 13,
    title: "캐나다 토론토 금리 동결 후 부동산 반등",
    originalTitle: "Toronto Housing Update",
    summary: "캐나다 중앙은행 금리 동결 발표 이후 토론토 부동산 시장에 매수세가 살아나고 있습니다. 주택 공급 확대 정책과 맞물려 시장 변화가 주목받습니다.",
    category: "💰 경제·금융",
    growth: "+65%",
    importance: "medium",
    url: "https://www.theglobeandmail.com",
    source: "NewsAPI",
    lat: 43.6532, lng: -79.3832,
    country: "Canada", flag: "🇨🇦",
    keywords: ["Housing", "Interest Rate", "Toronto", "Bank of Canada"]
  },
  {
    rank: 14,
    title: "멕시코-북미 새 무역 협정 체결",
    originalTitle: "Mexico Trade Deal",
    summary: "멕시코와 북미 연합 간의 새로운 무역 협정이 체결되었습니다. 제조업 니어쇼어링 기지로서 멕시코의 위상이 더욱 강화될 것으로 전망됩니다.",
    category: "🌍 정치·외교",
    growth: "+60%",
    importance: "medium",
    url: "https://www.reuters.com",
    source: "NewsAPI",
    lat: 19.4326, lng: -99.1332,
    country: "Mexico", flag: "🇲🇽",
    keywords: ["Nearshoring", "USMCA", "Trade", "Manufacturing"]
  },
  {
    rank: 15,
    title: "암스테르담 도심 자동차 전면 금지",
    originalTitle: "Amsterdam Bike Plan",
    summary: "암스테르담 시의회가 도심 자동차 통행을 전면 금지하고 자전거 전용 도로를 2배로 늘리는 혁신적 도시 계획을 발표했습니다. 지속 가능한 미래 도시의 모델이 될 전망입니다.",
    category: "🔬 과학·환경",
    growth: "+55%",
    importance: "medium",
    url: "https://www.dutchnews.nl",
    source: "Reddit",
    lat: 52.3676, lng: 4.9041,
    country: "Netherlands", flag: "🇳🇱",
    keywords: ["Biking", "Urban Planning", "Sustainability", "No Car Zone"]
  },
  {
    rank: 16,
    title: "오슬로 평화 정상회담",
    originalTitle: "Oslo Peace Summit",
    summary: "오슬로 평화 포럼에서 글로벌 분쟁 지역의 휴전 가능성이 논의되었습니다. 각국 정상이 모여 외교적 해결책을 모색하는 자리가 마련되었습니다.",
    category: "🌍 정치·외교",
    growth: "+50%",
    importance: "high",
    url: "https://www.bbc.com",
    source: "NewsAPI",
    lat: 59.9139, lng: 10.7522,
    country: "Norway", flag: "🇳🇴",
    keywords: ["Peace", "Oslo", "Diplomacy", "Summit"]
  },
  {
    rank: 17,
    title: "호주 시드니 스타트업 페스티벌",
    originalTitle: "Sydney Startup Fest",
    summary: "시드니에서 열린 스타트업 페스티벌이 호주 전역의 투자 자금을 끌어모으고 있습니다. 에듀테크와 핀테크 분야 스타트업들의 두각이 특히 두드러집니다.",
    category: "💰 경제·금융",
    growth: "+45%",
    importance: "low",
    url: "https://www.smh.com.au",
    source: "Reddit",
    lat: -33.8688, lng: 151.2093,
    country: "Australia", flag: "🇦🇺",
    keywords: ["Startup", "Venture Capital", "Edutech", "Sydney"]
  },
  {
    rank: 18,
    title: "방콕 아시아 최대 푸드 엑스포",
    originalTitle: "Bangkok Food Expo",
    summary: "태국 방콕에서 열린 아시아 최대 푸드 엑스포에서 '퓨전 타이 푸드'가 주목받았습니다. 전 세계 미식가들의 발길이 이어지며 태국 관광 산업이 활기를 띠고 있습니다.",
    category: "🎬 엔터",
    growth: "+40%",
    importance: "low",
    url: "https://www.bangkokpost.com",
    source: "NewsAPI",
    lat: 13.7563, lng: 100.5018,
    country: "Thailand", flag: "🇹🇭",
    keywords: ["Thai Food", "Expo", "Gourmet", "Tourism"]
  },
  {
    rank: 19,
    title: "케이프타운 태양광 전력 전환 선언",
    originalTitle: "Cape Town Solar",
    summary: "남아프리카 케이프타운이 태양광 에너지 전면 도입으로 만성적인 전력 부족 문제를 해결하겠다고 선언했습니다. 아프리カ 대륙의 녹색 에너지 전환을 이끌 사례로 주목됩니다.",
    category: "🔬 과학·환경",
    growth: "+35%",
    importance: "medium",
    url: "https://www.dailymaverick.co.za",
    source: "Reddit",
    lat: -33.9249, lng: 18.4241,
    country: "South Africa", flag: "🇿🇦",
    keywords: ["Solar", "Africa", "Power Grid", "Investment"]
  },
  {
    rank: 20,
    title: "스페이스X 스타십 화성 탐사 일정 확정",
    originalTitle: "SpaceX Mars Prep",
    summary: "SpaceX의 스타십이 다음 화성 탐사 테스트 일정을 확정했습니다. 인류의 첫 화성 유인 비행을 향한 대장정이 본격적으로 시작됩니다.",
    category: "🔬 과학·환경",
    growth: "+30%",
    importance: "high",
    url: "https://www.spacex.com",
    source: "Hacker News",
    lat: 25.9973, lng: -97.1558,
    country: "USA", flag: "🇺🇸",
    keywords: ["SpaceX", "Elon Musk", "Starship", "Mars"]
  }
];
