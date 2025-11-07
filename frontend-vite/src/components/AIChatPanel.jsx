import { useState, useRef, useEffect } from 'react';
import { Sparkles, Lightbulb, Wrench, Zap, HelpCircle, Trash2, User, Bot, Copy, Send, Loader2, AlertCircle, Terminal, Activity, BookOpen, ArrowUp, MoreVertical, Maximize2, Minimize2 } from 'lucide-react';
import { marked } from 'marked';
import { aiService } from '../services';
import './AIChatPanel.css';

/**
 * AI Chat Panel Component
 * Provides AI-powered code assistance and chat for Ballerina code
 */
const AIChatPanel = ({ code, onCodeInsert, ballerinaVersion, onError, onSwitchToOutput, onOpenUserGuide }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Ballerina AI assistant. I can help you:\n\n• Explain code\n• Fix errors\n• Suggest improvements\n• Answer Ballerina questions\n\nWhat can I help you with?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chatEndRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const inputRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const headerRef = useRef(null);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Detect narrow panels using ResizeObserver
  useEffect(() => {
    if (!headerRef.current) return;
    
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsNarrow(width < 500); // Show compact mode when panel is < 500px
      }
    });
    
    resizeObserver.observe(headerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMobileMenu]);

  // Configure marked for markdown rendering
  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: false,
      mangle: false,
    });
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Ensure chat container can scroll to top when user scrolls manually
  useEffect(() => {
    const chatContainer = chatEndRef.current?.parentElement;
    if (chatContainer) {
      // Set initial scroll position to top on mount
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, []);

  // Track scroll position to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (chatMessagesRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = chatMessagesRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
        setShowScrollTop(!isNearBottom && scrollTop > 200);
      }
    };

    const chatContainer = chatMessagesRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Quick action buttons configuration
  const quickActions = [
    {
      icon: Lightbulb,
      label: 'Explain Code',
      action: 'explain',
      prompt: 'Can you explain this Ballerina code?',
    },
    {
      icon: Wrench,
      label: 'Fix Errors',
      action: 'fix',
      prompt: 'Can you help me fix any errors in this code?',
    },
    {
      icon: Zap,
      label: 'Optimize',
      action: 'optimize',
      prompt: 'How can I optimize this code?',
    },
    {
      icon: HelpCircle,
      label: 'Help',
      action: 'help',
      prompt: 'I need help with Ballerina. What can you assist me with?',
    },
  ];

  /**
   * Send message to AI
   */
  const sendMessage = async (message, context = {}) => {
    if (!message.trim()) return;

    setIsLoading(true);
    setInput(''); // Clear input immediately

    const userMessage = { role: 'user', content: message };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await aiService.chat(
        message,
        code,
        ballerinaVersion || 'latest',
        context,
        messages.slice(-5) // Last 5 messages for context
      );

      // Create assistant message with streaming effect
      const fullText = response.response || '';
      const suggestedCode = response.suggestedCode || null;
      
      // Add initial empty message
      const assistantMessage = {
        role: 'assistant',
        content: '',
        suggestedCode: suggestedCode,
        isStreaming: true,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Animate text display character by character (like ChatGPT)
      let currentIndex = 0;
      
      const streamInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          // Add 2-4 characters at a time for smoother, faster display
          const charsToAdd = Math.min(3, fullText.length - currentIndex);
          currentIndex += charsToAdd;
          
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.isStreaming) {
              lastMessage.content = fullText.substring(0, currentIndex);
            }
            return newMessages;
          });
        } else {
          // Streaming complete
          clearInterval(streamInterval);
          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              delete lastMessage.isStreaming;
            }
            return newMessages;
          });
        }
      }, 15); // Adjust speed: lower = faster (15ms for smooth, fast display)

    } catch (error) {
      console.error('AI Chat Error:', error);
      setIsLoading(false);
      
      const errorMessage = {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}\n\nPlease make sure the AI service is configured correctly.`,
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
      
      if (onError) {
        onError(error.message);
      }
    } finally {
      inputRef.current?.focus();
    }
  };

  /**
   * Handle quick action button click
   */
  const handleQuickAction = (action, prompt) => {
    const context = { action };
    
    // For code-specific actions, ensure we have code
    if ((action === 'explain' || action === 'fix' || action === 'optimize') && !code.trim()) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Please write some code first, then I can help you with it.',
          isError: true,
        },
      ]);
      return;
    }

    sendMessage(prompt, context);
  };

  /**
   * Handle code insertion into editor
   */
  const handleCodeInsert = (suggestedCode) => {
    if (onCodeInsert && suggestedCode) {
      onCodeInsert(suggestedCode);
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  /**
   * Clear conversation
   */
  const clearConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Conversation cleared! How can I help you?',
      },
    ]);
  };

  /**
   * Scroll to top of chat
   */
  const scrollToTop = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className={`ai-chat-panel ${isFullscreen ? 'ai-fullscreen' : ''}`}>
      <div className="ai-header" ref={headerRef}>
        <div className="ai-header-title">
          <Sparkles className="ai-icon" size={20} />
          <h3 className={isNarrow ? 'hide-on-narrow' : ''}>AI Assistant</h3>
        </div>
        
        <div className="ai-header-actions">
          {/* Desktop/Wide View - All buttons visible */}
          {!isNarrow && (
            <>
              {onOpenUserGuide && (
                <button
                  onClick={onOpenUserGuide}
                  className="user-guide-btn"
                  title="Open User Guide"
                  aria-label="Open User Guide"
                >
                  <BookOpen size={16} />
                </button>
              )}
              {onSwitchToOutput && (
                <button
                  onClick={onSwitchToOutput}
                  className="switch-view-btn"
                  title="Switch to Output/Console"
                  aria-label="Switch to Output/Console"
                >
                  <Terminal size={16} />
                  <span>Output</span>
                </button>
              )}
              <button
                onClick={clearConversation}
                className="clear-btn"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={toggleFullscreen}
                className="fullscreen-btn"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </>
          )}

          {/* Narrow View - Compact menu */}
          {isNarrow && (
            <div className="narrow-controls" ref={mobileMenuRef}>
              <button
                className="control-btn compact-menu-btn"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                title="More options"
                aria-label="More options"
              >
                <MoreVertical size={16} />
              </button>

              {showMobileMenu && (
                <div className="compact-dropdown-menu">
                  {onOpenUserGuide && (
                    <button
                      className="compact-menu-item"
                      onClick={() => {
                        onOpenUserGuide();
                        setShowMobileMenu(false);
                      }}
                    >
                      <BookOpen size={16} />
                      <span>User Guide</span>
                    </button>
                  )}
                  
                  {onSwitchToOutput && (
                    <>
                      <div className="compact-menu-divider" />
                      <button
                        className="compact-menu-item"
                        onClick={() => {
                          onSwitchToOutput();
                          setShowMobileMenu(false);
                        }}
                      >
                        <Terminal size={16} />
                        <span>Output Console</span>
                      </button>
                    </>
                  )}
                  
                  <div className="compact-menu-divider" />
                  
                  <button
                    className="compact-menu-item"
                    onClick={() => {
                      clearConversation();
                      setShowMobileMenu(false);
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Clear Chat</span>
                  </button>
                  
                  <div className="compact-menu-divider" />
                  
                  <button
                    className="compact-menu-item"
                    onClick={() => {
                      toggleFullscreen();
                      setShowMobileMenu(false);
                    }}
                  >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        {quickActions.map(({ icon: Icon, label, action, prompt }) => (
          <button
            key={action}
            onClick={() => handleQuickAction(action, prompt)}
            className="quick-action-btn"
            disabled={isLoading}
            title={label}
          >
            <Icon className="quick-action-icon" size={16} />
            <span className="quick-action-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="chat-messages" ref={chatMessagesRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-bubble">
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content || '') }}
              />
              {msg.suggestedCode && (
                <div className="suggested-code-container">
                  <div className="code-header">
                    <span>Suggested Code:</span>
                    <button
                      onClick={() => handleCodeInsert(msg.suggestedCode)}
                      className="insert-code-btn"
                      title="Insert code into editor"
                    >
                      <Copy size={14} />
                      <span>Insert Code</span>
                    </button>
                  </div>
                  <pre className="suggested-code">
                    <code>{msg.suggestedCode}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
        
        {/* Scroll to top button */}
        {showScrollTop && (
          <button 
            className="scroll-to-top-btn" 
            onClick={scrollToTop}
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>

      <div className="chat-input-container">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about Ballerina code... (Shift+Enter for new line)"
          className="chat-input"
          disabled={isLoading}
          rows={1}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={isLoading || !input.trim()}
          className="send-btn"
          title="Send message"
          aria-label="Send message"
        >
          {isLoading ? <Loader2 size={18} className="spinning" /> : <Send size={18} />}
        </button>
      </div>

      <div className="ai-footer">
        <small>Powered by AI • Ballerina v{ballerinaVersion || 'latest'}</small>
      </div>
    </div>
  );
};

export default AIChatPanel;
