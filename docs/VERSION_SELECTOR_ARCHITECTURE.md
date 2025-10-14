# Ballerina Version Selector - Architecture Diagram

## Component Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (Frontend)                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        App.jsx                                │  │
│  │  • Manages application state                                 │  │
│  │  • Integrates all hooks and components                       │  │
│  │  • Orchestrates version selection flow                       │  │
│  └────────────┬─────────────────────────────────┬───────────────┘  │
│               │                                  │                  │
│               ▼                                  ▼                  │
│  ┌────────────────────────┐      ┌─────────────────────────────┐  │
│  │   Header Component     │      │  useBallerinaVersion Hook   │  │
│  │  ┌──────────────────┐  │      │  • Manages version state    │  │
│  │  │ VersionSelector  │  │      │  • localStorage persistence │  │
│  │  │  Component       │  │      │  • Version change handlers  │  │
│  │  │  • Dropdown UI   │  │      └──────────┬──────────────────┘  │
│  │  │  • Version list  │  │                 │                     │
│  │  │  • Event handler │  │                 │                     │
│  │  └──────────────────┘  │                 │                     │
│  └────────────────────────┘                 │                     │
│               │                              │                     │
│               ▼                              ▼                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              useCodeExecution Hook                          │  │
│  │  • Handles code execution                                  │  │
│  │  • Receives version parameter                              │  │
│  │  • Calls API service with version                          │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              API Service (api.service.js)                   │  │
│  │  • executeCode(code, version, signal)                      │  │
│  │  • Sends POST request to backend                           │  │
│  │  • Includes version in request body                        │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             │ HTTP POST /run
                             │ { code, version }
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│                    Backend (Go Server)                            │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Handler (run.go / compile.go)                  │  │
│  │  1. Receive request with code and version                  │  │
│  │  2. Parse JSON body into CodeRequest struct                │  │
│  │  3. Set default version if not provided                    │  │
│  │  4. Validate version                                       │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
│                            ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         Utils Package (utils/docker.go)                     │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  IsValidBallerinaVersion(version string) bool        │  │  │
│  │  │  • Validates against whitelist                        │  │  │
│  │  │  • Returns true/false                                 │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                            │                                │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  GetBallerinaDockerImage(version string) string      │  │  │
│  │  │  • Maps version to Docker image name                 │  │  │
│  │  │  • e.g., "2201.10.2" → "ballerina/ballerina:2201.10.2"│ │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                            │                                │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  ensureBallerinaImage(dockerImage string) error      │  │  │
│  │  │  • Check if image exists locally                     │  │  │
│  │  │  • Pull image if not present (5-min timeout)         │  │  │
│  │  │  • Cache for future use                              │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  │                            │                                │  │
│  │                            ▼                                │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  RunBallerinaPackageWithContext(                     │  │  │
│  │  │      ctx, packageDir, version)                       │  │  │
│  │  │  • Execute code in Docker container                  │  │  │
│  │  │  • Use specified Docker image                        │  │  │
│  │  │  • Return output and errors                          │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────┬───────────────────────────────────┘  │
│                            │                                      │
└────────────────────────────┼──────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│                      Docker Engine                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ ballerina/       │  │ ballerina/       │  │ ballerina/     │  │
│  │ ballerina:       │  │ ballerina:       │  │ ballerina:     │  │
│  │ 2201.10.2        │  │ 2201.9.0         │  │ swan-lake      │  │
│  │ (Latest Stable)  │  │                  │  │ (Latest Dev)   │  │
│  └──────────────────┘  └──────────────────┘  └────────────────┘  │
│                                                                    │
│  • Images cached locally after first pull                         │
│  • Isolated execution environment                                 │
│  • Security constraints applied                                   │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
┌─────────┐              ┌─────────┐              ┌─────────┐              ┌─────────┐
│  User   │              │ Frontend│              │ Backend │              │ Docker  │
└────┬────┘              └────┬────┘              └────┬────┘              └────┬────┘
     │                        │                        │                        │
     │ 1. Select Version      │                        │                        │
     │ "2201.9.0"             │                        │                        │
     ├───────────────────────>│                        │                        │
     │                        │                        │                        │
     │                        │ 2. Save to localStorage│                        │
     │                        │ "ballerina-version"    │                        │
     │                        │                        │                        │
     │ 3. Click "Run Code"    │                        │                        │
     ├───────────────────────>│                        │                        │
     │                        │                        │                        │
     │                        │ 4. POST /run           │                        │
     │                        │ { code, version }      │                        │
     │                        ├───────────────────────>│                        │
     │                        │                        │                        │
     │                        │                        │ 5. Validate version    │
     │                        │                        │ IsValidBallerinaVersion│
     │                        │                        │                        │
     │                        │                        │ 6. Get Docker image    │
     │                        │                        │ GetBallerinaDockerImage│
     │                        │                        │                        │
     │                        │                        │ 7. Ensure image exists │
     │                        │                        ├───────────────────────>│
     │                        │                        │                        │
     │                        │                        │ 8. Pull if needed      │
     │                        │                        │<───────────────────────┤
     │                        │                        │                        │
     │                        │                        │ 9. Run container       │
     │                        │                        │ with version image     │
     │                        │                        ├───────────────────────>│
     │                        │                        │                        │
     │                        │                        │ 10. Execute code       │
     │                        │                        │<───────────────────────┤
     │                        │                        │                        │
     │                        │ 11. Return output      │                        │
     │                        │<───────────────────────┤                        │
     │                        │                        │                        │
     │ 12. Display output     │                        │                        │
     │<───────────────────────┤                        │                        │
     │                        │                        │                        │
```

## Version Mapping Table

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Version Mapping                                  │
├────────────────┬──────────────────────────┬──────────────────────────────┤
│ User Selection │ Backend Version String   │ Docker Image                 │
├────────────────┼──────────────────────────┼──────────────────────────────┤
│ (Default)      │ "2201.10.2"              │ ballerina/ballerina:2201.10.2│
│ Dropdown: ⭐   │                          │                              │
├────────────────┼──────────────────────────┼──────────────────────────────┤
│ Dropdown       │ "2201.9.0"               │ ballerina/ballerina:2201.9.0 │
│                │                          │                              │
├────────────────┼──────────────────────────┼──────────────────────────────┤
│ Dropdown       │ "2201.8.0"               │ ballerina/ballerina:2201.8.0 │
│                │                          │                              │
├────────────────┼──────────────────────────┼──────────────────────────────┤
│ Dropdown       │ "swan-lake"              │ ballerina/ballerina:swan-lake│
│                │                          │                              │
└────────────────┴──────────────────────────┴──────────────────────────────┘
```

## State Management Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Frontend State Management                           │
└────────────────────────────────────────────────────────────────────────┘

useBallerinaVersion Hook
    ↓
┌─────────────────────────────────────────┐
│  useState(storedVersion)                │
│  • Current selected version in memory   │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  useLocalStorage('ballerina-version')  │
│  • Persisted version in browser storage │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  changeVersion(newVersion)              │
│  • Updates both state and localStorage │
└───────────────┬─────────────────────────┘
                │
                ↓
┌─────────────────────────────────────────┐
│  Triggers re-render                     │
│  • VersionSelector shows new value      │
│  • Next execution uses new version      │
└─────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Error Handling                                 │
└─────────────────────────────────────────────────────────────────────────┘

User sends invalid version
         ↓
Backend receives request
         ↓
┌────────────────────────────┐
│ IsValidBallerinaVersion()  │
│ Returns: false             │
└────────────┬───────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────┐
│ HTTP 400 Bad Request                                       │
│ {                                                          │
│   "output": "",                                            │
│   "error": "Invalid Ballerina version. Supported versions: │
│             2201.10.2, 2201.9.0, 2201.8.0, swan-lake"      │
│ }                                                          │
└────────────┬───────────────────────────────────────────────┘
             │
             ↓
Frontend displays error to user
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Security Validation                              │
└─────────────────────────────────────────────────────────────────────────┘

User input (version string)
         ↓
┌──────────────────────────┐
│ Frontend validation      │
│ • Type checking          │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│ Backend validation       │
│ • Whitelist check        │
│ • Strict matching        │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│ Image name construction  │
│ • Predefined prefix      │
│ • No user input in name  │
└──────────┬───────────────┘
           │
           ↓
┌──────────────────────────┐
│ Docker execution         │
│ • Official images only   │
│ • Security constraints   │
└──────────────────────────┘
```

## Component Hierarchy

```
App.jsx
  ├── Header
  │   ├── Logo
  │   ├── Title
  │   ├── VersionSelector ⭐ NEW
  │   │   └── select (dropdown)
  │   ├── Run Button
  │   ├── Stop Button
  │   ├── Reset Button
  │   ├── Clear Button
  │   ├── Layout Controls
  │   ├── Fullscreen Toggle
  │   ├── Theme Toggle
  │   └── GitHub Link
  ├── ResizablePanels
  │   ├── CodeEditor
  │   └── OutputPanel
  ├── ConfirmDialog
  ├── ErrorNotification
  └── UserGuide
```

## File Dependencies

```
App.jsx
  └── imports useBallerinaVersion from hooks/useBallerinaVersion.js
  └── imports useCodeExecution from hooks/useCodeExecution.js
  └── passes version to Header component

Header.jsx
  └── imports VersionSelector from components/VersionSelector.jsx
  └── receives ballerinaVersion and onVersionChange props
  └── renders VersionSelector with props

VersionSelector.jsx
  └── imports VersionSelector.css
  └── defines BALLERINA_VERSIONS array
  └── renders dropdown with versions

useBallerinaVersion.js
  └── imports useLocalStorage from hooks/useLocalStorage.js
  └── manages version state
  └── persists to localStorage

useCodeExecution.js
  └── imports apiService from services/api.service.js
  └── executeCode(code, version) function
  └── calls apiService.executeCode(code, version, signal)

api.service.js
  └── executeCode(code, version, signal) function
  └── sends POST request with version in body
```
