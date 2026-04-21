# Blog Redesign — Jekyll (Minimal Mistakes) → Astro

**Date:** 2026-04-21
**Owner:** urunimi (Ben)
**Scope:** https://urunimi.github.io 전면 리디자인 + 플랫폼 이전

---

## 1. Goals & Non-goals

### Goals
- 레퍼런스: **joshwcomeau.com** (따뜻한 파스텔 감성) + **fasterthanli.me** (타이포·코드 블록 퀄리티)
- Light 테마 단일 고정, warm cream 배경 + 낮은 채도 액센트 3종
- 본문 타이포그래피 중심 레이아웃 (좌측 프로필 사이드바 제거)
- 코드 블록 품질 대폭 향상 (Expressive Code, 파일명/라인 하이라이트/diff/terminal frame)
- 미니멀 포인트 수준의 애니메이션 (hero 배경 블롭 + scroll fade-in 수준)
- 긴 기술 글 가독성을 위한 우측 sticky TOC
- 기존 포스트 URL 전량 보존

### Non-goals
- 다크모드 (light 단일 고정)
- joshwcomeau 수준의 인터랙티브 컴포넌트·커스텀 일러스트
- 포스트 내 React 컴포넌트 대거 삽입 (필요 시 점진 도입)
- 기존 Disqus 댓글 이력 보존 (Giscus로 전환, 과거 댓글 포기)
- 이미지 전량 최적화 (외부 raw URL 유지, 점진 이전은 추후)
- 영문 About 페이지 (한국어만)

---

## 2. Tech Stack

| 계층 | 선택 | 이유 |
|---|---|---|
| SSG | **Astro 5.x** | MDX island architecture, 2026 de-facto, GitHub Pages 호환 |
| 콘텐츠 포맷 | **MD + MDX (선택적)** | 기존 `.md` 그대로, 필요 시 파일만 `.mdx`로 업그레이드 |
| 패키지 매니저 | **pnpm** | Astro 공식 권장 |
| 스타일 | **CSS custom properties + Tailwind** | 토큰 중앙집중 + 유틸 |
| 폰트 | **Pretendard (본문/헤딩), JetBrains Mono (코드)** | 한글 de-facto + 개발자 친화 모노 |
| 코드 하이라이트 | **astro-expressive-code** (theme: `github-light`) | 파일명·라인·diff·terminal frame 내장 |
| 다이어그램 | **rehype-mermaid** | 빌드 시 정적 SVG, 런타임 JS 0 |
| Callout | **remark-github-admonitions** | `> [!NOTE|TIP|IMPORTANT|WARNING|CAUTION]` |
| 댓글 | **Giscus** (GitHub Discussions) | 광고 없음, 오픈소스, 관리 간편 |
| 검색 | **Pagefind** | 빌드 시 정적 인덱스, 런타임 경량 |
| RSS | **@astrojs/rss** → `/feed.xml` | 기존 경로 호환 |
| Sitemap | **@astrojs/sitemap** → `/sitemap.xml` | 자동 생성 |
| 애니메이션 | **Motion One** | 경량(3KB), reduced-motion 기본 대응 |
| 배포 | **GitHub Actions + actions/deploy-pages** | Pages Source: GitHub Actions |

---

## 3. Visual Design

### Color Palette (Option C — mono-ish, Material-based)
모든 토큰은 `:root` CSS custom property 로 등록:

```css
:root {
  --bg: #FDF8F3;            /* warm cream */
  --text: #2B2424;          /* deep warm gray */
  --text-muted: #706962;
  --border: #E8DDD0;        /* warm tan */
  --code-bg: #F3ECE0;

  --accent-primary: #455A64; /* Blue Grey 700 — links, CTA */
  --accent-secondary: #00897B; /* Teal 600 — categories, tags */
  --accent-tertiary: #FFA000;  /* Amber 700 — callout bg, highlight only (텍스트 불가) */
}
```

- **Primary(Blue Grey 700) 와 Text(`#2B2424`) 대비가 약함** → 링크는 항상 underline 필수, hover 시 `--accent-secondary` (Teal 600) 로 전환 규칙
- Amber 700 은 대비율 1.8:1 로 텍스트 불가, 오직 callout 배경·highlight·border 용

### Typography
- 본문/헤딩: **Pretendard** (`Pretendard Variable`)
- 코드: **JetBrains Mono**
- 본문 기준 16~17px, line-height 1.75, 본문 `max-width: 680px`
- 헤딩 스케일: h1 2.25rem / h2 1.75rem / h3 1.375rem, `font-weight: 700`
- 한글·영문 혼용 시 자간 조정 최소 (Pretendard 자체 튜닝 활용)

### Mood
"따뜻한 도서관" 지향. warm cream 배경 + 절제된 타이포 + 카테고리 칩·링크·callout 에만 컬러. hero 섹션에만 은은한 SVG 블롭 배경 (Teal/Amber 투명도 낮게).

---

## 4. Layout & Pages

### 4.1 Global
**Header (sticky, 얇음):**
- 좌: `Ben'space` 로고(텍스트)
- 우: `Posts` · `Categories` · `About` · 🔍 검색 트리거(⌘K)

**Footer:**
- GitHub · Instagram · Email 아이콘 + RSS 링크
- 저작권 (현재 `© 유병우` 정도)

### 4.2 Home (`/`)
**연대기 스타일 심플 목록**. 카드 그리드 아님.

구조:
```
[Hero: 짧은 인사 + 한 줄 태그라인, 뒤에 은은한 SVG 블롭]

2026
  · 2026.04.21  정각마다 돌아가는 리그레션 테스트 — 설계 이야기  [qa, testing, ci]
  · 2026.03.29  cmux dev setup                                      [tools]
2024
  · 2024.08.21  MyPy ignore script                                  [python]
...
```
- 각 행: 날짜 · 제목 · 카테고리 칩
- 스크롤 시 각 행 fade-in (stagger 50ms)
- Hero 높이 `max 60vh`, 스크롤 내리면 바로 목록

### 4.3 Post (`/[category1]/[category2]/[slug]/`)
좌측 프로필 사이드바 **완전 제거**. 3열 구조:
- 좌측: 여백 (빈 공간, 데스크톱에서 여유)
- 중앙: 본문 `max-width: 680px`
- 우측: **sticky TOC** (h2 + h3 자동 수집)

포스트 헤더:
- 제목 (h1)
- 메타: 날짜 · 읽는 시간 · 카테고리 칩
- 구분선

포스트 풋터:
- 이전/다음 포스트 링크
- Giscus 댓글 창

**모바일(<768px):** TOC는 제목 바로 아래 `<details>` 접힘, 좌측 여백 제거, 본문만 full width.

### 4.4 Posts List (`/posts/`) / Category (`/categories/[name]/`)
Home 과 동일한 연대기 스타일 목록. Category 페이지는 해당 카테고리만 필터.

### 4.5 About (`/about/`)
단일 페이지, 프로필 + 관심사 + 주제 + 외부 링크.

**확정된 카피:**
```markdown
## About

안녕하세요, 유병우(Ben) 입니다.
지속 가능한 코드와 이해하기 쉬운 설계에 관심이 많은 개발자입니다.

10년 넘게 수억 명 규모의 메신저·광고 플랫폼을 만들며 배운 한 가지는,
**"지금 편하게 쓰느냐보다 나중에 고치기 쉬운가"** 가
어떤 기술을 쓰느냐보다 먼저라는 것이었습니다.

### 관심사

- **언어·프레임워크에 구속되지 않는 설계** — Go, Kotlin, Python
  어느 쪽이든 Clean Architecture 와 SOLID 가 통하는 이유를 좋아합니다.
  도구는 바뀌어도 원칙은 남으니까요.
- **과하지 않은 설계** — 확장 가능성은 고려하지만 확장을 미리 구현하지
  않습니다. KISS·YAGNI 를 실무에서 지켜내는 판단에 관심이 많습니다.
- **다음 사람이 편한 코드** — 모듈 경계와 의존성 방향이 깔끔하면
  대부분의 문제가 단순해집니다.
- **설계 의도를 기록으로** — 이 블로그는 "왜 그렇게 만들었는지" 를
  남기는 공간입니다. 툴 사용법보다 구조적 결정의 배경을 주로 씁니다.

### 주로 다루는 주제

Clean Architecture · Domain-driven design · SOLID / KISS / YAGNI ·
Go / Kotlin / Python · Kubernetes / OCI / ArgoCD · 테스트·품질 파이프라인

---

[Resume](<resume-url>) · [GitHub](https://github.com/urunimi) · [Email](mailto:byungwoo.yoo@datarize.ai)
```

- `<resume-url>` 은 추후 사용자가 제공하면 교체 (placeholder)
- 구직 관련 시그널 문장 없음

---

## 5. Content Elements

### 5.1 Code Block (Expressive Code)
테마: `github-light`. 지원 기능:
- 파일명 헤더: ` ```ts title="src/foo.ts" `
- 라인 하이라이트: ` ```ts {3,5-7} `
- Diff: `+` / `-` prefix
- Terminal frame: ` ```bash ` 자동 chrome
- 복사 버튼: 기본 내장

### 5.2 Callout (GitHub Admonitions)
기존 `> 💡 ...` 패턴은 마이그레이션 스크립트로 `> [!TIP]\n> ...` 로 일괄 변환.

5가지 타입별 스타일:
| Type | 색상 | 용도 |
|---|---|---|
| `[!NOTE]` | Blue Grey 700 | 일반 부연 |
| `[!TIP]` | Teal 600 | 팁·권장 |
| `[!IMPORTANT]` | Amber 700 배경 + Blue Grey 텍스트 | 핵심 강조 |
| `[!WARNING]` | Amber 800 border | 주의 |
| `[!CAUTION]` | Red 700 (한 색만 표준 벗어남) | 위험·피해야 할 것 |

### 5.3 Mermaid
`rehype-mermaid` + playwright 빌드 시 SVG 변환. 런타임 JS 불필요. 기존 kiss-yagni 포스트의 mermaid 블록 그대로 호환.

### 5.4 Image
기존 외부 URL (`raw.githubusercontent.com/urunimi/urunimi.github.io/main/_posts/...`) 전량 그대로 유지. Astro `<Image>` 최적화 미적용. 신규 포스트부터는 `public/images/posts/<slug>/` 규칙 권장.

### 5.5 TOC
- MDX `headings` 메타데이터에서 h2/h3 자동 수집
- 우측 sticky 컴포넌트, 현재 뷰포트 섹션 하이라이트
- 전 포스트 기본 ON (기존 `toc: true` front matter 무시 가능)
- 모바일은 `<details>` 접힘

### 5.6 Table / Blockquote / List
기본 Markdown, Tailwind typography 기반 스타일 세팅.

---

## 6. Migration Plan

### 6.1 URL 보존
현재 permalink: `/:categories/:title/` → Astro 에서 재현.

구현:
- `src/content/posts/` 에 기존 `_posts/*.md` 이동
- `src/pages/[...slug].astro` 동적 라우트
- `getStaticPaths`: `params.slug = [...categories, entry.slug].join('/')`
- `trailingSlash: "always"` 설정

예상 URL (불변):
- `/architecture/design-pattern/kiss-yagni/`
- `/architecture/design-pattern/solid/`
- `/git/vcs/git-pr/`
- `/intro/intro-myself/`
- `/qa/testing/ci/regression-test/`

### 6.2 Front Matter 변환 (1회 node 스크립트)
```yaml
# Before (Jekyll)
toc: true
title: "SOLID 원칙"
date: 2023-05-06
categories: [ architecture, design-pattern ]

# After (Astro content collection)
title: "SOLID 원칙"
date: 2023-05-06
categories: [architecture, design-pattern]
```
- `toc` 제거 (전역 자동)
- `layout` 필드 있으면 제거

Astro content collection schema:
```ts
const posts = defineCollection({
  schema: z.object({
    title: z.string(),
    date: z.date(),
    categories: z.array(z.string()).min(1),
  }),
});
```

### 6.3 Callout 변환 (1회 sed/node 스크립트)
```
> 💡 클래스의 필드를 추가할 때...
    ↓
> [!TIP]
> 클래스의 필드를 추가할 때...
```
기존 포스트 중 `> 💡` 패턴을 가진 파일만 대상으로 변환.

### 6.4 Disqus → Giscus
- GitHub Discussions 활성화 (repo Settings)
- Giscus 앱 설치, `repo-id` / `category-id` 취득
- `<Giscus>` 컴포넌트 주입 (PostLayout 하단)
- **기존 Disqus 댓글은 손실 감수** (확정)

### 6.5 Feed / Sitemap
- `src/pages/feed.xml.ts` — `@astrojs/rss` 로 `/feed.xml` 생성 (기존 경로 동일)
- `astro.config.mjs` 에 `sitemap()` 통합 → `/sitemap.xml`

### 6.6 Search (Pagefind)
- build 후 `pagefind --site dist` post-step
- ⌘K (`Cmd/Ctrl+K`) 단축키 + 모달 컴포넌트
- 인덱스 대상: 포스트 본문 + 제목 + 카테고리

### 6.7 Deploy
- `.github/workflows/deploy.yml`: Node 20 + pnpm + `astro build` + `actions/deploy-pages`
- Pages Source: **"Deploy from branch"** → **"GitHub Actions"** (수동 변경 필요, 1회)
- `astro.config.mjs`: `site: "https://urunimi.github.io"`, `trailingSlash: "always"`

### 6.8 Jekyll 파일 정리 (삭제 대상)
- `_config.yml`, `_data/`, `_sass/`, `assets/css/`, `assets/js/`, `banner.js`, `feed.xml`, `Gemfile`, `package.json`(현재 Jekyll 용), `package-lock.json`, `Rakefile`, `sitemap.xml`, `staticman.yml`, `google*.html`, `robots.txt`
- 보존: `_posts/` (→ `src/content/posts/` 이동 후 삭제), `LICENSE`, `README.md`, `.gitignore` (내용 갱신)

---

## 7. Verification Checklist (main 머지 전)

- [ ] 모든 기존 URL 200 응답 (25+ 포스트)
- [ ] 이미지 전량 로드 (외부 raw URL)
- [ ] Mermaid 다이어그램 SVG 렌더 (kiss-yagni 포스트)
- [ ] Callout 5종 타입 스타일 전부 확인
- [ ] Expressive Code 파일명·diff·terminal frame 동작
- [ ] `/feed.xml` W3C validator 통과
- [ ] `/sitemap.xml` 유효
- [ ] Giscus 댓글 창 로드 (테스트 댓글 작성 가능 확인)
- [ ] Pagefind 검색 동작 (한국어 쿼리 포함)
- [ ] Pretendard 한글 렌더
- [ ] JetBrains Mono 코드 블록 렌더
- [ ] 모바일 768px 이하: TOC 접힘, 좌측 여백 제거
- [ ] Lighthouse: Performance 90+, Accessibility 95+, SEO 95+
- [ ] prefers-reduced-motion 대응 (애니메이션 off)

---

## 8. Risks & Mitigation

| 리스크 | 영향 | 완화 |
|---|---|---|
| Disqus 댓글 손실 | 기존 댓글 사라짐 | 사용자 확정 — 손실 감수 |
| GitHub raw URL 이미지 의존 | 장기 rate limit / 정책 변경 가능성 | 당장은 유지, 신규 포스트부터 `public/images/` 권장 |
| Google 재색인 지연 | 며칠간 검색 순위 흔들림 가능 | URL 동일하므로 임팩트 작음. sitemap 재제출 |
| Pages Source 설정 변경 | `git revert` 로 복원 안 됨 | 배포 체크리스트에 **수동 Settings 변경** 단계 명시. 롤백 시 같은 경로 역순 |
| Jekyll `_config.yml` 삭제 후 main 머지 전 사고 | Pages 빌드 실패 가능 | 별도 브랜치에서 모든 파일·워크플로 완비 후 PR 머지 |
| Pretendard / JetBrains Mono CDN 장애 | 폰트 fallback | `font-family` 에 시스템 폰트 fallback 명시 |

---

## 9. Rollback Plan

**롤백 절차 (문제 발견 시):**
1. `git revert <merge-commit>` on main
2. GitHub repo Settings → Pages → Source 를 **"Deploy from branch: main / (root)"** 로 변경
3. 2~3분 후 Jekyll 자동 빌드 복원 확인

`git revert` 만으로는 Pages Source 설정이 복원되지 않으므로 **2번 단계 필수**.

---

## 10. Out of Scope (Future)

- 이미지 `public/images/` 점진 이전 및 `<Image>` 최적화
- 다크모드 토글 (요구 발생 시)
- 영문 About / 포스트 번역
- 포스트 내 인터랙티브 컴포넌트 (diagram, demo)
- `/resume` 별도 페이지 (현재는 외부 링크)
- OG 이미지 자동 생성 (Satori/OG-image 서비스)
- 사내용 분석·대시보드 (Plausible/Umami 등)

---

## 11. Implementation Order

1. `astro` 브랜치 생성
2. Astro 프로젝트 scaffold + integrations 설치
3. Jekyll 파일 삭제 (`_posts` 제외)
4. `_posts/*.md` → `src/content/posts/` 이동
5. Front matter 변환 스크립트 실행
6. Callout `💡` → `[!TIP]` 변환 스크립트 실행
7. 디자인 토큰 (CSS vars, Tailwind config)
8. Layout 컴포넌트 (`BaseLayout`, `PostLayout`)
9. 페이지 구현 (`index`, `[...slug]`, `posts`, `categories/[name]`, `about`)
10. 공통 컴포넌트 (`Header`, `Footer`, `Toc`, `Hero`, `PostList`, `Giscus`, `Search`)
11. Expressive Code / Mermaid / Admonitions 스타일 주입
12. Pagefind 통합
13. Motion One 애니메이션 (hero blob + scroll fade-in)
14. `@astrojs/rss` · `@astrojs/sitemap` 통합
15. GitHub Actions workflow 작성
16. Preview 배포 (PR preview or 별도 repo/path)
17. Verification checklist 수행
18. PR 생성 → main 머지 → Pages Source 수동 변경
19. 프로덕션 검증 → 문제 시 Rollback 절차

각 단계는 후속 writing-plans 스킬에서 task 단위로 세분화.
