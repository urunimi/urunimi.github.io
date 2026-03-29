---
toc: true
title: "cmux + Claude Code + Raycast로 AI 코딩 환경 세팅하기"
date: 2026-03-29
categories: [ dev-tools, ai ]
---

## cmux: AI 에이전트를 위한 터미널

터미널 도구는 [cmux](https://github.com/manaflow-ai/cmux)를 씁니다. Ghostty 기반의 macOS 네이티브 앱인데, AI 코딩 에이전트를 염두에 두고 만들어진 터미널이에요.

기존에 Ghostty + tmux 조합을 쓰던 분들이라면 익숙한 개념이 많을 거예요. 다만 tmux를 쓰다 보면 몇 가지 불편한 점이 있었어요.

- **Shift+Enter 줄바꿈이 안 됨** — tmux가 키 시퀀스를 가로채서 Claude Code에서 멀티라인 입력이 안 됩니다
- **알림이 안 옴** — Claude Code가 작업을 끝내도 tmux가 OSC 시퀀스를 차단해서 macOS 알림이 오지 않아요
- **세션 관리가 번거로움** — 프로젝트마다 tmux 세션을 만들고 관리하는 게 생각보다 손이 많이 갑니다

cmux는 이 문제들을 깔끔하게 해결해줍니다. Ghostty config를 그대로 읽어서 기존 테마와 폰트 설정이 유지되고, tmux 없이도 워크스페이스와 split pane을 CLI로 제어할 수 있어요.

설치는 Homebrew로 간단하게:

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

---

## dev 스크립트: 프로젝트 환경을 한 번에

프로젝트 폴더에서 `dev`를 치면 Claude Code와 lazygit이 자동으로 세팅됩니다.

```
┌─────────────────────────────┐
│        Claude Code          │  ← 위: 에이전트에게 지시
├─────────────────────────────┤
│          lazygit            │  ← 아래: 변경사항 실시간 확인
└─────────────────────────────┘
```

위에서 Claude Code로 작업을 지시하고, 아래 lazygit에서 에이전트가 바꾼 파일을 바로 확인하는 구조예요. `d`키로 diff를 보면 어떤 코드가 어떻게 바뀌었는지 한눈에 파악할 수 있습니다.

스크립트 전체 코드입니다:

```bash
#!/bin/bash
WORKTREE_NAME="$1"
WORK_DIR="$(pwd)"

if [ -n "$WORKTREE_NAME" ]; then
  WORKTREE_DIR=".claude/worktrees/$WORKTREE_NAME"
  if [ ! -d "$WORKTREE_DIR" ]; then
    git worktree add -b "worktree-$WORKTREE_NAME" "$WORKTREE_DIR"
  fi
  WORK_DIR="$(cd "$WORKTREE_DIR" && pwd)"
fi

CLAUDE_SURFACE=$(cmux identify | jq -r '.caller.surface_ref')
CLAUDE_PANE=$(cmux identify | jq -r '.caller.pane_ref')
WORKSPACE=$(cmux identify | jq -r '.caller.workspace_ref')

# Claude Code 실행
cmux send --surface "$CLAUDE_SURFACE" "cd $WORK_DIR && claude"
cmux send-key --surface "$CLAUDE_SURFACE" enter

# 아래에 lazygit split
cmux new-split down --surface "$CLAUDE_SURFACE"
LAZYGIT_SURFACE=$(cmux tree --workspace "$WORKSPACE" | grep -o 'surface:[0-9]*' | tail -1)
cmux send --surface "$LAZYGIT_SURFACE" "cd $WORK_DIR && lazygit"
cmux send-key --surface "$LAZYGIT_SURFACE" enter

# Claude Code pane으로 포커스 복귀
cmux focus-panel --panel "$CLAUDE_PANE"
```

저장 위치는 `/usr/local/bin/dev`로 하고 실행 권한을 주면 됩니다:

```bash
chmod +x /usr/local/bin/dev
```

Git worktree도 지원해요. 병렬로 여러 작업을 진행할 때 브랜치 이름을 인자로 넘기면 워크트리가 자동으로 생성됩니다:

```bash
dev              # 현재 폴더에서 실행
dev feature-auth # worktree 자동 생성 후 실행
```

---

## Raycast 스크립트: VS Code와 cmux를 동시에

이제 핵심입니다. Raycast에서 프로젝트 이름을 입력하면 VS Code와 cmux가 동시에 열리고, cmux에서는 자동으로 `dev`가 실행됩니다.

```bash
#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title Open Project
# @raycast.mode silent
# @raycast.icon 🚀
# @raycast.argument1 { "type": "text", "placeholder": "folder path" }

export CMUX_SOCKET_PATH="$HOME/Library/Application Support/cmux/cmux.sock"

FOLDER=~/Projects/"$1"
PROJECT_NAME=$(basename "$FOLDER")

# VS Code로 프로젝트 열기
open -a "Visual Studio Code" "$FOLDER"

# cmux가 안 떠있으면 실행
if ! cmux ping &>/dev/null; then
  open -a "cmux"
  sleep 2
fi

# 같은 이름의 workspace 이미 있는지 확인
EXISTING_WORKSPACE=$(cmux list-workspaces | grep -o 'workspace:[0-9]*' | while read ws; do
  NAME=$(cmux tree --workspace "$ws" | grep -o '"[^"]*"' | head -1 | tr -d '"')
  if [ "$NAME" = "$PROJECT_NAME" ]; then
    echo "$ws"
    break
  fi
done)

if [ -n "$EXISTING_WORKSPACE" ]; then
  # 이미 있으면 해당 workspace로 switch
  cmux select-workspace --workspace "$EXISTING_WORKSPACE"
else
  # 없으면 새로 생성
  WORKSPACE=$(cmux new-workspace --cwd "$FOLDER" | grep -o 'workspace:[^ ]*')
  sleep 0.3
  cmux rename-workspace --workspace "$WORKSPACE" "$PROJECT_NAME"
  cmux select-workspace --workspace "$WORKSPACE"
  sleep 0.3
  SURFACE=$(cmux tree --workspace "$WORKSPACE" | grep -o 'surface:[0-9]*' | head -1)
  cmux send --surface "$SURFACE" "cd $FOLDER && dev"
  cmux send-key --surface "$SURFACE" enter
fi

osascript -e 'tell application "cmux" to activate'
```

한 가지 주의할 점이 있어요. cmux는 기본적으로 cmux 내부 프로세스만 소켓 연결을 허용하는데, Raycast 스크립트는 외부 프로세스라서 접근이 막힙니다. cmux Settings에서 소켓 접근 권한을 `allowAll`로 변경해야 해요.

이제 Raycast에서 `Open Project` → `data-api` 를 입력하면:

1. VS Code가 `~/Projects/data-api`를 열고
2. cmux에 `data-api` 워크스페이스가 생성되고
3. Claude Code + lazygit이 자동으로 세팅됩니다

같은 프로젝트를 다시 열면 기존 워크스페이스로 바로 전환돼요. VS Code도 이미 열린 프로젝트라면 그쪽으로 포커스가 이동하고요. 덕분에 프로젝트를 여러 개 동시에 진행해도 항상 터미널과 VS Code가 같은 코드베이스를 보고 있게 됩니다.

---

## 마무리

세팅을 정리하면 이렇습니다:

- **Raycast** → 프로젝트 이름 하나로 VS Code + cmux 동시 오픈, 중복 방지
- **dev 스크립트** → Claude Code + lazygit 자동 세팅, worktree 지원
- **cmux** → Shift+Enter, 알림, 워크스페이스 관리 모두 해결

AI 에이전트와 함께 일하는 방식이 계속 바뀌고 있는 것 같아요. 지금 이 세팅이 정답은 아니겠지만, 같은 고민을 하고 계신 분들께 조금이나마 참고가 됐으면 합니다.
