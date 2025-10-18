/**
 * Debug Service
 * Manages debugging sessions with WebSocket communication
 */

import { envConfig } from '../config/env.config';

const DEBUG_MODE = import.meta.env.DEV;

class DebugService {
  constructor() {
    this.debugSession = null;
    this.socket = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
  }

  /**
   * Debug logging
   */
  debug(...args) {
    if (DEBUG_MODE) {
      console.log('[DebugService]', ...args);
    }
  }

  /**
   * Start a new debugging session
   * @param {string} code - The Ballerina code to debug
   * @param {string} version - The Ballerina version
   * @returns {Promise<string>} Session ID
   */
  async startDebugging(code, version = '2201.12.0') {
    try {
      this.debug('🐛 Starting debug session...');
      
      const response = await fetch(`${envConfig.apiUrl}/debug/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, version }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start debugging');
      }

      const { sessionId, error } = await response.json();
      
      if (error) {
        throw new Error(error);
      }

      this.debugSession = sessionId;
      this.debug('✅ Debug session created:', sessionId);
      
      // Connect WebSocket
      await this.connectWebSocket(sessionId);
      
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to start debugging:', error);
      throw error;
    }
  }

  /**
   * Connect to debug WebSocket
   * @param {string} sessionId - The debug session ID
   */
  async connectWebSocket(sessionId) {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = envConfig.apiUrl.replace('http', 'ws');
        const socketUrl = `${wsUrl}/debug/ws/${sessionId}`;
        
        this.debug('🔌 Connecting to WebSocket:', socketUrl);
        
        this.socket = new WebSocket(socketUrl);

        this.socket.onopen = () => {
          this.debug('✅ WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.notifyListeners('connected', { sessionId });
          resolve();
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.debug('📨 Received message:', message);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.socket.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.notifyListeners('error', { error: 'WebSocket connection error' });
          reject(error);
        };

        this.socket.onclose = (event) => {
          this.debug('🔌 WebSocket closed:', event.code, event.reason);
          this.isConnected = false;
          this.notifyListeners('disconnected', { 
            code: event.code, 
            reason: event.reason 
          });
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect(sessionId);
          }
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect WebSocket
   */
  async attemptReconnect(sessionId) {
    this.reconnectAttempts++;
    this.debug(`🔄 Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(async () => {
      try {
        await this.connectWebSocket(sessionId);
      } catch (error) {
        console.error('Reconnection failed:', error);
      }
    }, 2000 * this.reconnectAttempts);
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(message) {
    const { type, data, error } = message;
    
    if (error) {
      this.notifyListeners('error', { error });
      return;
    }

    switch (type) {
      case 'connected':
        this.notifyListeners('connected', data);
        break;
      case 'started':
        this.notifyListeners('started', data);
        break;
      case 'stopped':
        this.notifyListeners('stopped', data);
        break;
      case 'breakpointSet':
        this.notifyListeners('breakpointSet', data);
        break;
      case 'breakpointRemoved':
        this.notifyListeners('breakpointRemoved', data);
        break;
      case 'continued':
        this.notifyListeners('continued', data);
        break;
      case 'stepped':
        this.notifyListeners('stepped', data);
        break;
      case 'variables':
        this.notifyListeners('variables', data);
        break;
      case 'callStack':
        this.notifyListeners('callStack', data);
        break;
      case 'completed':
        this.notifyListeners('completed', data);
        break;
      case 'disconnected':
        this.notifyListeners('disconnected', data);
        break;
      default:
        this.debug('⚠️ Unknown message type:', type);
    }
  }

  /**
   * Send a command to the debug server
   */
  sendCommand(command, data = {}) {
    if (!this.socket || !this.isConnected) {
      console.warn('⚠️ WebSocket not connected');
      return;
    }

    const message = {
      command,
      ...data,
    };

    this.debug('📤 Sending command:', message);
    this.socket.send(JSON.stringify(message));
  }

  /**
   * Set a breakpoint at a line
   */
  setBreakpoint(line) {
    this.sendCommand('setBreakpoint', { line });
  }

  /**
   * Remove a breakpoint at a line
   */
  removeBreakpoint(line) {
    this.sendCommand('removeBreakpoint', { line });
  }

  /**
   * Start debugging execution
   */
  start() {
    this.sendCommand('start');
  }

  /**
   * Continue execution
   */
  continue() {
    this.sendCommand('continue');
  }

  /**
   * Step over
   */
  stepOver() {
    this.sendCommand('stepOver');
  }

  /**
   * Step into
   */
  stepInto() {
    this.sendCommand('stepInto');
  }

  /**
   * Step out
   */
  stepOut() {
    this.sendCommand('stepOut');
  }

  /**
   * Stop debugging
   */
  stop() {
    this.sendCommand('stop');
  }

  /**
   * Disconnect from debug session
   */
  disconnect() {
    this.sendCommand('disconnect');
    
    if (this.socket) {
      this.socket.close(1000, 'Client disconnected');
      this.socket = null;
    }
    
    this.debugSession = null;
    this.isConnected = false;
    this.listeners.clear();
  }

  /**
   * Add an event listener
   */
  addListener(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType).push(callback);
    this.debug(`📝 Listener added for '${eventType}'`);
  }

  /**
   * Remove an event listener
   */
  removeListener(eventType, callback) {
    if (this.listeners.has(eventType)) {
      const filtered = this.listeners.get(eventType).filter(cb => cb !== callback);
      this.listeners.set(eventType, filtered);
      this.debug(`🗑️ Listener removed for '${eventType}'`);
    }
  }

  /**
   * Notify all listeners for an event
   */
  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for '${eventType}':`, error);
        }
      });
    }
  }

  /**
   * Check if debugging session is active
   */
  isDebugging() {
    return this.debugSession !== null && this.isConnected;
  }

  /**
   * Get current session ID
   */
  getSessionId() {
    return this.debugSession;
  }
}

// Singleton instance
export const debugService = new DebugService();

export default debugService;
