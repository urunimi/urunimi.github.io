---
title: "코딩도구의 SOLID 위반 검거활동"
date: 2026-08-13
categories: [architecture, system-design, ai-agent]
---

코딩 에이전트들은 기존 코드를 보고 새로운 코드를 작성합니다. 그래서 Legacy 위에 코드를 쌓으면 코딩 에이전트들은 Legacy 에서 허용한 무너진 설계위해 더더욱 창의력을 발휘하여 무너진 설계 위로 와르르멘션을 구축합니다. 그렇기 때문에 좋은 설계를 유지하는 것은 AI 시대를 살아가는 우리에겐 더욱 중요해졌습니다. 그래서 좋은 품질의 코드를 관리하기 위해 인간 에이전트들은 AI가 작성한 코드를 리뷰하는데 점점 더 많은 시간을 보내게 되었습니다. 이 시간을 어떻게 줄일 수 있을지에 대한 한가지 방법론 입니다.

## 배경지식

### SOLID 원칙

객체 지향 설계의 다섯 가지 원칙입니다. 각 원칙의 정의와 예제는 [SOLID 원칙](/solid/) 글에 정리해두었으니 참고해주세요. 이 글에서는 정의를 다시 설명하지 않고, AI 코딩 에이전트가 **정의를 알고 있는데도 위반을 못 잡는 상황**을 다룹니다.

### 상황

요즘 저는 코드를 대부분 Claude Code 에게 맡기고 리뷰를 하고 있습니다. 얼마 전 PR 하나를 리뷰하면서 같은 계열의 지적을 세 번 반복했는데, 세 번 모두 SOLID 위반이었습니다.

이상한 점이 하나 있었습니다. SOLID의 정의를 물어보면 정확하게 답한다는 것입니다. 의존성 역전 원칙(DIP)이 무엇이냐고 물으면 "상위 모듈과 하위 모듈이 모두 추상에 의존해야 한다"고 바로 대답합니다. 그런데도 방금 자기가 쓴 코드에서는 그 위반을 보지 못합니다. 세 번의 지적을 순서대로 보면 왜 그런지 짐작이 갑니다.

## 팩토리의 타입 판정

먼저 알림을 보내는 코드입니다. 채널마다 보내는 방법이 달라서 `kind` 값으로 구현체를 고르고 있습니다. 모든 채널은 알림을 보내는 `Notifier` 를 구현하고, 그중 읽음 확인이 되는 이메일과 푸시만 `ReadChecker` 를 함께 구현합니다. 문자는 읽었는지 알아낼 방법이 없어서 빠집니다. 그 판정을 아래와 같이 작성했습니다.

```python
def supports_read_check(kind: str) -> bool:
    cls = _NOTIFIER_BY_KIND.get(kind)
    return cls is not None and issubclass(cls, ReadChecker)


def read_checker_for(channel: Channel) -> ReadChecker:
    notifier = notifier_for(channel)
    if not isinstance(notifier, ReadChecker):
        raise UnknownKind(...)
    return notifier
```

동작에는 문제가 없지만 팩토리가 외부에서 구현체의 타입을 직접 확인하고 있습니다. 구현체가 하나 늘어날 때마다 이 판정이 여전히 맞는지 다시 확인해야 하고, 인터페이스를 만들어두고도 다형성(Polymorphism)을 쓰지 않고 있습니다. 개방-폐쇄 원칙(OCP)이 말하는 "확장에는 열려 있고 수정에는 닫혀 있다"의 반대편에 서 있는 셈입니다.

그럼 어떻게 고칠까요? 레지스트리를 둘로 나누면 판정 자체가 사라집니다.

```python
# 읽음 확인이 되는 채널만 등록합니다. 표에 있느냐 없느냐가 곧 답입니다.
_READ_CHECKER_BY_KIND: dict[str, type[ReadChecker]] = {
    "email": EmailNotifier,
    "push": PushNotifier,
}


def read_checker_for(channel: Channel) -> ReadChecker | None:
    cls = _READ_CHECKER_BY_KIND.get(channel.kind)
    return cls() if cls is not None else None
```

타입 검사가 통째로 없어졌습니다. 표에 등록되어 있는지가 답이 되고, 엉뚱한 클래스를 등록하면 표의 타입 선언(`type[ReadChecker]`, `ReadChecker` 를 구현한 클래스만 담는다는 뜻)을 보고 타입 검사기가 잡아줍니다.

## 엔티티에 추가된 능력 판정

다음으로 호출하는 쪽에서 `channel.supports_read_check()` 처럼 interface 로 바꿔 달라고 요청했더니 아래와 같은 코드가 나왔습니다.

```python
class Channel:                                     # DB 테이블 한 줄과 짝을 이루는 모델
    kind: str

    def supports_read_check(self) -> bool:
        from app.notifiers import read_checker_for  # 순환을 피하려고 함수 안에 넣음
        return read_checker_for(self) is not None
```

일하기 싫어하는 사람을 닮은 Claude.. (난가?) 의존성의 화살표가 거꾸로 향하고 있도록 구현했습니다.

여기서 눈여겨볼 부분은 **함수 안으로 들어간 import** 입니다. 저것은 순환 참조를 해결한 것이 아니라, 순환이 생길 만큼 방향이 틀렸다는 신호를 가린 것뿐입니다. 게다가 이 모델은 이제 바뀔 이유가 두 가지가 됩니다. 테이블 스키마가 바뀔 때, 그리고 알림 구현체 레지스트리가 바뀔 때입니다. 단일 책임 원칙(SRP)이 말하는 "클래스가 바뀔 이유는 하나"에서 멀어졌습니다.

호출 모양을 그대로 유지하려면 DB 행을 그대로 쓰지 말고, 구현체를 건네받아 조립한 도메인 엔티티를 따로 두면 됩니다. 이렇게 밖에서 넣어주는 방식을 의존성 주입(Dependency Injection)이라고 부릅니다.

```python
class NotifyChannel:                               # 도메인 엔티티
    def __init__(self, notifier: Notifier, read_checker: ReadChecker | None):
        self.notifier = notifier
        self.read_checker = read_checker

    def supports_read_check(self) -> bool:
        return self.read_checker is not None
```

이제 엔티티는 추상만 알고 있습니다. 어떤 구현체가 붙을지는 조립을 담당하는 한 곳에서 정해집니다.

## 디스패치에 포함된 배포 데이터

마지막으로 채널이 늘어나면서 구현체를 여러 개로 나누었는데(이메일은 한 통씩 보낼 때와 한꺼번에 보낼 때가 다릅니다), 그중 하나를 고르는 코드가 아래와 같았습니다.

```python
_MAIL_SERVER = "smtp.example.com"      # 실제 메일 서버 주소
_PUSH_SERVER = "push.example.com"

_NOTIFIER_BY_TARGET: dict[tuple[str, str | None], type[Notifier]] = {
    (_MAIL_SERVER, None):   EmailNotifier,
    (_MAIL_SERVER, "bulk"): BulkEmailNotifier,
    (_PUSH_SERVER, None):   PushNotifier,
}
```

서버 주소가 코드 안에 상수로 들어가 있고, 그것을 표의 키로 쓰고 있습니다. 그런데 이 값은 데이터베이스의 채널 설정에 이미 들어있는 값입니다. 같은 사실을 두 곳이 각각 알고 있게 된 것이고, 채널을 하나 추가하려면 이 파일에서 상수와 표를 함께 고쳐야 합니다.

설정에서 넘어오는 선택자 하나로 고르도록 바꾸면 정리가 됩니다.

```python
_NOTIFIER_BY_KIND: dict[str, type[Notifier]] = {
    "email": EmailNotifier,
    "bulk_email": BulkEmailNotifier,
    "push": PushNotifier,
}
```

코드에서 배포 데이터가 사라졌습니다. 어느 서버로 보낼지는 설정만 알고 있으면 됩니다. 첫 번째 사례에서 팩토리가 캐묻던 그 표로 돌아온 셈입니다.

## 규칙을 강제하기

세 사례에는 공통점이 있습니다. 위반을 지적하면 곧바로 정확하게 설명한다는 점입니다. "DIP 를 어겼습니다, 도메인이 구체 모듈에 의존했습니다"라고 말이죠. 정의를 몰라서 틀린 것이 아니라는 뜻입니다.

정의는 "이 코드가 SRP 를 어겼나?"라는 질문을 던져야 비로소 동작합니다. 그런데 코드를 쓰는 사람은 그 질문을 스스로 던지지 않습니다. 던졌다면 애초에 그렇게 쓰지 않았을 테니까요. 정의는 이미 벌어진 일을 설명할 때는 완벽하지만, 쓰는 순간에는 아무 일도 하지 않습니다.

반면에 **규칙은 질문이 필요 없습니다**. `isinstance(` 가 눈에 들어오면 일단 멈추면 됩니다. 그것이 실제로 원칙을 위반했는지는 그다음에 확인하면 됩니다. 그래서 저는 리뷰 체크리스트에서 정의를 걷어내고 아래와 같은 규칙을 적어두었습니다.

| 추가된 줄에서 보이는 것                                      | 어긴 원칙 | 고치는 방향                                    |
| ------------------------------------------------------------ | --------- | ---------------------------------------------- |
| 분기하려고 쓴 `isinstance`, `issubclass`, `type() ==`        | OCP, LSP  | 구현체가 답하게 하거나, 등록 자체가 답이 되게  |
| 순환을 피하려고 함수 안에 넣은 import                        | DIP       | 방향이 틀렸다는 신호이므로 가리지 말고 뒤집기  |
| 도메인 엔티티나 ORM 모델이 어댑터, 레지스트리, 팩토리를 호출 | DIP, SRP  | 추상을 주입받도록 변경                         |
| 배포 데이터(키, URL, 경로)가 디스패치 표 옆에 상수로 존재    | DIP, OCP  | 설정에서 오는 선택자 하나로 통일               |
| 같은 사실이 표 두 곳에 각각 기록                             | OCP       | 등록을 단일 출처로 두고, 없으면 그것이 부정 답 |

## 체크리스트의 한계

여기까지 하고도 한 번 더 놓쳤습니다. 체크리스트에 "규칙을 찾아라"라고 적어두어도, 결국 본인이 찾아봤다고 말하면 통과하는 구조이기 때문입니다.

그래서 PR 을 만들기 전에 실행되는 훅(Hook)이 변경분(diff)을 직접 훑도록 만들었습니다.

```python
_SIGNAL_PATTERNS = (
    (re.compile(r"\b(?:isinstance|issubclass)\s*\("),
     "타입 분기: 구현이 답하게 할 수 없나? (OCP/LSP)"),
    (re.compile(r"\btype\s*\([^()]*\)\s*(?:==|!=|\bis\b)"),
     "타입 비교: 구현이 답하게 할 수 없나? (OCP/LSP)"),
    (re.compile(r"^[ \t]+(?:from\s+\S+\s+import\b|import\s+\S)"),
     "함수 안 import: 순환을 피하기 위한 것이라면 의존 방향 확인 (DIP)"),
)
```

> 더 이상 피할 구멍은 없습니다. (걸렸다 요놈!)

## 정리

스킬을 정의할 때, 회피할 구멍이 있는가?를 매우 유심히 봅니다. If 문에 따른 O/X 로 정확하게 규칙으로 지정할 수 있다면 그건 LLM 도구가 잘 받아들이지만 다소 정성적으로 해석의 여지가 있는 경우 여지없이 코딩 도구들을 음흉한 미소와 함께 외면합니다. 그래서 정성적으로 볼 수 밖에 없는 것들은 여전히 사람이 읽는 체크리스트에 남겨두었습니다.

그래도 기계가 대신 찾아주는 영역을 점점 넓히다보니 리뷰가 훨씬 수월해졌습니다.

정의는 알려주면 외웁니다. 문제는 외운 것이 정작 필요한 순간에 떠오르지 않는다는 점이고, 이건 사람이나 AI 나 크게 다르지 않은 것 같습니다.
