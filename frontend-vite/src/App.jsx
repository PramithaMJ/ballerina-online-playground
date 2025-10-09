import { useState, useRef, useEffect } from 'react'
import Header from './components/Header'
import CodeEditor from './components/CodeEditor'
import OutputPanel from './components/OutputPanel'
import ResizablePanels from './components/ResizablePanels'
import './App.css'

const SAMPLE_CODE = `import ballerina/io;

public function main() {
    io:println("Hello, Ballerina!");
    
    // Try some math
    int result = 10 + 5 * 2;
    io:println("Result: ", result);
    
    // String operations
    string name = "Developer";
    io:println("Welcome, ", name, "!");
}`;

function App() {
  const [code, setCode] = useState(SAMPLE_CODE)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(localStorage.getItem('app-theme') || 'dark')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const resizablePanelsRef = useRef(null)

  // Apply theme to document
  useState(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('app-theme', theme)
  }, [theme])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  // Listen for F11 key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 'Escape' && isFullscreen) {
        exitFullscreen()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('app-theme', newTheme)
  }

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          await elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen()
        } else if (elem.mozRequestFullScreen) {
          await elem.mozRequestFullScreen()
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen()
        }
      } else {
        // Exit fullscreen
        await exitFullscreen()
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen()
      }
    } catch (err) {
      console.error('Error exiting fullscreen:', err)
    }
  }

  const handleToggleLayout = () => {
    if (resizablePanelsRef.current) {
      resizablePanelsRef.current.toggleLayout()
    }
  }

  const handleResetSplit = () => {
    if (resizablePanelsRef.current) {
      resizablePanelsRef.current.resetSplit()
    }
  }

  const handleRun = async () => {
    if (!code.trim()) {
      setError('Please write some Ballerina code first!')
      setOutput('')
      return
    }

    setIsRunning(true)
    setOutput('Running your code... Please wait.')
    setError('')

    try {
      const response = await fetch('http://localhost:8081/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      const result = await response.json()

      if (response.ok) {
        if (result.error) {
          setError(result.error)
          setOutput(result.output || '')
        } else {
          setOutput(result.output || 'Code executed successfully with no output.')
          setError('')
        }
      } else {
        setError(result.error || 'Something went wrong!')
        setOutput('')
      }
    } catch (err) {
      setError(`Connection Error: ${err.message}\n\nMake sure the backend server is running on http://localhost:8081`)
      setOutput('')
    } finally {
      setIsRunning(false)
    }
  }

  const handleClear = () => {
    setCode('')
    setOutput('')
    setError('')
  }

  const handleReset = () => {
    setCode(SAMPLE_CODE)
    setOutput('')
    setError('')
  }

  return (
    <div className="app">
      <Header 
        onRun={handleRun} 
        onClear={handleClear}
        onReset={handleReset}
        isRunning={isRunning}
        theme={theme}
        onToggleTheme={toggleTheme}
        layout={resizablePanelsRef.current?.layout || 'horizontal'}
        onToggleLayout={handleToggleLayout}
        onResetSplit={handleResetSplit}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />
      <ResizablePanels
        ref={resizablePanelsRef}
        leftPanel={<CodeEditor code={code} onChange={setCode} />}
        rightPanel={<OutputPanel output={output} error={error} />}
      />
    </div>
  )
}

export default App
