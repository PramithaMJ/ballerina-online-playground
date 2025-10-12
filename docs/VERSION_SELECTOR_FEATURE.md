# Ballerina Version Selector Feature

## Overview
This feature allows users to select different Ballerina versions to compile and run their code. The selected version is persisted in browser localStorage and used for all subsequent code executions.

## Supported Versions

The following Ballerina versions are currently supported:

1. **2201.10.2** (Latest Stable) - ⭐ Recommended
2. **2201.9.0**
3. **2201.8.0**
4. **swan-lake** (Latest Development)

## Architecture

### Backend Changes

#### 1. Request Structure (`handler/run.go`, `handler/compile.go`)
```go
type CodeRequest struct {
    Code    string `json:"code"`
    Version string `json:"version"` // Ballerina version
}
```

#### 2. Version Validation (`utils/docker.go`)
```go
func IsValidBallerinaVersion(version string) bool {
    validVersions := []string{"2201.10.2", "2201.9.0", "2201.8.0", "swan-lake", "latest"}
    // Validation logic
}
```

#### 3. Docker Image Mapping (`utils/docker.go`)
```go
func GetBallerinaDockerImage(version string) string {
    // Maps version string to Docker image
    // e.g., "2201.10.2" -> "ballerina/ballerina:2201.10.2"
}
```

#### 4. Dynamic Image Pulling
The backend automatically pulls the required Docker image if not available locally:
- Image check before execution
- Automatic pull with 5-minute timeout
- Cached locally for subsequent runs

### Frontend Changes

#### 1. Version Selector Component (`components/VersionSelector.jsx`)
- Dropdown selector for Ballerina versions
- Shows recommended version with star (⭐)
- Disabled during code execution
- Responsive design

#### 2. Version Management Hook (`hooks/useBallerinaVersion.js`)
```javascript
const { version, changeVersion, resetVersion } = useBallerinaVersion();
```
- Manages version state
- Persists selection to localStorage
- Provides version change handlers

#### 3. API Integration (`services/api.service.js`)
```javascript
async executeCode(code, version = '2201.10.2', signal = null)
```
- Version parameter added to API calls
- Default version fallback
- Sent to backend with code

#### 4. UI Integration (`components/Header.jsx`)
- Version selector integrated into header
- Positioned before action buttons
- Disabled during code execution

## Usage

### For Users

1. **Select Version:**
   - Use the version dropdown in the header
   - Selected version is saved automatically
   - Version persists across browser sessions

2. **Run Code:**
   - Click "Run Code" or press Ctrl+Enter
   - Code executes with selected version
   - Version indicator shows in selector

3. **Switch Versions:**
   - Select different version from dropdown
   - Next execution uses new version
   - Previous version settings are preserved

### For Developers

#### Adding New Versions

1. **Backend** (`utils/docker.go`):
```go
func GetBallerinaDockerImage(version string) string {
    switch version {
    case "NEW_VERSION":
        return "ballerina/ballerina:NEW_VERSION"
    // ... existing cases
    }
}

func IsValidBallerinaVersion(version string) bool {
    validVersions := []string{"NEW_VERSION", /* ... existing */}
    // ... validation logic
}
```

2. **Frontend** (`components/VersionSelector.jsx`):
```javascript
const BALLERINA_VERSIONS = [
  { value: 'NEW_VERSION', label: 'Ballerina NEW_VERSION' },
  // ... existing versions
];
```

#### Testing

1. **Backend Testing:**
```bash
cd backend
# Test version validation
go test ./utils -run TestIsValidBallerinaVersion

# Test with different versions
curl -X POST http://localhost:8081/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import ballerina/io;\npublic function main() { io:println(\"Hello\"); }",
    "version": "2201.10.2"
  }'
```

2. **Frontend Testing:**
```bash
cd frontend-vite
npm run dev

# Test version selector
# 1. Open browser DevTools
# 2. Check localStorage for 'ballerina-version'
# 3. Change version and verify API request payload
```

## API Documentation

### POST /run

**Request:**
```json
{
  "code": "import ballerina/io;\npublic function main() { io:println(\"Hello\"); }",
  "version": "2201.10.2"
}
```

**Response:**
```json
{
  "output": "Hello\n",
  "error": ""
}
```

**Version Parameter:**
- Type: `string`
- Required: No
- Default: `"2201.10.2"`
- Valid values: `"2201.10.2"`, `"2201.9.0"`, `"2201.8.0"`, `"swan-lake"`

### POST /compile

Same request/response structure as `/run` endpoint.

## Error Handling

### Invalid Version
**Request:**
```json
{
  "code": "...",
  "version": "invalid-version"
}
```

**Response:**
```json
{
  "output": "",
  "error": "Invalid Ballerina version. Supported versions: 2201.10.2, 2201.9.0, 2201.8.0, swan-lake"
}
```

### Version Not Specified
If version is not provided, defaults to `"2201.10.2"`.

## Performance Considerations

1. **Docker Image Caching:**
   - Images are pulled once and cached locally
   - Subsequent runs use cached images
   - 5-minute timeout for image pulls

2. **Version Persistence:**
   - Version stored in browser localStorage
   - No API calls for version retrieval
   - Instant version switching in UI

3. **Concurrent Executions:**
   - Different versions can run simultaneously
   - Each execution uses specified version
   - No version conflicts

## Security

1. **Version Validation:**
   - Whitelist of valid versions
   - Invalid versions rejected at backend
   - Prevents Docker image injection

2. **Docker Image Sources:**
   - Only official Ballerina images
   - Images from `ballerina/ballerina` repository
   - No user-specified image names

## Future Enhancements

1. **Auto-detect Version:**
   - Analyze code for version-specific syntax
   - Suggest appropriate version
   - Warn about compatibility issues

2. **Version Comparison:**
   - Run code on multiple versions
   - Show output differences
   - Migration assistance

3. **Version Info:**
   - Show version release notes
   - Display feature differences
   - Link to documentation

4. **Custom Versions:**
   - Support for pre-release versions
   - Beta testing versions
   - Nightly builds

## Troubleshooting

### Version Not Working
1. Check Docker image availability
2. Verify network connection for pulls
3. Check Docker daemon status

### Version Not Persisting
1. Check browser localStorage
2. Clear cache and retry
3. Check browser console for errors

### Wrong Version Executing
1. Verify selected version in UI
2. Check network request payload
3. Review backend logs

## Related Files

**Backend:**
- `/backend/handler/run.go`
- `/backend/handler/compile.go`
- `/backend/utils/docker.go`
- `/backend/openapi.yaml`

**Frontend:**
- `/frontend-vite/src/components/VersionSelector.jsx`
- `/frontend-vite/src/components/VersionSelector.css`
- `/frontend-vite/src/hooks/useBallerinaVersion.js`
- `/frontend-vite/src/services/api.service.js`
- `/frontend-vite/src/App.jsx`
- `/frontend-vite/src/components/Header.jsx`
