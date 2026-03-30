---
toc: true
title: "Claude Code 멀티 프로젝트 환경 구성하기"
date: 2026-03-29
categories: [dev-tools, ai]
---

Claude Code를 본격적으로 사용하다 보면 자연스럽게 여러 프로젝트를 동시에 진행하게 됩니다. 한쪽에서 에이전트가 리팩토링을 하는 동안 다른 프로젝트의 버그를 잡고, 또 다른 프로젝트의 PR 리뷰를 확인하는 식입니다.

문제는 context switching 비용입니다. 프로젝트를 전환할 때마다 터미널을 열고, 디렉토리를 이동하고, Claude Code를 다시 띄우고, 에디터에서 해당 프로젝트를 여는 과정을 반복해야 합니다. 에이전트가 코드를 바꾸고 있는데 변경사항을 따라가려면 지금 어느 브랜치에서 작업중인지 확인도 하고 워크트리는 또 어떤지 확인도 하다보니 머리가 아프더군요.

어떻게 하면 이 문제를 단순화 할 수 있을까? 고민을 했고, 제가 세운 Requirements 는 다음과 같았습니다.

- VS Code 와 Claude Code를 한 화면에서 볼 수 있어야 함. 프로젝트 전환 시 VS Code와 Claude Code가 모두 선택한 프로젝트로 이동해야 함.
- Claude Code 사용 중 사용 중인 브랜치나 워크트리 정보를 쉽게 확인 할 수 있어야 함.
- 다른 프로젝트에서 Agent 작업이 끝난 경우, 알림을 받을 수 있어야 함.

그래서 정리한 환경은 다음과 같습니다.

- **cmux** — Claude Code에 최적화된 터미널
- **dev 스크립트** — Claude Code + lazygit을 한 번에 세팅
- **Raycast 스크립트** — 프로젝트 이름 하나로 에디터와 터미널을 동시에 오픈 (혹은 전환)

## tmux의 한계

기존에 Ghostty + tmux 조합을 사용하고 있었습니다. 하지만 Claude Code와 함께 쓸 때 몇 가지 문제가 있었습니다.

- **Shift+Enter 줄바꿈이 안 됨** — tmux가 키 시퀀스를 가로채서 Claude Code에서 멀티라인 입력이 불가능합니다. 저는 사실 이 것도 큰 이유 중에 하나 였어요.
- **알림이 안 옴** — Claude Code가 작업을 끝내도 tmux가 OSC 시퀀스를 차단해서 macOS 알림이 오지 않습니다.

멀티 프로젝트 환경에서는 알림이 특히 중요합니다. 에이전트에게 작업을 맡기고 다른 프로젝트로 전환했을 때, 작업 완료 알림이 오지 않으면 수시로 확인하러 돌아와야 합니다.

## cmux

[cmux](https://github.com/manaflow-ai/cmux)는 Ghostty 기반의 macOS 네이티브 터미널입니다. AI 코딩 에이전트 환경을 고려해서 만들어졌고, 위에서 언급한 tmux의 문제들을 해결해줍니다. Ghostty config를 그대로 읽기 때문에 기존 테마와 폰트 설정이 유지되고, tmux 없이도 워크스페이스와 split pane을 CLI로 제어할 수 있습니다.

설치는 Homebrew로 합니다.

```bash
brew tap manaflow-ai/cmux
brew install --cask cmux
```

## dev 스크립트: Claude Code + lazygit 자동 세팅

프로젝트 폴더에서 `dev`를 실행하면 Claude Code와 lazygit이 split pane으로 자동 세팅됩니다.

```
┌─────────────────────────────┐
│        Claude Code          │  ← 위: 에이전트에게 지시
├─────────────────────────────┤
│          lazygit            │  ← 아래: 변경사항 실시간 확인
└─────────────────────────────┘
```

위 pane에서 Claude Code로 작업을 지시하고, 아래 lazygit에서 에이전트가 바꾼 파일을 바로 확인하는 구조입니다.

![VS Code와 cmux가 동시에 열린 모습](https://raw.githubusercontent.com/urunimi/urunimi.github.io/master/_posts/2026-03-29/vscode%20cmux.png)

스크립트 전체 코드입니다.

```bash
#!/bin/bash
WORKTREE_NAME="$1"
WORK_DIR="$(pwd)"

if [ -n "$WORKTREE_NAME" ]; then
  WORKTREE_DIR=".claude/worktrees/$WORKTREE_NAME"
  if [ ! -d "$WORKTREE_DIR" ]; then
    git worktree add -b "worktree-$WORKTREE_NAME" "$WORKTREE_DIR"
  fi
  WORK_DIR="$(cd "'$WORKTREE_DIR'" && pwd)"
fi

CLAUDE_SURFACE=$(cmux identify | jq -r '.caller.surface_ref')
CLAUDE_PANE=$(cmux identify | jq -r '.caller.pane_ref')
WORKSPACE=$(cmux identify | jq -r '.caller.workspace_ref')

# Claude Code 실행
cmux send --surface "$CLAUDE_SURFACE" "cd '$WORK_DIR' && claude"
cmux send-key --surface "$CLAUDE_SURFACE" enter

# 아래에 lazygit
cmux new-split down --surface "$CLAUDE_SURFACE"
LAZYGIT_SURFACE=$(cmux tree --workspace "$WORKSPACE" | grep -o 'surface:[0-9]*' | tail -1)
cmux send --surface "$LAZYGIT_SURFACE" "cd '$WORK_DIR' && lazygit"
cmux send-key --surface "$LAZYGIT_SURFACE" enter

# Claude Code pane으로 포커스 복귀
cmux focus-panel --panel "$CLAUDE_PANE"
```

저장 위치는 `/usr/local/bin/dev`로 하고 실행 권한을 줍니다.

```bash
chmod +x /usr/local/bin/dev
```

Git worktree도 지원합니다. 병렬로 여러 작업을 진행할 때 브랜치 이름을 인자로 넘기면 워크트리가 자동으로 생성되도록 했어요.

```bash
dev              # 현재 폴더에서 실행
dev feature-auth # worktree 자동 생성 후 실행
```

## Raycast 스크립트: 프로젝트 전환 자동화

context switching 비용을 줄이는 핵심입니다. Raycast에서 프로젝트 이름을 입력하면 VS Code와 cmux가 동시에 열리고, cmux에서는 자동으로 `dev`가 실행됩니다.

![Raycast에서 프로젝트 열기](https://raw.githubusercontent.com/urunimi/urunimi.github.io/master/_posts/2026-03-29/raycast.png)

내용을 보시면, `FOLDER=~/Projects/"$1"` 부분을 각자의 환경에 맞춰 변경해주세요. 저는 git repo를 ~/Projects 아래에 모아두고 있어서 아래의 설정으로 사용하고 있습니다.

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

참고로 위 동작이 스무스하게 처리 되려면 cmux는 기본적으로 내부 프로세스만 소켓 연결을 허용하기 때문에 cmux Settings에서 소켓 접근 권한을 `allowAll`로 변경해야 합니다. (Raycast 스크립트는 외부 프로세스)

Raycast에서 `Open Project` → `awesome-project`를 입력하면 다음이 자동으로 실행됩니다.

1. VS Code가 `~/Projects/awesome-project`를 엽니다
2. cmux에 `awesome-project` 워크스페이스가 생성됩니다
3. Claude Code + lazygit이 세팅됩니다

같은 프로젝트를 다시 열면 기존 워크스페이스로 바로 전환됩니다. VS Code도 이미 열린 프로젝트라면 해당 창으로 포커스가 이동합니다. 프로젝트를 여러 개 동시에 진행해도 터미널과 에디터가 항상 같은 코드베이스를 바라보게 됩니다.

## 정리

| 도구             | 역할                                           |
| ---------------- | ---------------------------------------------- |
| **cmux**         | 알림, 워크스페이스 관리                        |
| **dev 스크립트** | Claude Code + lazygit 자동 세팅, worktree 지원 |
| **Raycast**      | 프로젝트 이름 하나로 VS Code + cmux 동시 오픈  |

결국 하고 싶었던 것은 "프로젝트 전환 비용을 0에 가깝게 만드는 것"이었습니다. 에이전트가 코드를 작성하는 시간은 줄일 수 없지만, 그 사이에 다른 프로젝트로 전환하고 돌아오는 비용은 줄일 수 있습니다.
