# THERMO LAB — 열역학 탐구 실험실

학생들이 등온·등압·등적·단열 과정을 실험하고 이상기체 상태 방정식과 열역학 제1법칙을 연결해 탐구하는 한국어 웹 앱입니다. 흰 배경, 얇은 선, 주황색 포인트의 반응형 디자인을 사용합니다.

## 개발

Node.js 22 또는 24 LTS와 npm을 사용합니다.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

브라우저 검증에는 Playwright Chromium이 필요합니다. `npx playwright install chromium`으로 설치한 뒤 `npm run test:ui`를 실행하세요. 이미 설치된 Chromium은 `CHROMIUM_PATH=/usr/bin/chromium npm run test:ui`로 사용할 수 있습니다. 먼저 `npm run build`를 실행해야 합니다.

## Vercel 배포

1. 이 프로젝트를 GitHub 저장소에 커밋·푸시합니다.
2. Vercel에서 **Add New → Project**를 열어 `namju-kang30/PV-nRT`를 가져옵니다.
3. Framework Preset은 **Vite**, Root Directory는 저장소 루트, Build Command는 `npm run build`, Output Directory는 `dist`로 설정합니다. `vercel.json`에도 지정되어 있습니다.
4. Node.js 22 또는 24를 선택하고 **Deploy**를 누릅니다. 서버, API 키, 별도 환경 변수는 필요하지 않습니다.

폰트는 npm 패키지에서 로컬 번들로 제공하므로 외부 폰트 서버에 의존하지 않습니다. 기록과 탐구 노트는 학생이 사용하는 브라우저의 localStorage에 저장되며 서버로 전송되지 않습니다. 기록은 최근 8개까지 보관하고 CSV로 내보낼 수 있습니다. 다른 브라우저나 기기와 동기화되지 않으며 브라우저 데이터를 지우면 삭제됩니다.

## 물리 모형

- 준정적·마찰 없는 이상기체 과정. 내부 계산은 SI 단위를 사용하고 화면에는 L, kPa, K, kJ로 표시합니다.
- `PV = nRT`, `R = 8.314462618 J/(mol·K)`
- `ΔU = Q − W`. 열 흡수는 `Q > 0`, 기체가 외부에 하는 일은 `W > 0`입니다.
- `ΔU = nCᵥΔT`, `Cᵥ = R/(γ−1)`. 단원자 기체 `γ = 5/3`, 이원자 기체 `γ = 7/5`이며 비열은 일정하다고 가정합니다. 실제 기체의 비열 변화와 상전이는 모형에 포함하지 않습니다.
- 등온: `T = 일정`, `W = nRT ln(V₂/V₁)`, `ΔU = 0`, `Q = W`.
- 등압: `P = 일정`, `W = P(V₂−V₁)`, `V/T = 일정`.
- 등적: `V = 일정`, `W = 0`, `Q = ΔU`, `P/T = 일정`.
- 단열: `Q = 0`, `PVᵞ = 일정`, `TVᵞ⁻¹ = 일정`, `W = −ΔU`.
- P–V 그래프의 음영은 진행한 구간의 일의 면적을 나타냅니다. 압축에서는 일의 부호가 음수입니다.
- 분자 애니메이션은 개수와 크기를 축척으로 표현하지 않는 정성적 모형입니다. 평균 속도는 `√T`에 비례하며 재생 시간은 실제 물리적 시간과 대응하지 않습니다.

## 구성

React, Vite, SVG 그래프, Canvas 분자 애니메이션, Lucide 아이콘. 물리 계산은 `src/physics.js`에 분리되어 있으며 `tests/physics.test.js`가 보존 법칙, 분석 해, 팽창·압축을 검증합니다. 브라우저 검증은 `tests/ui.smoke.mjs`에 있습니다.
