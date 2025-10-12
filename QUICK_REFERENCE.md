# Quick Reference: Ballerina Version Selector

## 🎯 What Was Implemented

A complete Ballerina version selection feature that allows users to choose which Ballerina version to use when compiling and running their code.

## 📦 Files Created

### Frontend (4 new files)
```
frontend-vite/src/
├── components/
│   ├── VersionSelector.jsx     (New dropdown component)
│   └── VersionSelector.css     (Component styling)
└── hooks/
    └── useBallerinaVersion.js  (Version state management)
```

### Documentation (2 new files)
```
docs/
└── VERSION_SELECTOR_FEATURE.md          (Detailed documentation)
VERSION_SELECTOR_IMPLEMENTATION.md       (Implementation guide)
```

## 🔄 Files Modified

### Backend (4 files)
```
backend/
├── handler/
│   ├── run.go         (Added version parameter to request)
│   └── compile.go     (Added version parameter to request)
├── utils/
│   └── docker.go      (Added version helpers & updated Docker functions)
└── openapi.yaml       (Updated API documentation)
```

### Frontend (6 files)
```
frontend-vite/src/
├── App.jsx                        (Integrated version selector)
├── components/
│   ├── Header.jsx                 (Added version selector UI)
│   └── index.js                   (Exported new component)
├── hooks/
│   ├── useCodeExecution.js        (Added version parameter)
│   └── index.js                   (Exported new hook)
└── services/
    └── api.service.js             (Added version to API calls)
```

## 🔑 Key Functions

### Backend
```go
// Get Docker image for version
GetBallerinaDockerImage(version string) string

// Validate version
IsValidBallerinaVersion(version string) bool

// Run with specific version
RunBallerinaPackageWithContext(ctx, packageDir, version) (string, error)
```

### Frontend
```javascript
// Hook for version management
const { version, changeVersion, resetVersion } = useBallerinaVersion();

// Execute code with version
await executeCode(code, version);

// API call with version
await apiService.executeCode(code, version, signal);
```

## 🎨 UI Location

```
Header Component
├── Logo & Title
├── [Version Selector] ← NEW!
├── Divider
├── Run Button
├── Stop Button (when running)
├── Reset Button
├── Clear Button
└── ...other controls
```

## 📊 Supported Versions

| Version | Label | Docker Image | Status |
|---------|-------|--------------|--------|
| `2201.10.2` | Ballerina 2201.10.2 (Latest Stable) ⭐ | `ballerina/ballerina:2201.10.2` | Default |
| `2201.9.0` | Ballerina 2201.9.0 | `ballerina/ballerina:2201.9.0` | Stable |
| `2201.8.0` | Ballerina 2201.8.0 | `ballerina/ballerina:2201.8.0` | Stable |
| `swan-lake` | Swan Lake (Latest) | `ballerina/ballerina:swan-lake` | Development |

## 🚀 Quick Test Commands

### Backend Test
```bash
# Start backend
cd backend && go run main.go

# Test with version 2201.10.2
curl -X POST http://localhost:8081/run \
  -H "Content-Type: application/json" \
  -d '{"code": "import ballerina/io;\npublic function main() { io:println(\"Hello\"); }", "version": "2201.10.2"}'
```

### Frontend Test
```bash
# Start frontend
cd frontend-vite && npm run dev

# Then:
# 1. Open http://localhost:5173
# 2. Look for version selector in header
# 3. Select different versions
# 4. Run sample code
# 5. Check localStorage: 'ballerina-version'
```

## 💾 Data Flow

```
User selects version in UI
         ↓
VersionSelector Component
         ↓
useBallerinaVersion Hook
         ↓
localStorage (persist)
         ↓
App.jsx (state)
         ↓
executeCode(code, version)
         ↓
api.service.js
         ↓
POST /run {code, version}
         ↓
Backend Handler
         ↓
Validate version
         ↓
GetBallerinaDockerImage(version)
         ↓
RunBallerinaPackageWithContext(ctx, dir, version)
         ↓
Docker run with specific image
         ↓
Return output
```

## 🎯 Testing Checklist

- [ ] Version selector appears in header
- [ ] Can select different versions
- [ ] Version persists after page refresh
- [ ] Version disabled during execution
- [ ] API request includes version field
- [ ] Backend validates version
- [ ] Invalid version shows error
- [ ] Default version works without selection
- [ ] Docker pulls correct image
- [ ] Code runs with selected version

## 🔍 Debug Commands

### Check Frontend State
```javascript
// Open browser console
localStorage.getItem('ballerina-version')
```

### Check Backend Logs
```bash
# Backend should log version usage
tail -f backend/logs/app.log
```

### Check Docker Images
```bash
# List available Ballerina images
docker images | grep ballerina
```

## 📱 Responsive Behavior

- **Desktop:** Full version selector with label
- **Tablet:** Compact version selector
- **Mobile:** Full-width dropdown

## 🎨 Styling Variables Used

```css
--text-primary
--text-secondary
--background-secondary
--background-hover
--background-disabled
--border-color
--primary-color
```

## 🔐 Security Features

✅ Version whitelist validation
✅ Only official Ballerina Docker images
✅ No custom image names allowed
✅ Input sanitization
✅ Default fallback version

## ⚡ Performance

- **Image Caching:** Docker images cached locally
- **State Persistence:** localStorage (no API calls)
- **Image Pull:** Only on first use (5-min timeout)
- **Lazy Loading:** Images pulled on-demand

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Selector not showing | Check component import in Header.jsx |
| Version not saving | Check localStorage permissions |
| Backend error | Verify version string matches exactly |
| Docker pull fails | Check internet & Docker daemon |

## 📞 Where to Look for Issues

1. **UI Issues:** `components/VersionSelector.jsx`, `components/Header.jsx`
2. **State Issues:** `hooks/useBallerinaVersion.js`
3. **API Issues:** `services/api.service.js`
4. **Backend Issues:** `handler/run.go`, `utils/docker.go`
5. **Styling Issues:** `components/VersionSelector.css`

## 🎓 Next Steps to Add More Versions

1. Update `GetBallerinaDockerImage()` in `backend/utils/docker.go`
2. Update `IsValidBallerinaVersion()` in `backend/utils/docker.go`
3. Update `BALLERINA_VERSIONS` in `frontend-vite/src/components/VersionSelector.jsx`
4. Test with new version
5. Update documentation

## 📚 Related Documentation

- Full feature documentation: `docs/VERSION_SELECTOR_FEATURE.md`
- Implementation guide: `VERSION_SELECTOR_IMPLEMENTATION.md`
- API specification: `backend/openapi.yaml`
