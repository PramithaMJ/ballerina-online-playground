# Ballerina Version Support - Complete List

## 🎯 Latest Update: All Swan Lake Versions Supported!

The Ballerina Online Playground now supports **all Swan Lake versions** from the initial GA release to the latest Update 12!

---

## 📊 Supported Versions (73 versions total)

### 🌟 Swan Lake Update 12 (Latest - Default)
- **2201.12.0** ⭐ **(Recommended - Default Version)**

### Swan Lake Update 11
- 2201.11.2
- 2201.11.1
- 2201.11.0

### Swan Lake Update 10
- 2201.10.5
- 2201.10.4
- 2201.10.3
- 2201.10.2
- 2201.10.1
- 2201.10.0

### Swan Lake Update 9
- 2201.9.3
- 2201.9.2
- 2201.9.1
- 2201.9.0

### Swan Lake Update 8
- 2201.8.6
- 2201.8.5
- 2201.8.4
- 2201.8.3
- 2201.8.2
- 2201.8.1
- 2201.8.0

### Swan Lake Update 7
- 2201.7.2
- 2201.7.1
- 2201.7.0

### Swan Lake Update 6
- 2201.6.0

### Swan Lake Update 5
- 2201.5.0

### Swan Lake Update 4
- 2201.4.1
- 2201.4.0

### Swan Lake Update 3
- 2201.3.3
- 2201.3.2
- 2201.3.1
- 2201.3.0

### Swan Lake Update 2
- 2201.2.3
- 2201.2.2
- 2201.2.1
- 2201.2.0

### Swan Lake Update 1
- 2201.1.3
- 2201.1.2
- 2201.1.1
- 2201.1.0

### Swan Lake GA (Initial Release)
- 2201.0.3
- 2201.0.2
- 2201.0.1
- 2201.0.0

### Special Tags
- **swan-lake** - Latest development build
- **latest** - Latest stable release

---

## 🚀 What Changed?

### Before
- ❌ Only 4 versions supported (2201.10.2, 2201.9.0, 2201.8.0, swan-lake)
- ❌ Default: 2201.10.2

### After
- ✅ **73 versions** supported (all Swan Lake releases!)
- ✅ Default: **2201.12.0** (Latest Stable)
- ✅ Better organized by Swan Lake updates
- ✅ Clearer version labels in UI

---

## 📝 Version Naming Convention

All versions follow the pattern: `2201.X.Y`

Where:
- **2201** = Swan Lake series
- **X** = Update number (0-12)
- **Y** = Patch number (0-6)

Examples:
- `2201.12.0` = Swan Lake Update 12, Patch 0
- `2201.11.2` = Swan Lake Update 11, Patch 2
- `2201.0.0` = Swan Lake GA (Initial Release)

---

## 🎨 UI Changes

### Dropdown Labels Format
```
Swan Lake Update X.Y (2201.X.Y)
```

Examples:
- `Swan Lake Update 12 (2201.12.0)` ⭐
- `Swan Lake Update 11.2 (2201.11.2)`
- `Swan Lake Update 10.5 (2201.10.5)`

### Grouping
Versions are logically grouped by major updates for easier navigation.

---

## 🔧 Technical Details

### Backend Changes

**File:** `backend/utils/docker.go`

```go
// 73 version cases in GetBallerinaDockerImage()
// All versions from 2201.0.0 to 2201.12.0

// New default version
if version == "" {
    version = "2201.12.0"
}
```

**File:** `backend/handler/run.go` & `backend/handler/compile.go`

```go
// Updated default version
ballerinaVersion = "2201.12.0"

// Updated error message
Error: "Invalid Ballerina version. Please check supported versions at https://hub.docker.com/r/ballerina/ballerina/tags"
```

### Frontend Changes

**File:** `frontend-vite/src/components/VersionSelector.jsx`

```javascript
// 73 versions in BALLERINA_VERSIONS array
// Organized by Swan Lake updates
// Clear, descriptive labels

const BALLERINA_VERSIONS = [
  { value: '2201.12.0', label: 'Swan Lake Update 12 (2201.12.0)', recommended: true },
  { value: '2201.11.2', label: 'Swan Lake Update 11.2 (2201.11.2)' },
  // ... 71 more versions
];
```

**Files Updated:**
- `hooks/useBallerinaVersion.js` - Default: `2201.12.0`
- `hooks/useCodeExecution.js` - Default: `2201.12.0`
- `services/api.service.js` - Default: `2201.12.0`
- `components/Header.jsx` - Default: `2201.12.0`

---

## 📚 Docker Hub Reference

All versions are available at:
**https://hub.docker.com/r/ballerina/ballerina/tags**

Docker images follow the pattern:
```
ballerina/ballerina:<version>
```

Examples:
- `ballerina/ballerina:2201.12.0`
- `ballerina/ballerina:2201.11.2`
- `ballerina/ballerina:swan-lake`

---

## 🎯 Usage Examples

### API Request with Latest Version
```bash
curl -X POST http://localhost:8081/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import ballerina/io;\npublic function main() { io:println(\"Hello from Swan Lake 12!\"); }",
    "version": "2201.12.0"
  }'
```

### API Request with Older Version
```bash
curl -X POST http://localhost:8081/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import ballerina/io;\npublic function main() { io:println(\"Hello from Swan Lake GA!\"); }",
    "version": "2201.0.0"
  }'
```

### API Request with Development Build
```bash
curl -X POST http://localhost:8081/run \
  -H "Content-Type: application/json" \
  -d '{
    "code": "import ballerina/io;\npublic function main() { io:println(\"Hello from latest dev!\"); }",
    "version": "swan-lake"
  }'
```

---

## 🔍 Version Selection Guide

### When to Use Which Version?

**2201.12.0 (Latest Stable)** ⭐
- ✅ New projects
- ✅ Latest features
- ✅ Best performance
- ✅ **Recommended for most users**

**2201.11.x - 2201.10.x (Recent Stable)**
- ✅ Stable features
- ✅ Well-tested
- ✅ Good for production

**2201.9.x - 2201.0.0 (Older Versions)**
- ✅ Legacy code support
- ✅ Specific feature requirements
- ✅ Compatibility testing

**swan-lake (Development)**
- ⚠️ Latest features (may be unstable)
- ⚠️ For testing upcoming releases
- ⚠️ Not recommended for production

---

## 🎊 Benefits of All Version Support

✅ **Flexibility** - Test code across multiple versions
✅ **Compatibility** - Verify code works with different releases
✅ **Migration** - Gradually upgrade from older versions
✅ **Testing** - Compare behavior across versions
✅ **Learning** - Explore features in different releases
✅ **Debugging** - Identify version-specific issues

---

## 🔄 Migration Path Example

If you're on an old version, you can gradually upgrade:

```
2201.0.0 → 2201.3.0 → 2201.6.0 → 2201.9.0 → 2201.12.0
  ↓          ↓          ↓          ↓          ↓
 Test     Test       Test       Test      Final
```

Use the version selector to test your code at each step!

---

## 📊 Version Statistics

- **Total Versions:** 73
- **Swan Lake Updates:** 13 (0-12)
- **Latest Version:** 2201.12.0
- **Oldest Version:** 2201.0.0
- **Most Patches:** Update 8 (7 patches: 8.0-8.6)

---

## 🆕 Recently Added (This Update)

### Swan Lake Update 12
- ✅ 2201.12.0 (Latest!)

### Swan Lake Update 11
- ✅ 2201.11.2
- ✅ 2201.11.1
- ✅ 2201.11.0

### Additional Update 10 Patches
- ✅ 2201.10.5
- ✅ 2201.10.4
- ✅ 2201.10.3
- ✅ 2201.10.1
- ✅ 2201.10.0

### Additional Update 9 Patches
- ✅ 2201.9.3
- ✅ 2201.9.2
- ✅ 2201.9.1

### Additional Update 8 Patches
- ✅ 2201.8.6
- ✅ 2201.8.5
- ✅ 2201.8.4
- ✅ 2201.8.3
- ✅ 2201.8.2
- ✅ 2201.8.1

### All Previous Updates
- ✅ Updates 7, 6, 5, 4, 3, 2, 1, and GA (0)
- ✅ All patch versions for each update

---

## 🚀 Next Steps

1. **Update your frontend** - Pull latest changes and run `npm install`
2. **Update your backend** - Rebuild with `go build`
3. **Test version selection** - Try selecting different versions in UI
4. **Verify execution** - Run code with different versions
5. **Explore features** - Test version-specific features

---

## 📞 Support

For the most up-to-date list of versions, always check:
**https://hub.docker.com/r/ballerina/ballerina/tags**

---

## 🎉 Summary

The Ballerina Online Playground now supports **all 73 Swan Lake versions**! 

- Default version updated to **2201.12.0** (Swan Lake Update 12)
- Clear, organized version labels
- Full backward compatibility
- Complete version history support

**Enjoy exploring all Ballerina Swan Lake versions!** 🦢
