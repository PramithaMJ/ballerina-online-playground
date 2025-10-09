# Ballerina Playground - Modern Frontend

A modern, professional React + Vite frontend for the Ballerina Online Playground.

## ✨ Features

- 🎨 Modern, professional UI with teal theme
- 💻 Monaco Editor integration (VS Code editor)
- 🚀 Lightning-fast Vite build system
- 📱 Fully responsive design
- 🎯 Real-time code execution
- 🎭 Beautiful animations and transitions
- 🌙 Dark theme optimized
- ⚡ Hot Module Replacement (HMR)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

The app will open automatically at `http://localhost:3000`

### 3. Build for Production

```bash
npm run build
```

### 4. Preview Production Build

```bash
npm run preview
```

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend server running on `http://localhost:8081`

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (same as VS Code)
- **Lucide React** - Beautiful icons
- **Modern CSS** - Custom styling with gradients and animations

## 🎨 Design Features

### Color Scheme
- Primary: `#52c3c2` (Teal)
- Background: `#0a0e1a` (Dark blue-black)
- Surface: `#1e1e1e` (Dark gray)
- Text: `#e4e6eb` (Light gray)
- Success: `#51cf66` (Green)
- Error: `#ff6b6b` (Red)

### Components

1. **Header**
   - Logo and branding
   - Action buttons (Run, Reset, Clear)
   - GitHub link
   - Responsive layout

2. **Code Editor**
   - Monaco Editor integration
   - Syntax highlighting
   - Line numbers
   - Auto-completion
   - Line count display

3. **Output Panel**
   - Separate sections for output and errors
   - Status badges
   - Empty state design
   - Scrollable content

## 🔧 Configuration

### Change Backend URL

Edit `src/App.jsx`:

```javascript
const response = await fetch('http://localhost:8081/execute', {
  // Change URL here
})
```

### Change Port

Edit `vite.config.js`:

```javascript
export default defineConfig({
  server: {
    port: 3000, // Change port here
  }
})
```

## 📱 Responsive Design

- Desktop: Side-by-side editor and output
- Tablet: Side-by-side with adjusted spacing
- Mobile: Stacked layout

Breakpoint: `768px`

## 🎯 Usage

1. **Write Code**: Use the Monaco editor on the left
2. **Run Code**: Click the "Run Code" button
3. **View Output**: See results in the output panel
4. **Reset**: Load sample code
5. **Clear**: Start fresh

## 🚀 Deployment

### Netlify / Vercel

```bash
npm run build
# Upload 'dist' folder
```

### Static Hosting

```bash
npm run build
# Serve 'dist' folder with any static hosting
```

### Environment Variables

Create `.env` file:

```env
VITE_API_URL=http://localhost:8081
```

Use in code:

```javascript
fetch(`${import.meta.env.VITE_API_URL}/execute`)
```

## 🐛 Troubleshooting

### "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use"

Change port in `vite.config.js` or kill process:

```bash
lsof -i :3000
kill -9 <PID>
```

### Editor not loading

Check browser console for errors. Monaco Editor requires modern browser.

## 📚 Resources

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Lucide Icons](https://lucide.dev/)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📝 License

Same as parent project

---

**Made with ❤️ by [Pramitha](https://github.com/PramithaMJ)**
