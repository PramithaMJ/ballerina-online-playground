# Debug Feature Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                         App.jsx                                  │  │
│  │  - Main application component                                    │  │
│  │  - Integrates all debug functionality                            │  │
│  └────────┬──────────────────────────────────────────┬──────────────┘  │
│           │                                          │                 │
│           ▼                                          ▼                 │
│  ┌────────────────────┐                    ┌──────────────────────┐   │
│  │   CodeEditor.jsx   │                    │   DebugPanel.jsx     │   │
│  │                    │                    │                      │   │
│  │  • Monaco Editor   │                    │  • Control Buttons   │   │
│  │  • Breakpoints UI  │                    │  • Variables View    │   │
│  │  • Glyph Margin    │                    │  • Call Stack        │   │
│  │  • Line Highlight  │                    │  • Status Display    │   │
│  └──────────┬─────────┘                    └──────────┬───────────┘   │
│             │                                         │               │
│             │                                         │               │
│             └─────────────┬───────────────────────────┘               │
│                           │                                           │
│                           ▼                                           │
│              ┌─────────────────────────┐                              │
│              │  useDebugSession Hook   │                              │
│              │                         │                              │
│              │  • Breakpoint mgmt      │                              │
│              │  • Editor decorations   │                              │
│              │  • State management     │                              │
│              │  • Event coordination   │                              │
│              └──────────┬──────────────┘                              │
│                         │                                             │
│                         ▼                                             │
│              ┌─────────────────────────┐                              │
│              │   debugService.js       │                              │
│              │                         │                              │
│              │  • WebSocket conn mgmt  │                              │
│              │  • Command API          │                              │
│              │  • Event dispatcher     │                              │
│              │  • Reconnection logic   │                              │
│              └──────────┬──────────────┘                              │
│                         │                                             │
└─────────────────────────┼─────────────────────────────────────────────┘
                          │
                          │ WebSocket
                          │ /debug/ws/{sessionId}
                          │
┌─────────────────────────┼─────────────────────────────────────────────┐
│                         │                                             │
│                         ▼                                             │
│              ┌─────────────────────────┐                              │
│              │   main.go (Routes)      │                              │
│              │                         │                              │
│              │  POST /debug/start      │                              │
│              │  WS   /debug/ws/{id}    │                              │
│              └──────────┬──────────────┘                              │
│                         │                                             │
│                         ▼                                             │
│              ┌─────────────────────────┐                              │
│              │   handler/debug.go      │                              │
│              │                         │                              │
│              │  ┌───────────────────┐  │                              │
│              │  │  StartDebugHandler│  │                              │
│              │  │  - Create session │  │                              │
│              │  │  - Validate code  │  │                              │
│              │  │  - Return ID      │  │                              │
│              │  └───────────────────┘  │                              │
│              │                         │                              │
│              │  ┌───────────────────┐  │                              │
│              │  │ WebSocketHandler  │  │                              │
│              │  │  - Upgrade conn   │  │                              │
│              │  │  - Route messages │  │                              │
│              │  │  - Send events    │  │                              │
│              │  └───────────────────┘  │                              │
│              │                         │                              │
│              │  ┌───────────────────┐  │                              │
│              │  │  DebugSession     │  │                              │
│              │  │                   │  │                              │
│              │  │  State:           │  │                              │
│              │  │  • Breakpoints    │  │                              │
│              │  │  • Variables      │  │                              │
│              │  │  • Call Stack     │  │                              │
│              │  │  • Current Line   │  │                              │
│              │  │  • IsRunning      │  │                              │
│              │  │                   │  │                              │
│              │  │  Methods:         │  │                              │
│              │  │  • setBreakpoint  │  │                              │
│              │  │  • continue       │  │                              │
│              │  │  • stepOver/Into  │  │                              │
│              │  │  • stop           │  │                              │
│              │  └───────────────────┘  │                              │
│              └─────────────────────────┘                              │
│                                                                        │
│                        BACKEND (Go)                                    │
└────────────────────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════

                      MESSAGE FLOW DIAGRAM

  User Action                Frontend               Backend
  ───────────                ────────               ───────

1. Click "Debug"
       │                          │                      │
       └──────────────────────────▶                      │
                                  │                      │
                             startDebugging()            │
                                  │                      │
                                  │  POST /debug/start   │
                                  ├─────────────────────▶│
                                  │                      │
                                  │                 Create Session
                                  │                 Generate ID
                                  │                      │
                                  │   { sessionId }      │
                                  ◀─────────────────────┤
                                  │                      │
                          Connect WebSocket              │
                                  │                      │
                                  │  WS /debug/ws/{id}   │
                                  ├─────────────────────▶│
                                  │                      │
                                  │    {connected}       │
                                  ◀─────────────────────┤
                                  │                      │

2. Click Glyph Margin (Set Breakpoint)
       │                          │                      │
       └──────────────────────────▶                      │
                                  │                      │
                          toggleBreakpoint(5)            │
                          Add decoration                 │
                                  │                      │
                                  │ {setBreakpoint: 5}   │
                                  ├─────────────────────▶│
                                  │                      │
                                  │              Store breakpoint
                                  │                      │
                                  │  {breakpointSet: 5}  │
                                  ◀─────────────────────┤
                                  │                      │

3. Click "Start" (Begin Execution)
       │                          │                      │
       └──────────────────────────▶                      │
                                  │                      │
                          debugService.start()           │
                                  │                      │
                                  │   {command: start}   │
                                  ├─────────────────────▶│
                                  │                      │
                                  │              Execute code
                                  │              Hit breakpoint
                                  │                      │
                                  │  {stopped: line 5}   │
                                  ◀─────────────────────┤
                                  │                      │
                          highlightCurrentLine(5)        │
                          Show pause state               │
                                  │                      │

4. Click "Continue"
       │                          │                      │
       └──────────────────────────▶                      │
                                  │                      │
                          debugService.continue()        │
                                  │                      │
                                  │  {command: continue} │
                                  ├─────────────────────▶│
                                  │                      │
                                  │             Resume execution
                                  │                      │
                                  │   {continued}        │
                                  ◀─────────────────────┤
                                  │                      │
                          Remove highlight               │
                                  │                      │

5. Click "Stop"
       │                          │                      │
       └──────────────────────────▶                      │
                                  │                      │
                          stopDebugging()                │
                                  │                      │
                                  │  {command: stop}     │
                                  ├─────────────────────▶│
                                  │                      │
                                  │              Stop execution
                                  │              Cleanup session
                                  │                      │
                                  │   {disconnected}     │
                                  ◀─────────────────────┤
                                  │                      │
                          Close WebSocket                │
                          Clear UI state                 │
                                  │                      │


════════════════════════════════════════════════════════════════════════

                      BREAKPOINT VISUAL STATES

  Line Number Gutter    │  Glyph Margin  │  Code Area
  ─────────────────────────────────────────────────────────

  Normal Line:
  ───────────────────────────────────────────────────────
      5                 │                │  function hello() {
  ───────────────────────────────────────────────────────

  Breakpoint Set:
  ───────────────────────────────────────────────────────
      5                 │    🔴          │  function hello() {
  ───────────────────────────────────────────────────────
                             ↑
                        Red Circle Glyph

  Current Execution Line:
  ───────────────────────────────────────────────────────
      5                 │    ▶️          │ ┃ function hello() {
  ───────────────────────────────────────────────────────
                             ↑               ↑
                        Yellow Arrow    Yellow Highlight

  Both (Stopped at Breakpoint):
  ───────────────────────────────────────────────────────
      5                 │  🔴▶️          │ ┃ function hello() {
  ───────────────────────────────────────────────────────


════════════════════════════════════════════════════════════════════════

                    DEBUG PANEL LAYOUT

  ┌────────────────────────────────────────────────────────┐
  │  🐛 Debug Session             ▶ Running   Line 5       │
  ├────────────────────────────────────────────────────────┤
  │  [▶ Continue] [⏭ Step Over] [⏬ Step Into]             │
  │  [⏫ Step Out] [⏹ Stop]                                │
  ├────────────────────────────────────────────────────────┤
  │ Variables                  │ Call Stack                │
  │ ┌────────────────────────┐ │ ┌───────────────────────┐│
  │ │ Name    │ Value │ Type ││ │ hello() :5            ││
  │ │─────────┼───────┼──────││ │ main()  :12           ││
  │ │ x       │ 42    │ int  ││ │                       ││
  │ │ name    │ "Bob" │ str  ││ │                       ││
  │ └────────────────────────┘ │ └───────────────────────┘│
  └────────────────────────────────────────────────────────┘


════════════════════════════════════════════════════════════════════════

                    FILE ORGANIZATION

  backend/
  ├── handler/
  │   ├── compile.go         (Existing)
  │   ├── run.go             (Existing)
  │   └── debug.go           (NEW - Debug handler with WebSocket)
  ├── middleware/
  │   ├── ratelimit.go       (Existing)
  │   └── turnstile.go       (Existing)
  ├── utils/
  │   ├── docker.go          (Existing)
  │   ├── file.go            (Existing)
  │   └── validator.go       (Existing)
  ├── main.go                (UPDATED - Added debug routes)
  └── go.mod                 (UPDATED - Added websocket dep)

  frontend-vite/
  ├── src/
  │   ├── components/
  │   │   ├── CodeEditor.jsx     (UPDATED - onEditorMount prop)
  │   │   ├── CodeEditor.css     (UPDATED - Breakpoint styles)
  │   │   ├── DebugPanel.jsx     (NEW - Debug UI)
  │   │   ├── DebugPanel.css     (NEW - Debug styles)
  │   │   └── index.js           (UPDATED - Export DebugPanel)
  │   ├── hooks/
  │   │   ├── useDebugSession.js (NEW - Debug hook)
  │   │   └── index.js           (UPDATED - Export hook)
  │   ├── services/
  │   │   ├── debug.service.js   (NEW - Debug service)
  │   │   └── index.js           (UPDATED - Export service)
  │   └── App.jsx                (TO UPDATE - Integration)

  docs/
  └── DEBUG_FEATURE.md           (NEW - Complete documentation)


════════════════════════════════════════════════════════════════════════
```
