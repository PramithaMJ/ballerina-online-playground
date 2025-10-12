# UI Preview: Ballerina Version Selector

## Header Layout (Before & After)

### Before Implementation
```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔷 Ballerina Playground                                                     │
│    Write, Run & Debug Ballerina Code Online                                │
│                                                                             │
│    [▶ Run Code] [↻ Reset] [🗑 Clear] │ [⬌ Horizontal] [⊞ Reset Split]     │
│    │ [⛶ Fullscreen] │ [📖] [☀] [GitHub]                                    │
└────────────────────────────────────────────────────────────────────────────┘
```

### After Implementation
```
┌────────────────────────────────────────────────────────────────────────────┐
│ 🔷 Ballerina Playground                                                     │
│    Write, Run & Debug Ballerina Code Online                                │
│                                                                             │
│    [Version: Ballerina 2201.10.2 (Latest Stable) ⭐ ▼]  │                  │
│    [▶ Run Code] [↻ Reset] [🗑 Clear] │ [⬌ Horizontal] [⊞ Reset Split]     │
│    │ [⛶ Fullscreen] │ [📖] [☀] [GitHub]                                    │
└────────────────────────────────────────────────────────────────────────────┘
                      ↑
                      NEW VERSION SELECTOR!
```

## Version Selector Component

### Dropdown (Closed State)
```
┌─────────────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 (Latest Stable) ⭐  ▼]   │
└─────────────────────────────────────────────────────────┘
```

### Dropdown (Open State)
```
┌─────────────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 (Latest Stable) ⭐  ▲]   │
└─────────┬───────────────────────────────────────────────┘
          │
          ├──────────────────────────────────────────────┐
          │ ✓ Ballerina 2201.10.2 (Latest Stable) ⭐     │ ← Selected
          │ ─────────────────────────────────────────── │
          │   Ballerina 2201.9.0                        │
          │ ─────────────────────────────────────────── │
          │   Ballerina 2201.8.0                        │
          │ ─────────────────────────────────────────── │
          │   Swan Lake (Latest)                        │
          └─────────────────────────────────────────────┘
```

### States

#### Normal State
```
┌─────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]           │
│          └─ White/Dark background               │
│             Normal border                       │
│             Cursor: pointer                     │
└─────────────────────────────────────────────────┘
```

#### Hover State
```
┌─────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]           │
│          └─ Lighter background                  │
│             Blue border (primary color)         │
│             Cursor: pointer                     │
└─────────────────────────────────────────────────┘
```

#### Focus State
```
┌─────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]           │
│          └─ Blue border (primary color)         │
│             Blue glow/shadow                    │
│             Outline ring                        │
└─────────────────────────────────────────────────┘
```

#### Disabled State (During Execution)
```
┌─────────────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]           │
│          └─ Gray background                     │
│             Opacity: 0.6                        │
│             Cursor: not-allowed                 │
└─────────────────────────────────────────────────┘
```

## Full Header Layout (Detailed)

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                                                                                │
│  ┌──────┐  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                           │
│  │ LOGO │  ┃ Ballerina Playground                  ┃                           │
│  └──────┘  ┃ Write, Run & Debug Ballerina Code     ┃                           │
│            ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                           │
│                                                                                │
│                                                                                │
│             ┌────────────────────────────────────────────┐                     │
│             │ Version:  ┌─────────────────────────────┐ │                     │
│             │           │ Ballerina 2201.10.2 ⭐  ▼  │ │                     │
│             │           └─────────────────────────────┘ │                     │
│             └────────────────────────────────────────────┘                     │
│                                                                                │
│   │                                                                            │
│   │ (divider)                                                                  │
│   │                                                                            │
│                                                                                │
│   ┌──────────────┐  ┌─────────┐  ┌─────────┐                                 │
│   │ ▶ Run Code   │  │ ↻ Reset │  │ 🗑 Clear│                                 │
│   └──────────────┘  └─────────┘  └─────────┘                                 │
│                                                                                │
│   │  ┌──────────────┐  ┌──────────────┐                                      │
│   │  │ ⬌ Horizontal│  │ ⊞ Reset Split│                                      │
│   │  └──────────────┘  └──────────────┘                                      │
│                                                                                │
│   │  ┌──────────────┐                                                         │
│   │  │ ⛶ Fullscreen│                                                         │
│   │  └──────────────┘                                                         │
│                                                                                │
│   │  ┌────┐  ┌────┐  ┌────────┐                                              │
│   │  │ 📖 │  │ ☀ │  │ GitHub │                                              │
│   │  └────┘  └────┘  └────────┘                                              │
│                                                                                │
└────────────────────────────────────────────────────────────────────────────────┘
```

## During Code Execution

```
┌────────────────────────────────────────────────────────────────────────────────┐
│ 🔷 Ballerina Playground                                                         │
│    Write, Run & Debug Ballerina Code Online                                    │
│                                                                                 │
│    [Version: Ballerina 2201.10.2 ⭐ ▼]  │  ← DISABLED (grayed out)            │
│    [■ Stop] [Running: 3.5s] [█████████▒▒▒ 75%]  │                             │
│    [↻ Reset] [🗑 Clear] │ [⬌ Horizontal] [⊞ Reset Split]                      │
│    │ [⛶ Fullscreen] │ [📖] [☀] [GitHub]                                       │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (Responsive)

```
┌──────────────────────────────────┐
│ 🔷 Ballerina Playground          │
│                                  │
│ Version:                         │
│ ┌──────────────────────────────┐ │
│ │ Ballerina 2201.10.2 ⭐  ▼   │ │
│ └──────────────────────────────┘ │
│                                  │
│ ┌──────────────┐ ┌──────────────┐│
│ │ ▶ Run Code   │ │ ↻ Reset      ││
│ └──────────────┘ └──────────────┘│
│                                  │
│ ┌──────────────┐ ┌──────────────┐│
│ │ 🗑 Clear     │ │ ⬌ Layout    ││
│ └──────────────┘ └──────────────┘│
│                                  │
│ ┌──────────────┐ ┌──────────────┐│
│ │ ⛶ Fullscreen│ │ ☀ Theme     ││
│ └──────────────┘ └──────────────┘│
└──────────────────────────────────┘
```

## Color Scheme

### Light Theme
```
┌─────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]   │
│          ↑                              │
│          Background: #f8f9fa            │
│          Border: rgba(13, 148, 136, 0.3)│
│          Text: #212529                  │
│          Icon: #6c757d                  │
└─────────────────────────────────────────┘
```

### Dark Theme
```
┌─────────────────────────────────────────┐
│ Version: [Ballerina 2201.10.2 ⭐  ▼]   │
│          ↑                              │
│          Background: #1e1e1e            │
│          Border: #3c3c3c                │
│          Text: #d4d4d4                  │
│          Icon: #858585                  │
└─────────────────────────────────────────┘
```

## Interaction Flow (User Journey)

### Step 1: Initial Load
```
User opens page
      ↓
Version selector shows default: "2201.10.2 ⭐"
      ↓
If user has previously selected version:
      ↓
Version selector shows saved version (from localStorage)
```

### Step 2: User Changes Version
```
User clicks dropdown
      ↓
┌─────────────────────────────────────┐
│ ✓ Ballerina 2201.10.2 ⭐            │ ← Currently selected
│   Ballerina 2201.9.0                │
│   Ballerina 2201.8.0                │
│   Swan Lake (Latest)                │
└─────────────────────────────────────┘
      ↓
User selects "Ballerina 2201.9.0"
      ↓
Dropdown updates to show: "Ballerina 2201.9.0 ▼"
      ↓
Version saved to localStorage
      ↓
Next execution will use 2201.9.0
```

### Step 3: Running Code
```
User clicks "Run Code"
      ↓
Version selector becomes disabled (grayed out)
      ↓
Request sent with selected version
      ↓
Code executes with that version
      ↓
Execution completes
      ↓
Version selector becomes enabled again
```

## Visual Indicators

### Recommended Version (Star Icon)
```
[Ballerina 2201.10.2 (Latest Stable) ⭐  ▼]
                                     ↑
                                     Gold star indicates
                                     recommended version
```

### Dropdown State Icons
```
Closed: [... ▼]  (Chevron down)
Open:   [... ▲]  (Chevron up)
```

### Selection Checkmark
```
In dropdown menu:
✓ Selected item
  Unselected item
```

## Accessibility Features

```
┌─────────────────────────────────────────────────┐
│ <label for="version-select">Version:</label>   │
│ <select                                         │
│   id="version-select"                           │
│   aria-label="Select Ballerina version"        │
│   role="combobox"                               │
│   aria-expanded="false">                        │
│   ...options...                                 │
│ </select>                                       │
└─────────────────────────────────────────────────┘

Keyboard Navigation:
• Tab: Focus on selector
• Enter/Space: Open dropdown
• Arrow Up/Down: Navigate options
• Enter: Select option
• Esc: Close dropdown
```

## Animation & Transitions

```
Hover Effect:
  Duration: 0.2s ease
  Property: border-color, background-color

Dropdown Open:
  Duration: 0.15s ease-out
  Effect: Slide down + fade in

Selection Change:
  Duration: 0.2s ease
  Effect: Smooth value transition

Disabled State:
  Duration: 0.2s ease
  Property: opacity (1.0 → 0.6)
```

## Spacing & Dimensions

```
Version Selector:
  Min-width: 200px
  Height: ~32px
  Padding: 6px 32px 6px 12px (right padding for icon)
  Border-radius: 6px
  Font-size: 13px
  Font-weight: 500

Label:
  Font-size: 14px
  Font-weight: 500
  Margin-right: 8px

Gap between elements:
  Label → Selector: 8px
  Selector → Divider: 0.75rem (12px)
```

## Browser Compatibility

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+
✅ Opera 76+

All modern browsers with CSS Grid and Flexbox support.
