# Architecture Visualization

## Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │   Header   │  │  CodeEditor  │  │ OutputPanel  │             │
│  └────────────┘  └──────────────┘  └──────────────┘             │
│                                                                 │
│  ┌──────────────────────────────────────────────────┐           │
│  │            ResizablePanels                       │           │
│  │  ┌──────────────┐    ┌──────────────┐            │           │
│  │  │ Left Panel   │    │ Right Panel  │            │           │
│  │  └──────────────┘    └──────────────┘            │           │
│  └──────────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COMPONENT LAYER                            │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │  Toolbar   │  │   Settings   │  │  EmptyState  │             │
│  └────────────┘  └──────────────┘  └──────────────┘             │
│                                                                 │
│  ┌────────────┐  ┌──────────────┐                               │
│  │   Status   │  │   Spinner    │                               │
│  └────────────┘  └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      HOOKS LAYER                                │
│                   (State Management)                            │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                      │
│  │   useTheme      │  │  useFullscreen   │                      │
│  └─────────────────┘  └──────────────────┘                      │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                      │
│  │ useCodeExecution│  │ useEditorSettings│                      │
│  └─────────────────┘  └──────────────────┘                      │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────────┐                      │
│  │ useLocalStorage │  │useResizablePanels│                      │
│  └─────────────────┘  └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                              │
│                   (Business Logic)                              │
│                                                                 │
│  ┌────────────────────┐  ┌─────────────────────┐                │
│  │   apiService       │  │  fullscreenService  │                │
│  │                    │  │                     │                │
│  │  ・executeCode()   │  │  ・enter()          │                │
│  │                    │  │  ・exit()           │                │
│  │                    │  │  ・toggle()         │                │
│  └────────────────────┘  └─────────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      UTILITY LAYER                              │
│                   (Helper Functions)                            │
│                                                                 │
│  ┌──────────────────┐  ┌─────────────────────┐                  │
│  │  storage.util    │  │  monaco-setup.util  │                  │
│  │                  │  │                     │                  │
│  │  ・getItem()      │  │  ・setupEditor()    │                 │
│  │  ・setItem()      │  │  ・registerLang()   │                 │
│  └──────────────────┘  └─────────────────────┘                 │
│                                                                │
│  ┌──────────────────────────────────────────┐                  │
│  │     ballerina-validator.util             │                  │
│  │                                          │                  │
│  │     ・validateCode()                     │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                          │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐    │
│  │  env.config    │  │ app.constants  │  │ monaco-themes   │    │
│  └────────────────┘  └────────────────┘  └─────────────────┘    │
│                                                                 │
│  ┌────────────────────────────────────────────────┐             │
│  │        ballerina-language.config               │             │
│  └────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL LAYER                               │
│                                                                 │
│  ┌────────────────┐  ┌────────────────┐  ┌─────────────────┐    │
│  │  Backend API   │  │  localStorage  │  │  Browser APIs   │  │
│  └────────────────┘  └────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Example: Running Code

```
1. User clicks "Run" button
   │
   ├─▶ Header Component
   │      │
   │      └─▶ calls onRun()
   │             │
   ├─▶ App Component
   │      │
   │      └─▶ calls handleRun()
   │             │
   ├─▶ useCodeExecution Hook
   │      │
   │      └─▶ calls executeCode(code)
   │             │
   ├─▶ apiService
   │      │
   │      └─▶ fetch() to backend
   │             │
   │             ▼
   │      Backend processes code
   │             │
   │             ▼
   │      Response received
   │             │
   ├─▶ apiService
   │      │
   │      └─▶ formats response
   │             │
   ├─▶ useCodeExecution Hook
   │      │
   │      └─▶ updates state (output, error)
   │             │
   ├─▶ React Re-render
   │      │
   │      └─▶ OutputPanel receives new props
   │             │
   └─▶ UI Updates
          │
          └─▶ User sees output
```

## 🏗️ Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── Title Section
│   └── Controls
│       ├── Run Button
│       ├── Reset Button
│       ├── Clear Button
│       ├── Layout Controls
│       ├── Fullscreen Button
│       ├── Theme Toggle
│       └── GitHub Link
│
└── ResizablePanels
    ├── CodeEditor (Left/Top Panel)
    │   ├── Panel Header
    │   │   ├── Title
    │   │   ├── Info (Language, Lines)
    │   │   └── EditorToolbar
    │   │       ├── Zoom Controls
    │   │       ├── Theme Toggle
    │   │       └── Settings Button
    │   │
    │   ├── EditorSettings (Optional)
    │   │   ├── Theme Selector
    │   │   └── Font Size Slider
    │   │
    │   └── Monaco Editor
    │       └── LoadingSpinner (while loading)
    │
    └── OutputPanel (Right/Bottom Panel)
        ├── Panel Header
        │   ├── Title
        │   └── OutputStatus
        │       ├── Success Badge
        │       └── Error Badge
        │
        └── Output Content
            ├── EmptyState (when no output)
            ├── Error Section
            └── Output Section
```

## Module Dependencies

```
Components
    │
    ├─▶ Hooks
    │     │
    │     ├─▶ Services
    │     │     │
    │     │     └─▶ Utils
    │     │           │
    │     │           └─▶ Constants
    │     │                 │
    │     │                 └─▶ Config
    │     │
    │     └─▶ Utils
    │           │
    │           └─▶ Constants
    │
    └─▶ Constants


Dependency Flow (Bottom-Up):
Config → Constants → Utils → Services → Hooks → Components
```

## 🎭 State Management Flow

```
┌─────────────────────────────────────────────┐
│          Component Renders                  │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│       Calls Custom Hook                     │
│   const { state, action } = useFeature()   │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│          Hook Initializes                   │
│    - Reads from localStorage                │
│    - Sets up event listeners                │
│    - Initializes state                      │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│        User Triggers Action                 │
│         onClick={action}                    │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      Hook Calls Service Method              │
│   await service.doSomething()               │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│      Service Executes Logic                 │
│   - API calls                               │
│   - Browser APIs                            │
│   - Data processing                         │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│        Hook Updates State                   │
│      setState(newValue)                     │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│       React Re-renders                      │
│    Component receives new state             │
└─────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────┐
│          UI Updates                         │
│    User sees the changes                    │
└─────────────────────────────────────────────┘
```

## 🧩 SOLID Principles Mapping

### Single Responsibility Principle (SRP)

```
apiService         → Only handles API communication
fullscreenService  → Only handles fullscreen operations
useTheme           → Only manages theme state
EditorToolbar      → Only renders editor controls
```

### Open/Closed Principle (OCP)

```
Adding new theme:
   Add to monaco-themes.config.js (extend)
   No need to modify existing components (closed)

Adding new hook:
   Create new hook file (extend)
   No need to modify existing hooks (closed)
```

### Liskov Substitution Principle (LSP)

```
Any component using useLocalStorage can work with any
storage implementation that follows the same interface:

const [value, setValue] = useLocalStorage(key, initial);
const [value, setValue] = useSessionStorage(key, initial);
const [value, setValue] = useIndexedDB(key, initial);
```

### Interface Segregation Principle (ISP)

```
EditorToolbar receives:
   fontSize, onIncreaseFontSize (what it needs)
   Not entire editor state (what it doesn't need)

OutputStatus receives:
   isSuccess, isError (what it needs)
   Not entire output/error strings (what it doesn't need)
```

### Dependency Inversion Principle (DIP)

```
High-level modules (Components) depend on abstractions (Hooks)
Low-level modules (Services) implement the abstractions

Component → Hook (abstraction) → Service (implementation)

App knows WHAT to do (executeCode)
App doesn't know HOW it's done (HTTP details)
```
