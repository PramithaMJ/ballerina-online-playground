# Debugging Feature Implementation

## Overview

This document describes the debugging feature implementation for the Ballerina Online Playground. The feature allows users to set breakpoints, step through code execution, and inspect variables during runtime.

## Architecture

### Backend Components

#### 1. Debug Handler (`backend/handler/debug.go`)

**Responsibilities:**
- Manages debug sessions
- Handles WebSocket connections for real-time communication
- Processes debug commands (breakpoints, step, continue, etc.)
- Maintains session state and lifecycle

**Key Components:**

##### DebugSession
```go
type DebugSession struct {
    ID              string
    ContainerID     string
    Code            string
    Version         string
    PackageDir      string
    Connection      *websocket.Conn
    Breakpoints     map[int]bool
    CurrentLine     int
    Variables       []Variable
    CallStack       []StackFrame
    IsRunning       bool
    IsPaused        bool
    // ...
}
```

##### API Endpoints
- **POST `/debug/start`** - Initialize a new debug session
  - Request: `{ "code": "string", "version": "string" }`
  - Response: `{ "sessionId": "string" }`

- **WebSocket `/debug/ws/{sessionId}`** - Real-time debug communication
  - Bidirectional message passing
  - Command protocol for debug operations

#### 2. WebSocket Protocol

**Client → Server Messages:**
```json
{
  "command": "setBreakpoint|removeBreakpoint|start|continue|stepOver|stepInto|stepOut|stop|disconnect",
  "line": 123
}
```

**Server → Client Messages:**
```json
{
  "type": "connected|started|stopped|continued|breakpointSet|completed|error",
  "data": {
    "line": 123,
    "reason": "breakpoint",
    "variables": [...],
    "callStack": [...]
  }
}
```

### Frontend Components

#### 1. Debug Service (`frontend-vite/src/services/debug.service.js`)

**Responsibilities:**
- Establishes and manages WebSocket connection
- Sends debug commands to backend
- Receives and dispatches debug events
- Handles reconnection logic

**Key Methods:**
- `startDebugging(code, version)` - Initialize debug session
- `setBreakpoint(line)` - Set breakpoint at line
- `removeBreakpoint(line)` - Remove breakpoint
- `continue()` - Resume execution
- `stepOver()` - Execute next line
- `stepInto()` - Step into function
- `stepOut()` - Step out of function
- `stop()` - Stop debugging
- `disconnect()` - Close session

**Event System:**
```javascript
debugService.addListener('stopped', (data) => {
  // Handle paused state
});
```

#### 2. Debug Panel Component (`frontend-vite/src/components/DebugPanel.jsx`)

**Features:**
- Debug control buttons (Continue, Step Over, Step Into, Step Out, Stop)
- Variables inspection panel
- Call stack visualization
- Execution status display

**UI States:**
- `ready` - Debug session ready
- `running` - Code executing
- `paused` - Paused at breakpoint
- `completed` - Execution finished
- `error` - Error occurred

#### 3. useDebugSession Hook (`frontend-vite/src/hooks/useDebugSession.js`)

**Responsibilities:**
- Manages debugging state
- Handles breakpoint decorations in Monaco editor
- Coordinates between editor and debug service
- Highlights current execution line

**Key Features:**
- Breakpoint management with visual decorations
- Editor integration with glyph margin
- Automatic cleanup on session end

## User Flow

### 1. Starting Debug Session

```
User clicks "Debug" button
    ↓
Frontend calls debugService.startDebugging(code, version)
    ↓
POST /debug/start creates session
    ↓
WebSocket connection established
    ↓
User can set breakpoints by clicking glyph margin
    ↓
Click "Start" to begin execution
```

### 2. Hitting a Breakpoint

```
Code execution reaches breakpoint
    ↓
Backend sends 'stopped' event
    ↓
Frontend highlights current line
    ↓
Debug Panel shows paused state
    ↓
Variables and call stack displayed
    ↓
User can Continue or Step
```

### 3. Stepping Through Code

```
User clicks Step Over/Into/Out
    ↓
Backend executes appropriate step command
    ↓
Execution advances by one step
    ↓
UI updates with new line and state
```

## Visual Components

### Breakpoint Indicators

**Red Circle Glyph:**
```css
.breakpoint-glyph {
  background: #e51400;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  box-shadow: 0 0 6px rgba(229, 20, 0, 0.6);
}
```

**Current Execution Arrow:**
```css
.current-execution-glyph {
  /* Yellow arrow indicator */
  background: #ffeb3b;
  border-bottom: 14px solid #ffeb3b;
}
```

### Line Highlighting

- **Breakpoint line**: Red tinted background
- **Current execution line**: Yellow tinted background with left border

## Integration Points

### 1. App.jsx Integration

```jsx
import { useDebugSession } from './hooks';
import { DebugPanel } from './components';

function App() {
  const {
    isDebugging,
    startDebugging,
    stopDebugging,
    toggleBreakpoint,
    setEditorRefs,
  } = useDebugSession();

  const handleEditorMount = (editor, monaco) => {
    setEditorRefs(editor, monaco);
    
    // Enable breakpoint toggle on glyph margin click
    editor.onMouseDown((e) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS) {
        toggleBreakpoint(e.target.position.lineNumber);
      }
    });
  };

  return (
    <>
      <CodeEditor onEditorMount={handleEditorMount} />
      {isDebugging && (
        <DebugPanel 
          isDebugging={isDebugging}
          onStopDebugging={stopDebugging}
        />
      )}
    </>
  );
}
```

### 2. Toolbar Integration

Add debug button to toolbar:

```jsx
<button onClick={() => startDebugging(code, version)}>
  <Bug size={18} />
  Debug
</button>
```

## Security Considerations

### Backend Security

1. **Session Management**
   - Unique session IDs generated per request
   - Automatic cleanup of inactive sessions (10 min timeout)
   - Resource limits enforced per session

2. **Code Validation**
   - All code validated before debug session creation
   - Same security constraints as normal execution
   - Docker isolation maintained

3. **WebSocket Security**
   - CORS validation on WebSocket upgrade
   - Session ID validation required
   - Rate limiting applied

### Frontend Security

1. **Input Sanitization**
   - Code validated before sending to backend
   - WebSocket messages parsed safely
   - XSS prevention in variable display

2. **Connection Management**
   - Automatic reconnection with backoff
   - Connection timeout handling
   - Graceful disconnection on page unload

## Performance Optimizations

1. **Session Pooling**
   - Reuse containers when possible
   - Pre-warm debug containers
   - Efficient session cleanup

2. **WebSocket Efficiency**
   - Message batching for multiple commands
   - Binary protocol for large payloads
   - Compression for data transfer

3. **UI Optimizations**
   - Virtual scrolling for large variable lists
   - Debounced decoration updates
   - Lazy loading of call stack details

## Testing Strategy

### Backend Tests

```go
// Test debug session creation
func TestStartDebugHandler(t *testing.T)

// Test breakpoint management
func TestBreakpointOperations(t *testing.T)

// Test WebSocket communication
func TestDebugWebSocket(t *testing.T)
```

### Frontend Tests

```javascript
// Test debug service
describe('DebugService', () => {
  it('should start debugging session')
  it('should set breakpoints')
  it('should handle WebSocket messages')
})

// Test debug panel
describe('DebugPanel', () => {
  it('should render controls')
  it('should display variables')
  it('should show call stack')
})

// Test debug hook
describe('useDebugSession', () => {
  it('should manage breakpoints')
  it('should toggle breakpoints in editor')
  it('should highlight current line')
})
```

## Future Enhancements

1. **Advanced Debugging**
   - Conditional breakpoints
   - Watch expressions
   - Logpoints (non-breaking breakpoints)

2. **UI Improvements**
   - Inline variable values in editor
   - Hover evaluation
   - Expression evaluation console

3. **Performance**
   - Remote debugging for long-running processes
   - Multi-threaded debugging support
   - Memory profiling integration

4. **Collaboration**
   - Shared debug sessions
   - Step-through tutorials with debug
   - Debug session recording/replay

## Troubleshooting

### Common Issues

**Issue: WebSocket connection fails**
- Check CORS configuration
- Verify backend WebSocket endpoint is accessible
- Check firewall/proxy settings

**Issue: Breakpoints not working**
- Ensure debug session is started
- Verify breakpoint set before execution
- Check code has valid line numbers

**Issue: Variables not displaying**
- Check Ballerina runtime debug support
- Verify debug adapter protocol integration
- Ensure proper context capture

## API Reference

### Debug Service Events

| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{ sessionId }` | WebSocket connected |
| `started` | `{ message }` | Debug execution started |
| `stopped` | `{ reason, line }` | Execution paused |
| `continued` | `{ message }` | Execution resumed |
| `breakpointSet` | `{ line }` | Breakpoint added |
| `breakpointRemoved` | `{ line }` | Breakpoint removed |
| `variables` | `{ variables[] }` | Variable list updated |
| `callStack` | `{ frames[] }` | Call stack updated |
| `completed` | `{ message }` | Execution finished |
| `error` | `{ error }` | Error occurred |

### Debug Commands

| Command | Parameters | Description |
|---------|-----------|-------------|
| `setBreakpoint` | `{ line }` | Add breakpoint |
| `removeBreakpoint` | `{ line }` | Remove breakpoint |
| `start` | - | Start debugging |
| `continue` | - | Resume execution |
| `stepOver` | - | Step to next line |
| `stepInto` | - | Step into function |
| `stepOut` | - | Step out of function |
| `stop` | - | Stop debugging |
| `disconnect` | - | Close session |

## Dependencies

### Backend
- `github.com/gorilla/websocket` - WebSocket implementation
- Docker SDK - Container management
- Go standard library

### Frontend
- `@monaco-editor/react` - Code editor
- `lucide-react` - Icons
- React - UI framework
- WebSocket API - Real-time communication

## Deployment Notes

1. **Environment Variables**
   ```env
   # Backend
   ENABLE_DEBUG=true
   DEBUG_TIMEOUT=1800 # 30 minutes
   
   # Frontend
   VITE_ENABLE_DEBUG=true
   ```

2. **Docker Configuration**
   - Ensure debug ports are not exposed externally
   - Use internal networking for debug communication
   - Set resource limits appropriately

3. **Monitoring**
   - Track active debug sessions
   - Monitor WebSocket connection count
   - Alert on session timeout anomalies

## Conclusion

The debugging feature provides a professional, industry-standard debugging experience for Ballerina code in the browser. It follows the Debug Adapter Protocol (DAP) patterns and provides a familiar debugging UX similar to VS Code and other modern IDEs.

The implementation is secure, scalable, and maintainable, with clear separation of concerns between backend session management and frontend UI components.
