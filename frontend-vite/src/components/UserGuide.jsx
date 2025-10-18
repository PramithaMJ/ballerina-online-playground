/**
 * User Guide Component
 * Comprehensive documentation and guidelines for using the Ballerina Playground
 * @component
 */

import { useState } from 'react';
import { X, BookOpen, Check, AlertCircle, Info, Keyboard, Zap } from 'lucide-react';
import './UserGuide.css';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Guide visibility state
 * @param {Function} props.onClose - Close handler
 * @param {boolean} props.isFirstVisit - Whether this is the user's first visit
 */
const UserGuide = ({ isOpen, onClose, isFirstVisit = false }) => {
  if (!isOpen) return null;

  return (
    <div className="user-guide-overlay" onClick={onClose}>
      <div className="user-guide-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="user-guide-header">
          <div className="user-guide-title">
            <BookOpen size={24} />
            <h2>
              {isFirstVisit ? 'Welcome to Ballerina Playground!' : 'Ballerina Playground - User Guide'}
            </h2>
          </div>
          <button 
            className="user-guide-close" 
            onClick={onClose}
            aria-label="Close user guide"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="user-guide-content">
          {/* First Visit Welcome Message */}
          {isFirstVisit && (
            <section className="guide-section welcome-section">
              <div className="welcome-banner">
                <h3> Thanks for trying out the Ballerina Playground!</h3>
                <p>
                  This guide will help you understand what you can do here and how to get started.
                  Take a moment to read through the key features and limitations below.
                </p>
              </div>
            </section>
          )}

          {/* Introduction */}
          <section className="guide-section">
            <h3><Info size={20} /> Welcome to Ballerina Playground</h3>
            <p>
              The Ballerina Playground is an interactive online environment for writing, 
              compiling, and executing Ballerina code directly in your browser. 
              It provides a secure, sandboxed environment with real-time feedback.
            </p>
          </section>

          <section className="guide-section">
            <h3><Info size={20} /> Ballerina Lint VsCode extension</h3>
            <p>
              A Best Practices Checker for Ballerina that integrates with VSCode to provide
              real-time feedback on code quality and adherence to best practices as you write code.
            </p>
            <ul className="feature-list">
              <li>
                <a href="https://pramithamj.github.io/ballerina-lint/" target="_blank" rel="noopener noreferrer">
                  Ballerina Lint Extension
                </a>
              </li>
            </ul> 
          </section>

          <section className="guide-section">
            <h3><Zap size={20} /> Getting Started</h3>
            <ol>
              <li>Write or paste your Ballerina code in the <strong>Code Editor</strong> (left panel)</li>
              <li>Click the <strong>"Run Code"</strong> button or press <kbd>Ctrl</kbd> + <kbd>Enter</kbd></li>
              <li>View the execution output in the <strong>Output Panel</strong> (right panel)</li>
              <li>Use <strong>"Reset"</strong> to restore sample code or <strong>"Clear"</strong> to start fresh</li>
            </ol>
          </section>

          {/* Supported Features */}
          <section className="guide-section">
            <h3><Check size={20} className="success-icon" /> Supported Features</h3>
            <ul className="feature-list">
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Standard I/O Operations:</strong> io:println(), io:print(), io:readln()</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Core Ballerina Modules:</strong> ballerina/io, ballerina/time, ballerina/lang.*, ballerina/math</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Data Types:</strong> All primitive types, records, arrays, tuples, maps</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Functions:</strong> Function definitions, anonymous functions, function pointers</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Control Flow:</strong> if/else, while, foreach, match statements</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Error Handling:</strong> error types, check expression, panic/trap</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>JSON Processing:</strong> JSON parsing, serialization, manipulation</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>String Operations:</strong> Template literals, string functions</span>
              </li>
              <li>
                <Check size={16} className="check-icon" />
                <span><strong>Type System:</strong> Type inference, type guards, union types</span>
              </li>
            </ul>
          </section>

          {/* Limitations */}
          <section className="guide-section">
            <h3><AlertCircle size={20} className="warning-icon" /> Limitations & Restrictions</h3>
            <ul className="feature-list warning-list">
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No Network Access:</strong> HTTP clients, WebSockets, and external API calls are disabled</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No File System:</strong> File I/O operations are not supported</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No Database Access:</strong> SQL, JDBC, and database connectors are unavailable</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No Services/Listeners:</strong> HTTP services, GraphQL, gRPC services cannot be started</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>Execution Timeout:</strong> Maximum execution time is 30 seconds</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>Memory Limit:</strong> Maximum memory usage is 256MB</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No External Dependencies:</strong> Cannot import external packages or libraries</span>
              </li>
              <li>
                <AlertCircle size={16} className="warning-icon" />
                <span><strong>No Multi-module Projects:</strong> Single-file execution only</span>
              </li>
            </ul>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="guide-section">
            <h3><Keyboard size={20} /> Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <div className="shortcut-keys">
                  <kbd>Ctrl</kbd> + <kbd>Enter</kbd>
                </div>
                <span>Run code</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-keys">
                  <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Q</kbd>
                </div>
                <span>Stop execution</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-keys">
                  <kbd>F11</kbd>
                </div>
                <span>Toggle fullscreen</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-keys">
                  <kbd>Esc</kbd>
                </div>
                <span>Exit fullscreen</span>
              </div>
              <div className="shortcut-item">
                <div className="shortcut-keys">
                  <kbd>Ctrl</kbd> + <kbd>S</kbd>
                </div>
                <span>Save code (localStorage)</span>
              </div>
            </div>
          </section>

          {/* Best Practices */}
          <section className="guide-section">
            <h3><Info size={20} /> Best Practices</h3>
            <ul>
              <li>Keep your code simple and focused for optimal performance</li>
              <li>Use meaningful variable and function names</li>
              <li>Add comments to explain complex logic</li>
              <li>Test small code snippets before writing complex programs</li>
              <li>Check the output panel for compilation and runtime errors</li>
              <li>Use the "Reset" button to restore the sample code if needed</li>
            </ul>
          </section>

          {/* Security Notice */}
          <section className="guide-section security-notice">
            <h3><AlertCircle size={20} /> Security & Privacy</h3>
            <p>
              All code execution happens in a secure, isolated :
            </p>
            <ul>
              <li>Network isolation (no internet access)</li>
              <li>Resource limits (CPU, memory, processes)</li>
              <li>Automatic timeout and cleanup</li>
              <li>Read-only file system</li>
            </ul>
            <p>
              <strong>Note:</strong> Your code is temporarily stored in your browser's localStorage 
              but is never permanently saved on our servers. Containers are destroyed immediately 
              after execution.
            </p>
          </section>

          {/* Example Code */}
          <section className="guide-section">
            <h3><Info size={20} /> Example Code</h3>
            <a href="https://ballerina.io/learn/by-example/" target="_blank" rel="noopener noreferrer">
                  Ballerina By Example
            </a>
            <div className="code-example">
              <pre><code>{`import ballerina/io;

public function main() {
    // Simple Hello World
    io:println("Hello, Ballerina!");
    
    // Variables and types
    int age = 25;
    string name = "Developer";
    
    // String interpolation
    io:println(\`\${name} is \${age} years old\`);
    
    // Arrays and iteration
    int[] numbers = [1, 2, 3, 4, 5];
    foreach int num in numbers {
        io:println(num * 2);
    }
    
    // Records
    type Person record {
        string name;
        int age;
    };
    
    Person person = {
        name: "Alice",
        age: 30
    };
    io:println(person);
}`}</code></pre>
            </div>
          </section>

          {/* Help & Resources */}
          <section className="guide-section">
            <h3><Info size={20} /> Additional Resources</h3>
            <ul>
              <li>
                <a href="https://ballerina.io/learn/by-example/" target="_blank" rel="noopener noreferrer">
                  Ballerina By Example
                </a>
              </li>
              <li>
                <a href="https://ballerina.io/learn/" target="_blank" rel="noopener noreferrer">
                  Official Ballerina Documentation
                </a>
              </li>
              <li>
                <a href="https://ballerina.io/learn/by-example/" target="_blank" rel="noopener noreferrer">
                  Ballerina by Example
                </a>
              </li>
              <li>
                <a href="https://central.ballerina.io/" target="_blank" rel="noopener noreferrer">
                  Ballerina packages
                </a>
              </li>
              <li>
                <a href="https://learn-ballerina.github.io/" target="_blank" rel="noopener noreferrer">
                  Best Practices
                </a>
              </li>
              <li>
                <a href="https://pramithamj.github.io/ballerina-lint/" target="_blank" rel="noopener noreferrer">
                  Ballerina Lint
                </a>
              </li>
              <li>
                <a href="https://github.com/PramithaMJ/ballerina-online-playground" target="_blank" rel="noopener noreferrer">
                  Playground GitHub Repository
                </a>
              </li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="user-guide-footer">
          {isFirstVisit && (
            <p className="first-visit-note">
              💡 You can access this guide anytime by clicking the 📖 icon in the header
            </p>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            {isFirstVisit ? "Let's Get Started!" : "Got it, Let's Code!"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
