import { useState, useRef, useEffect } from 'react';
import { Sparkles, Lightbulb, Wrench, Zap, HelpCircle, Trash2, User, Bot, Copy, Send, Loader2, AlertCircle } from 'lucide-react';
import { marked } from 'marked';
import { aiService } from '../services';
import './AIChatPanel.css';

/**
 * AI Chat Panel Component
 * Provides AI-powered code assistance and chat for Ballerina code
 */
const AIChatPanel = ({ code, onCodeInsert, ballerinaVersion, onError }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I\'m your Ballerina AI assistant. I can help you:\n\n• Explain code\n• Fix errors\n• Suggest improvements\n• Answer Ballerina questions\n\nWhat can I help you with?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

      const aiMessage = {
        role: 'assistant',
        content: response.response,
        suggestedCode: response.suggestedCode || null,
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Chat Error:', error);
      
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
      setIsLoading(false);
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

  return (
    <div className="ai-chat-panel">
      <div className="ai-header">
        <div className="ai-header-title">
          <Sparkles className="ai-icon" size={20} />
          <h3>AI Assistant</h3>
        </div>
        <button
          onClick={clearConversation}
          className="clear-btn"
          title="Clear conversation"
          aria-label="Clear conversation"
        >
          <Trash2 size={18} />
        </button>
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

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role} ${msg.isError ? 'error' : ''}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className="message-bubble">
              <div 
                className="message-content"
                dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) }}
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
