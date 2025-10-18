# Quick Start Checklist - Debug Feature

## ✅ Implementation Checklist

### Backend ✓ DONE
- [x] Created `backend/handler/debug.go` with complete debug logic
- [x] Updated `backend/main.go` with debug endpoints
- [x] Installed WebSocket dependency (`gorilla/websocket`)
- [x] Verified backend compiles successfully

### Frontend ✓ DONE
- [x] Created `frontend-vite/src/services/debug.service.js`
- [x] Created `frontend-vite/src/components/DebugPanel.jsx`
- [x] Created `frontend-vite/src/components/DebugPanel.css`
- [x] Created `frontend-vite/src/hooks/useDebugSession.js`
- [x] Updated `CodeEditor.jsx` with `onEditorMount` prop
- [x] Updated `CodeEditor.css` with breakpoint styles
- [x] Updated all index.js files with exports

### Documentation ✓ DONE
- [x] Created `docs/DEBUG_FEATURE.md` (comprehensive guide)
- [x] Created `docs/DEBUG_ARCHITECTURE_VISUAL.md` (visual diagrams)
- [x] Created `IMPLEMENTATION_GUIDE.md` (integration guide)

---

## 🚀 Next Steps (For You to Complete)

### Step 1: Update App.jsx
**File**: `frontend-vite/src/App.jsx`

Add these imports:
```javascript
import { useDebugSession } from './hooks';
import { DebugPanel } from './components';
import { debugService } from './services';
```

Add the debug hook:
```javascript
const {
  isDebugging,
  isInitializing,
  startDebugging,
  stopDebugging,
  toggleBreakpoint,
  highlightCurrentLine,
  setEditorRefs,
} = useDebugSession();
```

Add editor mount handler:
```javascript
const handleEditorMount = (editor, monaco) => {
  setEditorRefs(editor, monaco);
  
  editor.onMouseDown((e) => {
    const targetType = monaco.editor.MouseTargetType;
    if (e.target.type === targetType.GUTTER_GLYPH_MARGIN) {
      toggleBreakpoint(e.target.position?.lineNumber);
    }
  });

  debugService.addListener('stopped', (data) => {
    if (data.line) highlightCurrentLine(data.line);
  });

  debugService.addListener('continued', () => {
    highlightCurrentLine(null);
  });
};
```

Update CodeEditor component:
```javascript
<CodeEditor
  code={code}
  onChange={setCode}
  onEditorMount={handleEditorMount}  // Add this prop
/>
```

Add DebugPanel to your layout:
```javascript
{isDebugging && (
  <DebugPanel
    isDebugging={isDebugging}
    onStopDebugging={stopDebugging}
  />
)}
```

### Step 2: Update Header Component
**File**: `frontend-vite/src/components/Header.jsx`

Add debug button:
```javascript
import { Bug } from 'lucide-react';

// In your component props, add:
// onDebug, isDebugging, isInitializing

<button 
  onClick={onDebug}
  disabled={isDebugging || isInitializing}
  className="debug-button"
>
  <Bug size={18} />
  Debug
</button>
```

### Step 3: Test the Implementation

1. **Start Backend**
   ```bash
   cd backend
   go run main.go
   # Should see: "Server started on port 8081"
   ```

2. **Start Frontend**
   ```bash
   cd frontend-vite
   npm run dev
   # Should see: "Local: http://localhost:5173"
   ```

3. **Test Debug Workflow**
   - [ ] Write Ballerina code in editor
   - [ ] Click glyph margin → See red circle (breakpoint)
   - [ ] Click "Debug" button → See debug panel appear
   - [ ] Click "Start" → Execution begins
   - [ ] Code stops at breakpoint → Yellow arrow appears
   - [ ] Click "Continue" → Execution resumes
   - [ ] Click "Step Over" → Moves to next line
   - [ ] Click "Stop" → Debug session ends

---

## 🧪 Testing Scenarios

### Scenario 1: Basic Debugging
```ballerina
import ballerina/io;

function main() {
    int x = 10;           // Set breakpoint here (line 4)
    int y = 20;           // Set breakpoint here (line 5)
    int sum = x + y;
    io:println(sum);
}
```
**Expected**: Stops at line 4, then at line 5 when continuing

### Scenario 2: Multiple Breakpoints
```ballerina
import ballerina/io;

function main() {
    foreach int i in 1...5 {  // Set breakpoint here
        io:println(i);
    }
}
```
**Expected**: Stops at each iteration

### Scenario 3: Function Calls
```ballerina
import ballerina/io;

function add(int a, int b) returns int {
    return a + b;         // Set breakpoint here
}

function main() {
    int result = add(5, 3);  // Set breakpoint here
    io:println(result);
}
```
**Expected**: Can step into `add()` function

---

## 🐛 Troubleshooting

### Issue: WebSocket Connection Failed
**Solution**: 
- Check backend is running on port 8081
- Verify CORS settings in `main.go`
- Check browser console for errors

### Issue: Breakpoints Not Showing
**Solution**:
- Verify `glyphMargin: true` in EDITOR_OPTIONS
- Check CodeEditor.css has breakpoint styles
- Ensure editor mount handler is called

### Issue: Debug Panel Not Appearing
**Solution**:
- Check `isDebugging` state
- Verify DebugPanel component is imported
- Check console for React errors

### Issue: "Session Not Found"
**Solution**:
- Backend might have restarted
- Session might have timed out (30 min)
- Click "Debug" again to create new session

---

## 📊 Verification Checklist

After integration, verify:

- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] No TypeScript/ESLint errors in console
- [ ] Debug button appears in header
- [ ] Clicking glyph margin sets breakpoints
- [ ] Red circles appear for breakpoints
- [ ] Debug panel appears when debugging
- [ ] WebSocket connection established
- [ ] Can continue/step through code
- [ ] Variables panel works
- [ ] Call stack panel works
- [ ] Stop button ends session
- [ ] Can debug multiple times

---

## 📚 Reference Files

Quick reference to key files:

| Purpose | File |
|---------|------|
| Integration example | `IMPLEMENTATION_GUIDE.md` |
| Full documentation | `docs/DEBUG_FEATURE.md` |
| Visual diagrams | `docs/DEBUG_ARCHITECTURE_VISUAL.md` |
| Debug service API | `frontend-vite/src/services/debug.service.js` |
| Debug UI component | `frontend-vite/src/components/DebugPanel.jsx` |
| Debug hook | `frontend-vite/src/hooks/useDebugSession.js` |
| Backend handler | `backend/handler/debug.go` |

---

## 🎯 Success Criteria

Your debug feature is working when:

1. ✅ User can set/remove breakpoints by clicking glyph margin
2. ✅ Breakpoints show as red circles
3. ✅ Debug button starts debugging session
4. ✅ Code execution pauses at breakpoints
5. ✅ Current line shows yellow arrow
6. ✅ Debug controls work (Continue, Step Over, etc.)
7. ✅ Can stop debugging session
8. ✅ Can debug same code multiple times

---

## 💡 Tips

1. **During Development**: Enable DEBUG_MODE in debug.service.js to see WebSocket messages
2. **Browser DevTools**: Open Network tab → WS to see WebSocket traffic
3. **Backend Logs**: Watch terminal for debug session messages
4. **React DevTools**: Use to inspect component state

---

## 🎉 You're Ready!

All the code is implemented and ready. Just:
1. Update App.jsx (5-10 minutes)
2. Update Header.jsx (2 minutes)  
3. Test the feature (5 minutes)

**Total time to integrate: ~15-20 minutes**

Good luck! 🚀
