# Global Trend Viewer - 프로젝트 오케스트레이션

이 파일은 프로젝트의 실행 프로세스, 아키텍처 및 AI 모델 운용에 관한 **최상위 지침**을 정의합니다.

## 1. AI 모델 운용 원칙 (Model Strategy)

- **설계 및 코딩 (Design & Coding)**:
  - 복잡한 아키텍처 설계, 핵심 로직 구현, 리팩토링 시에는 반드시 **Claude 3.5 Sonnet** 또는 **Claude 3 Opus** 수준의 고성능 모델을 사용한다.
  - 단순 반복 작업이나 마이너한 UI 수정의 경우 Gemini 1.5 Flash 등을 사용하여 효율성을 높일 수 있다.

- **데이터 요약 (Content Summarization)**:
  - 뉴스 요약의 품질이 서비스의 핵심이므로, 가급적 **Claude 3.5 Sonnet**을 사용하여 자연스러운 한국어 문체와 정확한 맥락 요약을 제공한다.

## 2. 기술 스택 (Tech Stack)

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Framer Motion
- **Backend (Agents)**: Node.js (ESM), Anthropic API, Gemini API, NewsAPI
- **CI/CD**: GitHub Actions, Vercel

## 3. 개발 워크플로우

1.  **Plan Mode**: 대규모 변경 전에는 반드시 `implementation_plan`을 작성하여 승인을 받는다.
2.  **Financial Integrity**: API 비용 발생이 큰 모델(Opus 등)을 사용할 때는 사전에 예상 비용이나 필요성을 간단히 언급한다.
3.  **Validation**: 모든 코드 변경 후에는 `npm run build` 또는 에이전트 개별 테스트를 통해 무결성을 검증한다.
