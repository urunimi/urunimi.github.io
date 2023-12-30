---
toc: true
title: "구조적 디자인 패턴"
date: 2023-11-23
categories: [ architecture, design-pattern ]
---

디자인패턴의 아름다움에 나오는 여러 구조적 디자인 패턴들을 쉬운 예시들과 함께 정리했습니다.

## Proxy 패턴

> 원본 클래스를 변경하지 않는 상태로 Proxy Class 도입으로 새로운 기능을 추가하는 것

### 인터페이스 기반의 프록시 패턴

```python
from abc import ABC, abstractmethod

class DatabaseAccessInterface(ABC):
    @abstractmethod
    def get_data(self):
        pass

    @abstractmethod
    def set_data(self, data):
        pass

class DatabaseAccess(DatabaseAccessInterface):
    def get_data(self):
        return "Some data from the database"

    def set_data(self, data):
        print(f"Data {data} set in the database")
```

이 때, DB 에 접근할 때마다 로그를 추가하려고 할 때 프록시 패턴 사용할 수 있습니다.

```python
class DatabaseAccessProxy(DatabaseAccessInterface):
    def __init__(self, database_access):
        self.database_access = database_access

    def get_data(self):
        print("Logging: Data retrieval has been started.")
        data = self.database_access.get_data()
        print("Logging: Data retrieval has been finished.")
        return data

    def set_data(self, data):
        print(f"Logging: Setting data {data} has been started.")
        self.database_access.set_data(data)
        print("Logging: Setting data has been finished.")
```

**`DatabaseAccessProxy`**는 **`DatabaseAccess`**의 기능을 그대로 사용하면서, 데이터 접근 전후에 로그를 남기는 추가 기능을 제공합니다.

### 상속 기반의 프록시 패턴

상속을 사용하면 기존 클래스의 구조를 변경하지 않고도 새로운 기능을 추가하거나 기존 기능을 확장할 수 있습니다.

```python
class DatabaseAccessProxy(DatabaseAccess):
    def get_data(self):
        print("Logging: Data retrieval has been started.")
        data = super().get_data()  # 원래 클래스의 메소드 호출
        print("Logging: Data retrieval has been finished.")
        return data

    def set_data(self, data):
        print(f"Logging: Setting data {data} has been started.")
        super().set_data(data)  # 원래 클래스의 메소드 호출
        print("Logging: Setting data has been finished.")
```

### 리플렉션 기반의 동적 프록시

프록시 클래스를 정의해야하는 원본 클래스 개수가 50개다! → 도저히 모든 클래스를 새로 정의할 수 없을 경우, 리플렉션을 사용하여 동적으로 프록시 클래스를 생성할 수 있습니다.

→ **동적 프록시 사용**

<aside>
🚨 상속이나 동적 프록시를 사용할 때는 클래스 계층이 복잡해지거나 예상치 못한 문제가 발생할 수 있으므로 주의가 필요
</aside>

### 프록시 패턴의 활용 방법

1. 주요 비즈니스와 관련 없는 요구사항의 개발에 활용 가능
2. RPC에서 프록시 패턴 적용 가능
    1. 서버의 RPC 를 호출하는 클라이언트는 서버의 세부 정보를 알 수 없음
    2. 서버는 클라이언트와의 상호 작용 신경 쓰지 않고 비즈니스 논리만 개발
3. 캐시를 활용하기 위한 프록시 패턴

- 인터페이스 기반의 프록시 패턴을 제외하고 권장 하고 싶지 않습니다. 왜 일까요?
  - [LSP](https://urunimi.github.io/architecture/solid/#liskov-substitution-principle-lsp)를 위배하기 때문입니다. LSP는 자식 클래스가 부모 클래스를 대체할 수 있어야 하며, 이때 프로그램의 기능이 영향을 받지 않아야 한다는 [SOLID 원칙](https://urunimi.github.io/architecture/solid) 중 하나 입니다.

## Decorator 패턴

> 객체에 동적으로 새로운 기능을 추가할 수 있게 해주는 구조적 디자인 패턴

### 예시: Decorator 패턴으로 로깅 기능을 추가

```python
class ComponentInterface:
    def operation(self):
        pass

class ConcreteComponent(ComponentInterface):
    def operation(self):
        print("기본 기능")

class Decorator(ComponentInterface):
    def __init__(self, component):
        self.component = component

    def operation(self):
        self.component.operation()
        self.added_functionality()

    def added_functionality(self):
        print("추가 기능")

# 사용 예제
component = ConcreteComponent()
decorated = Decorator(component)

decorated.operation()
```

## Adapter 패턴

> 호환되지 않는 인터페이스를 호환 가능한 인터페이스로 변환해서 두 클래스가 함께 작동하도록 함 <br/> eg. USB 인터페이스


### 예시: ListView 용 Adapter 패턴들

```java
public class MyAdapter extends RecyclerView.Adapter<MyAdapter.ViewHolder> {
    private List<String> mData;

    public static class ViewHolder extends RecyclerView.ViewHolder {
        private final TextView textView;
        
        public ViewHolder(View view) {
            super(view);
            textView = view.findViewById(R.id.textView);
        }

        public void setText(String text) {
            textView.setText(text);
        }
    }

    public MyAdapter(List<String> data) {
        mData = data;
    }

    @Override
    public MyAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                                  .inflate(R.layout.my_text_view, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        holder.setText(mData.get(position));
    }

    @Override
    public int getItemCount() {
        return mData.size();
    }
}

public class MainActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private MyAdapter adapter;
    private List<String> data;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        // 데이터 생성
        data = Arrays.asList("Item 1", "Item 2", "Item 3");

        // 어댑터 설정
        adapter = new MyAdapter(data);
        recyclerView.setAdapter(adapter);
    }
}
```

ListAdapter 는 백그라운드 스레드에서 데이터 세트의 변화를 계산해서 성능을 최적화합니다.

```java
public class MyListAdapter extends ListAdapter<String, MyListAdapter.ViewHolder> {

    public MyListAdapter() {
        super(DIFF_CALLBACK);
    }

    @Override
    public MyListAdapter.ViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                                  .inflate(R.layout.my_text_view, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(ViewHolder holder, int position) {
        String item = getItem(position);
        holder.setText(item);
    }

    private static final DiffUtil.ItemCallback<String> DIFF_CALLBACK =
            new DiffUtil.ItemCallback<String>() {
                @Override
                public boolean areItemsTheSame(String oldItem, String newItem) {
                    // 여기에 비교 로직 구현
                }

                @Override
                public boolean areContentsTheSame(String oldItem, String newItem) {
                    // 여기에 내용 비교 로직 구현
                }
            };

    // ViewHolder 클래스는 위 예시와 동일
}

public class MainActivity extends AppCompatActivity {
    private RecyclerView recyclerView;
    private MyListAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        recyclerView = findViewById(R.id.recyclerView);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        // 어댑터 설정
        adapter = new MyListAdapter();
        recyclerView.setAdapter(adapter);

        // 데이터 설정
        List<String> data = Arrays.asList("Item 1", "Item 2", "Item 3");
        adapter.submitList(data);
    }
}
```

Adapter 를 사용하는 쪽에서는 Adapter 내부의 로직을 신경 쓰지 않아도 됩니다.

**Adapter 패턴의 특징**

- Adapter 패턴은 원본 클래스와 다른 인터페이스를 제공 (cf. Proxy / Decorator 는 같은 인터페이스)

## Bridge 패턴

> 🌉 추상화와 구현을 디커플링해서 두가지가 서로 독립적으로 변화할 수 있도록 함

### Bridge 패턴으로 폭발적인 상속 해결

```python
class Device:
    def turn_on(self):
        raise NotImplementedError

    def turn_off(self):
        raise NotImplementedError

class TV(Device):
    def turn_on(self):
        print("TV를 켭니다.")

    def turn_off(self):
        print("TV를 끕니다.")

class Radio(Device):
    def turn_on(self):
        print("라디오를 켭니다.")

    def turn_off(self):
        print("라디오를 끕니다.")
```

리모콘의 추상화 클래스 정의

```python
class RemoteControl:
    def __init__(self, device):
        self.device = device

    def toggle_power(self):
        if self.is_powered:
            self.device.turn_off()
            self.is_powered = False
        else:
            self.device.turn_on()
            self.is_powered = True
```

사용 예시

```python
# 기기 인스턴스 생성
tv = TV()
radio = Radio()

# 각 기기에 대한 리모콘 인스턴스 생성
tv_remote = RemoteControl(tv)
radio_remote = RemoteControl(radio)

# 리모콘을 사용하여 기기 제어
tv_remote.toggle_power()  # TV를 켭니다.
radio_remote.toggle_power()  # 라디오를 켭니다.
```

- 추상화 - `RemoteControl` 클래스
- 구현 - `Device` 클래스와 그 서브클래스들(`TV`, `Radio`)

## Facade 패턴

---

> 복잡한 시스템에 대한 단순한 인터페이스를 제공해서 복잡한 시스템의 사용을 단순화하고, 클라이언트와 시스템 사이의 의존성을 줄이는 것

```python
class Screen:
    def down(self):
        print("스크린을 내립니다.")

    def up(self):
        print("스크린을 올립니다.")

class Projector:
    def on(self):
        print("프로젝터를 켭니다.")

    def off(self):
        print("프로젝터를 끕니다.")

class AudioSystem:
    def on(self):
        print("오디오 시스템을 켭니다.")

    def off(self):
        print("오디오 시스템을 끕니다.")
```

```python
class HomeTheaterFacade:
    def __init__(self):
        self.screen = Screen()
        self.projector = Projector()
        self.audio_system = AudioSystem()

    def watch_movie(self):
        print("영화 보기를 준비합니다.")
        self.screen.down()
        self.projector.on()
        self.audio_system.on()

    def end_movie(self):
        print("영화 보기를 종료합니다.")
        self.screen.up()
        self.projector.off()
        self.audio_system.off()
```

Fasade 인터페이스를 통해 홈시어터 시스템을 간단하게 제어할 수 있습니다.

```python
# 홈 시어터 퍼사드 인스턴스 생성
home_theater = HomeTheaterFacade()

# 영화 보기 시작
home_theater.watch_movie()

# 영화 보기 종료
home_theater.end_movie()
```

### Adapter 패턴과의 차이

- **목적의 차이**: 어댑터는 두 호환되지 않는 인터페이스를 연결하는 데 중점을 두고, 퍼사드는 복잡한 시스템을 단순화하는 데 중점
- **적용 범위**: 어댑터는 주로 두 클래스나 컴포넌트 간의 호환성 문제를 해결하는 데 사용되며, 퍼사드는 하나의 복잡한 시스템에 대한 단순한 인터페이스를 제공하는 데 사용
- **구현 방식**: 어댑터는 기존 인터페이스를 새로운 인터페이스로 변환하는 데 중점을 두고, 퍼사드는 복잡한 시스템의 내부 작업을 감추고 단순화된 접근 방법을 제공

## Composite 패턴

> 객체들을 트리 구조로 구성하여 개별 객체와 복합 객체를 클라이언트가 동일하게 다룰 수 있도록 해서 개별 객체와 복합 객체를 구별하지 않고 동일한 방식으로 처리하는 디자인 패턴

주로 Tree 구조의 데이터(단순한 객체의 모음)를 처리하는데 사용합니다.

### 예시: 파일 시스템

파일은 Leaf, 디렉토리는 Composite

```python
class FileSystemComponent:
    def __init__(self, name):
        self.name = name

    def display(self):
        raise NotImplementedError
```

```python
class File(FileSystemComponent):
    def display(self):
        print(f"파일: {self.name}")

class Directory(FileSystemComponent):
    def __init__(self, name):
        super().__init__(name)
        self.children = []

    def add(self, component):
        self.children.append(component)

    def remove(self, component):
        self.children.remove(component)

    def display(self):
        print(f"디렉토리: {self.name}")
        for child in self.children:
            child.display()
```

클래스 사용 예시

```python
# 디렉토리 생성
root_dir = Directory("Root")
docs_dir = Directory("Documents")
pics_dir = Directory("Pictures")

# 파일 생성
file1 = File("File1.txt")
file2 = File("File2.jpg")
file3 = File("File3.txt")

# 디렉토리에 파일 추가
docs_dir.add(file1)
pics_dir.add(file2)
root_dir.add(docs_dir)
root_dir.add(pics_dir)
root_dir.add(file3)

# 파일 시스템 구조 표시
root_dir.display()
```

컴포지트 패턴을 사용하면 클라이언트는 복합 객체와 개별 객체를 동일한 방식으로 다룰 수 있으며, 트리 구조의 재귀적인 구성을 쉽게 관리할 수 있습니다.

## Flyweight 패턴

> 공유를 위해 객체를 재사용하여 메모리를 절약. 이때 공유하는 객체는 Immutable 해야 함

### 예제: 체스 게임

많은 수의 체스 말이 사용되지만, 각 타입의 체스 말은 외형이 동일. (eg. 비숍들 끼리)

```python
class ChessPieceFlyweight:
    def __init__(self, name, color):
        self.name = name  # 예: 'Pawn', 'Knight', 'Bishop' 등
        self.color = color  # 예: 'Black', 'White'

    def display(self, position):
        print(f"{self.color} {self.name} at {position}")
```

팩토리에서 체스말 객체의 생성과 관리를 담당

```python
class ChessPieceFactory:
    _flyweights = {}

    @classmethod
    def get_flyweight(cls, name, color):
        key = (name, color)
        if not cls._flyweights.get(key):
            cls._flyweights[key] = ChessPieceFlyweight(name, color)
        return cls._flyweights[key]
```

체스 말의 위치를 관리하는 컨텍스트 클래스 정의

```python
class ChessPiece:
    def __init__(self, name, color, position):
        self.flyweight = ChessPieceFactory.get_flyweight(name, color)
        self.position = position

    def move(self, new_position):
        self.position = new_position

    def display(self):
        self.flyweight.display(self.position)
```

사용 예시

```python
# 체스말 생성
pawn_black_1 = ChessPiece("Pawn", "Black", "A2")
pawn_black_2 = ChessPiece("Pawn", "Black", "B2")

# 체스말 표시
pawn_black_1.display()
pawn_black_2.display()

# 체스말 이동
pawn_black_1.move("A4")
pawn_black_1.display()
```

- `ChessPieceFlyweight` - 체스말의 공통 상태(이름과 색상)
- `ChessPiece`  - 각 체스말의 개별 상태(위치)
- `ChessPieceFactory` - 필요한 플라이웨이트 객체를 생성하고 관리하여 중복 생성을 방지

플라이웨이트 패턴을 사용하면 체스 게임에서 같은 타입의 체스말들을 대량으로 사용해도, 각 체스말의 공통 상태는 오직 한 번만 생성되어 메모리 사용을 크게 절약할 수 있습니다.

### Flyweight 패턴, Singleton 패턴, Cache, Object Pool의 차이

- Singleton: 하나의 객체 생성 vs Flyweight: 여러가지 생성
    - 차라리 Singleton 패턴의 변형인 다중 인스턴스 패턴과 유사함
    - 단, Flyweight 패턴은 메모리 재사용이 목적
- Cache: 보통 액서스를 빠르게 하기 위한 것 vs Flyweight: 저장소로의 의미
- Object Pool: 반복 사용(사용한 후 Pool 에 돌려줌. 한번에 하나만 사용) vs Flyweight: 공동사용
