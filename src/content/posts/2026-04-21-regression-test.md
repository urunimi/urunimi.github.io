---
toc: true
title: "정각마다 돌아가는 리그레션 테스트 — 설계 이야기"
date: 2026-04-21
categories: [qa, testing, ci]
---

웹 서비스 개발팀에서 가장 자주 나오는 질문 중 하나가 "이거 배포하면 기존 기능 안 깨질까?" 입니다. 특히 소프트웨어는 소프트하기 때문에 A 기능을 고치면 B나 C 기능이 깨지는 경우가 많습니다. 문제는 B나 C 기능에 QA 리소스를 투입하지 못하고 운영 환경에서 고객이 먼저 발견하는 경우가 많다는 것입니다. 기존 기능이 다 잘 돌아가는지 점검하려면, 팀 규모가 일정한데 새로운 기능이 계속 추가되는 상황에서는 QA 리소스가 기능 수에 비례해 선형적으로 증가해야 하는 상황인 거죠.

이 글은 QA 리소스가 기능 추가 속도에 끌려가지 않도록, 이미 개발된 기능은 자동으로 테스트하는 파이프라인을 설계한 기록입니다. 툴 선택보다는 **전체 흐름의 설계 의도** — 언제 돌릴지, 실패를 어떻게 알릴지, 결과를 어디에 쌓을지 — 를 중심으로 풀어보려 합니다.

## 설계 한눈에

```
┌───────────────────────────────────────────────┐
│  ①  GitHub Actions (cron: 매시 정각, 영업시간) │
│         │                                      │
│         ▼                                      │
│  ②  Playwright (Page Object Model)             │
│         │                                      │
│         ├──► ③ Slack 알림 (상태 변화일 때만)  │
│         │                                      │
│         └──► ④ TMS (TC 단위 결과 누적)        │
└───────────────────────────────────────────────┘
```

네 블록 각각이 왜 그 모양이어야 했는지를 순서대로 적어봅니다.

## ① 언제 돌릴 것인가 — 스케줄 설계

저희는 새벽에 데이터 수집·전처리가 돌아가는 시간이라, 테스트는 영업시간에만 진행하도록 스케줄을 설정했습니다. 에러가 발생했을 때 바로 대응할 수 있다는 점도 이 선택의 이유입니다.

```yaml
on:
  schedule:
    - cron: '0 0-14 * * *'  # KST 09:00 ~ 23:00
```

## ② 무엇으로 돌릴 것인가 — Playwright + POM

테스트 러너는 Playwright, 구성은 Page Object Model 로 잡았습니다. 여기선 설계상 중요한 포인트만 짚습니다.

- **POM 으로 스펙을 얇게** — `tests/*.spec.ts` 는 시나리오만, 클릭/입력 세부는 `src/pages/*Page.ts` 로. 회귀 테스트는 UI가 바뀌어도 테스트 시나리오가 바뀌지 않는다면 유지보수 비용이 적게 듭니다.
- **멀티 계정 병렬** — 언어별·권한별로 독립된 계정이 필요하면 Playwright `projects` 별로 `storageState` 를 분리해 병렬 실행합니다.

## ③ 실패를 어떻게 알릴 것인가 — "상태 변화" 기반 Slack

매시간 성공이나 실패 알림이 일정하게 오면 사람들은 곧 무시합니다(alert fatigue). 그래서 원칙을 하나 세웠습니다.

> **"이전 실행과 결과가 달라졌을 때만 알림을 보낸다."**

즉, `pass → fail` 전환과 `fail → pass` 복구 순간에만 Slack 을 호출합니다. 연속 실패 중이면 조용합니다.

구현은 GitHub Actions 스텝 안에서 직전 run의 conclusion을 GitHub API로 조회한 뒤 분기하는 방식입니다.

```yaml
- name: Get previous run status
  id: prev
  run: |
    PREV=$(curl -s -H "Authorization: Bearer ${{ github.token }}" \
      "https://api.github.com/repos/${{ github.repository }}/actions/workflows/regression-test.yml/runs?status=completed&per_page=1" \
      | python3 -c "import sys,json; runs=json.load(sys.stdin).get('workflow_runs',[]); print(runs[0]['conclusion'] if runs else 'none')")
    echo "conclusion=$PREV" >> "$GITHUB_OUTPUT"

- name: Notify Slack on status change to failure
  if: steps.test.outcome == 'failure' && steps.prev.outputs.conclusion != 'failure'
  uses: slackapi/slack-github-action@v2.1.0
  ...
```

알림 페이로드 자체도 얕게 넘기면 결국 링크만 클릭하게 됩니다. Playwright 의 `results.json` 을 `jq` 로 파싱해서 **파일명 · 테스트 타이틀 · 실패한 스텝 · 에러 메시지 첫 줄**까지 Slack 본문에 포함시키고, 실패 스크린샷은 `files.uploadV2` 로 첨부합니다. Slack 에서 스크린샷을 바로 보고 원인을 추정할 수 있게 만드는 게 목표였습니다.

## ④ 결과를 어디에 쌓을 것인가 — TMS 통합

Slack 은 "지금 무슨 일이 벌어졌는가" 에는 강하지만, "어떤 TC가 최근 한 달간 얼마나 안정적이었는가" 같은 질문에는 약합니다. 그래서 결과를 TMS(Test Management System)로 따로 보냅니다.

핵심 아이디어는 단순합니다. **테스트 타이틀에 TC ID 를 넣고, 커스텀 Playwright 리포터가 그걸 뽑아 전송한다.**

```ts
test('오디언스 전체 플로우 @QA-123', async ({ page }) => { ... });
```

리포터 쪽에서는 `@([A-Z]+-\d+)` 패턴으로 TC ID 를 추출하고, **최종 시도만** (retry 중간 결과는 무시) 모아서 세션 종료 시 한 번에 POST 합니다.

```ts
const TC_ID_PATTERN = /@([A-Z]+-\d+)/;

onTestEnd(test, result) {
  const isFinalAttempt = result.status === 'passed' || result.retry === test.retries;
  if (!isFinalAttempt) return;

  const match = test.title.match(TC_ID_PATTERN);
  if (!match) return;

  this.results.set(match[1], {
    tc_display_id: match[1],
    result: mapStatus(result.status),
    error_message: result.error?.message ?? null,
    duration: result.duration,
  });
}
```

이렇게 쌓인 데이터로 TC 별 flaky rate, 평균 실행 시간, 최근 실패 히스토리를 TMS UI 에서 바로 볼 수 있습니다.

## 정리

| 설계 결정                     | 이유                                                  |
| ----------------------------- | ----------------------------------------------------- |
| 매시간 × 영업시간 cron        | 재현성 좋은 시간대에만 돌려 커버리지·노이즈 균형      |
| POM + 멀티 계정 병렬          | UI 변경 대응 비용 최소화, 권한/언어별 플로우 커버     |
| 상태 변화 기반 Slack 알림     | alert fatigue 방지 — "조용한 CI" 가 결국 더 잘 보인다 |
| 실패 페이로드 풍부화          | Slack 에서 클릭 한 번으로 원인 추정                   |
| TC ID 태그 + 커스텀 리포터 → TMS | 이벤트(Slack)와 누적(TMS)을 분리해서 각자 잘하는 걸 하게 |

리그레션 테스트는 "돌아가느냐" 보다 "**돌아간 뒤에 무엇이 남느냐**" 가 훨씬 중요합니다. 즉각적인 알림은 Slack 으로, 장기 신뢰도는 TMS 로 — 이 둘을 분리하고 나니 테스트 파이프라인이 비로소 의사결정에 쓸 수 있는 데이터가 되었습니다.
