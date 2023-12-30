---
toc: true
title: "KISS, YAGNI, DRY & LoD"
date: 2023-10-19
categories: [ architecture ]
---
## KISS 원칙

---

> ***Keep It Simple and Stupid***
> 

### 적은 줄 수의 코드가 더 간단하지 않다

**Using Regex**

```python
import re

def validate_ip_with_regex(ip):
    pattern = r"^(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.\
(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.\
(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)\.\
(25[0-5]|2[0-4][0-9]|[0-1]?[0-9][0-9]?)$"

    if re.fullmatch(pattern, ip):
        return True
    else:
        return False

# Test the function
print(validate_ip_with_regex("192.168.1.1"))  # Should return True
print(validate_ip_with_regex("256.256.256.256"))  # Should return False
```

**Using String Split**

```python
def validate_ip_with_split(ip):
    octets = ip.split(".")

    if len(octets) != 4:
        return False

    for octet in octets:
        if not octet.isdigit():
            return False
        num = int(octet)
        if num < 0 or num > 255:
            return False

    return True

# Test the function
print(validate_ip_with_split("192.168.1.1"))  # Should return True
print(validate_ip_with_split("256.256.256.256"))  # Should return False
```

Regex 를 사용한 방법이 더 짧지만 가독성이 떨어집니다. 차라리 두번째 방법이 읽기도 쉽고 이해하기도 쉽습니다.

### KISS 원칙을 만족하는 코드 작성 방법

- 복잡한 정규표현식, 프로그래밍 언어에서 제공하는 지나치게 높은 레벨의 코드나 기술을 사용해서 구현하지 말자.
    - 프로그램의 성능 vs 코드의 가독성
        정말 시간복잡도를 해치는 수준의 성능저하가 아니라면 가독성을 우선해봅시다!
        
- 바퀴를 다시 발명 하는 대신, 기존 라이브러리를 사용하는 것을 고려합니다.
- 과도한 최적화 피합니다. (eg. 비트연산, 복잡한 조건문)

## YAGNI 원칙

---

> ***You Ain’t Gonna Need It.**
현재 사용되지 않는 기능을 설계하지 말고, 현재 사용하지 않는 코드를 작성하지 않는다.*
> 

예시

```python
def calculate(numbers, operation="add"):
    if operation == "add":
        return sum(numbers)
    elif operation == "subtract":
        # 아직 구현되지 않음
        pass
    elif operation == "multiply":
        # 아직 구현되지 않음
        pass
    # ... 다른 연산들 ...
```

개선

```python
def add_numbers(numbers):
    return sum(numbers)
```

**논쟁거리들**

- 그렇다면 코드의 확장성을 고려할 필요가 없다는 것 일까요?
    - 그건 아닙니다. 확장을 해서 구현하는 것과 확장 가능성을 고려하는 것은 다릅니다. (OCP)
    - 도메인의 확장에 대해 도메인 관리자와 상의한 다음 결정하는 것이 좋습니다.
- 코드를 주석처리하는 경우?
    - 경우를 고려해야겠지만 지우는 걸 권장합니다. Git 처럼 버전관리를 사용한다면 언제든 복구 가능하니까요.

## DRY 원칙

---

> ***Don’t Repeat Yourself.***


### 코드 논리의 중복

```python
def validate_id(id):
    if len(id) < 5:
        return False, "ID must be at least 5 characters long"
    return True, "Valid ID"

def validate_password(password):
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    return True, "Valid password"

# Test the functions
print(validate_id("user"))  # Should return (False, "ID must be at least 5 characters long")
print(validate_password("password"))  # Should return (False, "Password must contain at least one digit")
```

위 코드를 DRY 최대한 적용해보면,

```python

def validate_id_or_password(id_or_pw, l):
    # 중복 코드를 병합
```

이건 아주 근본적으로 잘못한 리팩토링입니다. 왜냐하면 `id` 와 `password` 를 확인하는 일은 서로 전혀 다른 일을 하는 함수이며 반복되는 함수라고 할 수 없기 때문이죠.

- “서로 전혀 다른 일을 한다”는 건 어떻게 판단할 수 있죠?
    
    해당 비즈니스 로직의 발전 방향을 상상해봅니다. 예를들어, ID 의 경우 중복을 허용하지 않을 것이고, 비밀번호는 쉽게 유추할수 있는 것들을 걸러내게 될 것 입니다.
    

반복적인 코드 논리가 자주 나타날 때, 세분화된 기능을 추상화 해서 해결 가능합니다.

```python
def validate_length(value, min_length):
    return len(value) >= min_length

def has_digit(value):
    return any(char.isdigit() for char in value)

def validate_id(id):
    if not validate_length(id, 5):
        return False, "ID must be at least 5 characters long"
    if not id.isalnum():
        return False, "ID must be alphanumeric"
    return True, "Valid ID"

def validate_password(password):
    if not validate_length(password, 8):
        return False, "Password must be at least 8 characters long"
    if not has_digit(password):
        return False, "Password must contain at least one digit"
    return True, "Valid password"

# Test the functions
print(validate_id("user"))  # Should return (False, "ID must be at least 5 characters long")
print(validate_password("password"))  # Should return (False, "Password must contain at least one digit")
```

- 위 코드의 장점, 단점?
    - 장: 일부 로직이 공통화 해서 DRY 원칙을 지킨 것
    - 단: 함수의 깊이가 더 깊어졌고, 한줄밖에 안되는 `validate` 함수를 보면 KISS 원칙이 생각남

### 기능적(의미론적) 중복

```python
def is_valid_ip(ip: str) -> bool:
	# ...

def check_if_ip_valid(ip: str) -> bool:
	# ...
```

누가 봐도 같은 작업을 하는 코드입니다. 하지만 이런 코드는 꽤 여러 곳에서 발견할 수 있는데요. 주로 “작업자가 다르거나” 한명이 같은 “같은 구현을 일정 시간 간격을 두고 실행” 할 때 중복 코드를 생성하게 됩니다.

- 예방하는 방법?
  - 함수 이름을 정하는 규칙을 관리. 예를 들어, 위와 같이 `bool` 타입의 `is_` 로 함수 이름 규칙을 관리합니다.
    
- cf. utils package or class
  - 이런 중복 코드를 모아놓는 패키지나 클래스를 만들어서 관리하는 방법을 쉽게 선택합니다. 하지만 이런 패키지나 클래스는 점점 더 커지고, 관리하기 어려워지는 문제가 있습니다. 그러므로 이런 패키지나 클래스는 최대한 피하는 것이 좋습니다. 불가피 하다면, 패키지 안에서 모듈을 잘 나누고, 클래스는 최대한 작게 만드는 것이 좋습니다.

### 코드 실행의 중복

```python
# Common Utility Function
def validate_email(email):
    if "@" not in email:
        return False, "Invalid email"
    return True, None

# Presentation Layer
def create_user_api(email, password):
    is_valid, error = validate_email(email)
    if not is_valid:
        return error
    
    result = create_user_service(email, password)
    return result

# Domain Layer
def create_user_service(email, password):
    is_valid, error = validate_email(email)
    if not is_valid:
        return error
    
    # Actual user creation logic
    return "User created successfully"

# Test
print(create_user_api("testemail.com", "password"))  # Output: "Invalid email"
```

- 이런건 어떻게 해결할 수 있을까요?
  - 명백하게 계층(Layer)간 역할을 분리하면 됩니다. 
- 그럼 `validate_email` 은 누구의 역할일까요?
  - Domain 레이어

## LoD

---

> ***Law of Demeter
높은 응집도와 낮은 결합도를 위한 설계 원칙***

### 높은 응집도와 낮은 결합도

- 높은 응집도 - 클래스 자체의 설계에 사용. 즉 유사한 기능은 동일한 클래스에 배치되어야 하고 그렇지 않다면 다른 클래스로 분리
- 낮은 결합도 - 클래스 간의 의존성이 단순하고 명확하게

- 낮은 응집도 높은 결합도의 예시
    ```mermaid
    graph TD
        A[Module A] -->|Depends on| B[Module B]
        A -->|Depends on| C[Module C]
        B -->|Depends on| C
        B -->|Depends on| D[Module D]
        C -->|Depends on| D
    ```

- 높은 응집도 낮은 결합도의 예시
    ```mermaid
    graph TD
        E[Module E] -->|Depends on| F[Module F]
        G[Module G] -->|Depends on| H[Module H]
    ```

- 응집도와 결합도를 확인하는 방법?
    import 구문을 확인해보고, 이 모듈이 외부의 어떤 모듈을 사용하는지 확인합니다. 그리고 참조하는 모듈들이 어떤 레이어에 속해 있는지 확인합니다. 만약, 다른 여러 계층의 레이어에 속한 모듈을 참조하고 있다면, 결합도가 높은 상태이므로 리팩토링을 고려합니다.