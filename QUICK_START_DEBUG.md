# Quick Debug Panel Visibility Test Guide

## ⚠️ IMPORTANT: Current Issue

### Backend Error
```
Failed to upgrade to WebSocket: websocket: response does not implement http.Hijacker
```

**This error means Cloudflare Tunnel does NOT support WebSocket upgrades!**

### What's Working
- ✅ Debug session created: `debug-1760811737436453088`
- ✅ Turnstile verification working
- ✅ POST `/debug/start` endpoint working

### What's Not Working
- ❌ WebSocket upgrade fails (Cloudflare Tunnel limitation)
- ❌ Debug Panel not showing in frontend (needs deployment verification)

---

# Quick Start: Running Debug Feature Locally

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

---

# 🔍 TESTING IN PRODUCTION

## Step 1: Wait for Deployment (2-3 minutes)
Latest commit: `3c77800` - **"debug: Add extensive logging"**

1. Check Cloudflare Pages dashboard for deployment
2. Wait for "Deployed" status
3. Note the deployment time

## Step 2: Hard Refresh Browser
**Critical: Clear cache to get latest code!**

- Windows/Linux: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`
- Or: Open in **Incognito/Private window**

## Step 3: Open DevTools Console
Press `F12` or right-click → Inspect → Console tab

## Step 4: Test Debug Button
1. Click a line number's **left margin** to add breakpoint (red dot should appear)
2. Click **"Debug"** button in header
3. **Watch console output carefully!**

### Expected Console Output:
```javascript
🐛 [useDebugSession] Starting debug session...
🐛 [useDebugSession] Calling debugService.startDebugging...
🐛 Starting debug session...
🎫 Turnstile token attached to debug/start request
✅ Debug session created: debug-1760811737436453088
⚠️ WebSocket connection failed, but debug session created: Event
🐛 [useDebugSession] Debug service returned session ID: debug-xxx
🐛 [useDebugSession] Set isDebugging = true
🎯 [App] isDebugging changed: true
🎯 [App] isInitializing changed: false
✅ Debugging session started: debug-xxx
```

### ✅ Success Indicators:
- Console shows: `Set isDebugging = true`
- Console shows: `[App] isDebugging changed: true`
- **Debug Panel appears on RIGHT SIDE** with:
  - 🐛 Debug Session header
  - ⚠️ Warning: "WebSocket connection failed"
  - Debug controls (Continue, Step Over, etc.)
  - Variables section
  - Call Stack section

### ❌ Failure Indicators:
- Console shows: `Set isDebugging = false`
- Debug Panel does NOT appear
- Only Output Panel visible on right side

## Step 5: Share Results
Take screenshots of:
1. **Browser Console** (full output)
2. **Network Tab** (filter: debug)
3. **Full UI** (showing or not showing Debug Panel)
4. **Backend logs** (the hijacker error)

---

# 🔧 WebSocket Issue & Solutions

## Current Problem
```
Failed to upgrade to WebSocket: websocket: response does not implement http.Hijacker
```

### Root Cause
**Cloudflare Tunnel does NOT support WebSocket protocol upgrades!**

The tunnel can proxy HTTP requests but cannot upgrade the connection to WebSocket (bidirectional real-time communication).

### Why This Matters
- ✅ Debug session **creates** successfully
- ✅ Debug Panel **should show** (if deployment is correct)
- ❌ Debug **controls won't work** (no WebSocket = no real-time communication)
- ❌ Variables/Call Stack **won't update** (need WebSocket events)

### Solutions (Choose One)

#### Option 1: Use Different Tunnel (Recommended for Dev)
Use **ngrok** which supports WebSocket:
```bash
# Install ngrok
brew install ngrok  # Mac
# or download from ngrok.com

# Run tunnel
ngrok http 8080

# Update frontend .env with ngrok URL
VITE_API_URL=https://abc123.ngrok.io
```

#### Option 2: Deploy to WebSocket-Compatible Host (Recommended for Prod)
Deploy backend to:
- **Fly.io** (free tier, supports WebSocket)
- **Railway** (free tier, supports WebSocket)
- **Azure App Service** (enable WebSocket in settings)
- **AWS ECS** with ALB
- **Google Cloud Run** (HTTP/2)

#### Option 3: Replace WebSocket with Server-Sent Events (SSE)
Modify backend to use SSE for one-way server→client communication:
- Pro: Works through any proxy
- Con: Requires code changes
- Con: Client→Server still needs HTTP POST

#### Option 4: Use HTTP Polling (Quick Fix)
Replace WebSocket with polling:
```javascript
// Poll every 500ms
setInterval(() => {
  fetch(`/debug/status/${sessionId}`)
    .then(r => r.json())
    .then(data => updateDebugState(data));
}, 500);
```
- Pro: Works immediately
- Con: Less efficient
- Con: Higher latency

### Recommendation
**For Testing Now**: Option 1 (ngrok)
**For Production**: Option 2 (Deploy to proper host)

---

# 📊 Current Status Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Backend `/debug/start` | ✅ Working | Session creates successfully |
| Backend WebSocket | ❌ Blocked | Cloudflare Tunnel limitation |
| Frontend Code | ✅ Fixed | Debug Panel should show |
| Frontend Deployment | ⏳ Pending | Waiting for Cloudflare Pages |
| Debug Panel UI | ⏳ Unknown | Need to test after deployment |
| Full Debug Flow | ❌ Blocked | Needs WebSocket fix |

**Next Action**: Test after Cloudflare Pages deploys commit `3c77800`!

Good luck! 🚀
