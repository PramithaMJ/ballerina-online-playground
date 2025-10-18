package handler

import (
	"ballerina-compiler/ballerina-compiler-backend/utils"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// WebSocket upgrader configuration
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// Allow connections from any origin (same as CORS middleware)
		return true
	},
}

// DebugSession represents an active debugging session
type DebugSession struct {
	ID           string
	ContainerID  string
	Code         string
	Version      string
	PackageDir   string
	Connection   *websocket.Conn
	Breakpoints  map[int]bool // line number -> enabled
	CurrentLine  int
	Variables    []Variable
	CallStack    []StackFrame
	IsRunning    bool
	IsPaused     bool
	StepMode     string // "continue", "stepOver", "stepInto", "stepOut"
	CreatedAt    time.Time
	LastActiveAt time.Time
	Context      context.Context
	CancelFunc   context.CancelFunc
	mutex        sync.RWMutex
	messageChan  chan DebugMessage
	stopChan     chan bool
}

// Variable represents a variable in the debug session
type Variable struct {
	Name  string `json:"name"`
	Value string `json:"value"`
	Type  string `json:"type"`
}

// StackFrame represents a call stack frame
type StackFrame struct {
	Name string `json:"name"`
	Line int    `json:"line"`
	File string `json:"file"`
}

// DebugMessage represents a message in the debug protocol
type DebugMessage struct {
	Type    string                 `json:"type"`
	Command string                 `json:"command,omitempty"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Line    int                    `json:"line,omitempty"`
	Error   string                 `json:"error,omitempty"`
}

// StartDebugRequest represents the request to start debugging
type StartDebugRequest struct {
	Code    string `json:"code"`
	Version string `json:"version"`
}

// StartDebugResponse represents the response when starting debug session
type StartDebugResponse struct {
	SessionID string `json:"sessionId"`
	Error     string `json:"error,omitempty"`
}

// Global debug session manager
var (
	debugSessions        = make(map[string]*DebugSession)
	debugSessionsMutex   sync.RWMutex
	sessionCleanupTicker *time.Ticker
)

// Initialize debug session cleanup routine
func init() {
	// Clean up old sessions every 5 minutes
	sessionCleanupTicker = time.NewTicker(5 * time.Minute)
	go func() {
		for range sessionCleanupTicker.C {
			cleanupOldSessions()
		}
	}()
}

// cleanupOldSessions removes sessions that haven't been active for 10 minutes
func cleanupOldSessions() {
	debugSessionsMutex.Lock()
	defer debugSessionsMutex.Unlock()

	now := time.Now()
	for id, session := range debugSessions {
		if now.Sub(session.LastActiveAt) > 10*time.Minute {
			log.Printf("Cleaning up inactive debug session: %s", id)
			session.cleanup()
			delete(debugSessions, id)
		}
	}
}

// cleanup releases all resources associated with the debug session
func (ds *DebugSession) cleanup() {
	ds.mutex.Lock()
	defer ds.mutex.Unlock()

	// Close WebSocket connection
	if ds.Connection != nil {
		ds.Connection.Close()
	}

	// Cancel context to stop any running operations
	if ds.CancelFunc != nil {
		ds.CancelFunc()
	}

	// Close channels
	close(ds.stopChan)
	close(ds.messageChan)

	// Clean up temporary package directory
	if ds.PackageDir != "" {
		os.RemoveAll(ds.PackageDir)
	}

	log.Printf("Debug session %s cleaned up", ds.ID)
}

// StartDebugHandler initiates a new debug session
func StartDebugHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var req StartDebugRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate code
	if err := utils.ValidateCode(req.Code); err != nil {
		response := StartDebugResponse{
			Error: "Security validation failed: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Set default version if not provided
	ballerinaVersion := req.Version
	if ballerinaVersion == "" {
		ballerinaVersion = "2201.12.0"
	}

	// Validate version
	if !utils.IsValidBallerinaVersion(ballerinaVersion) {
		response := StartDebugResponse{
			Error: "Invalid Ballerina version",
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Create Ballerina package
	packageDir, err := utils.CreateBallerinaPackage(req.Code)
	if err != nil {
		response := StartDebugResponse{
			Error: "Failed to create package: " + err.Error(),
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(response)
		return
	}

	// Generate unique session ID
	sessionID := generateSessionID()

	// Create debug session with context
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)

	session := &DebugSession{
		ID:           sessionID,
		Code:         req.Code,
		Version:      ballerinaVersion,
		PackageDir:   packageDir,
		Breakpoints:  make(map[int]bool),
		Variables:    []Variable{},
		CallStack:    []StackFrame{},
		IsRunning:    false,
		IsPaused:     false,
		CreatedAt:    time.Now(),
		LastActiveAt: time.Now(),
		Context:      ctx,
		CancelFunc:   cancel,
		messageChan:  make(chan DebugMessage, 100),
		stopChan:     make(chan bool, 1),
	}

	// Store session
	debugSessionsMutex.Lock()
	debugSessions[sessionID] = session
	debugSessionsMutex.Unlock()

	log.Printf("Created debug session: %s", sessionID)

	// Send response
	response := StartDebugResponse{
		SessionID: sessionID,
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// DebugWebSocketHandler handles WebSocket connections for debug sessions
func DebugWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	// Extract session ID from URL path
	sessionID := r.URL.Path[len("/debug/ws/"):]

	// Get debug session
	debugSessionsMutex.RLock()
	session, exists := debugSessions[sessionID]
	debugSessionsMutex.RUnlock()

	if !exists {
		http.Error(w, "Debug session not found", http.StatusNotFound)
		return
	}

	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Failed to upgrade to WebSocket: %v", err)
		return
	}

	session.mutex.Lock()
	session.Connection = conn
	session.LastActiveAt = time.Now()
	session.mutex.Unlock()

	log.Printf("WebSocket connected for session: %s", sessionID)

	// Start message handlers
	go session.handleIncomingMessages()
	go session.handleOutgoingMessages()

	// Send initial connected message
	session.sendMessage(DebugMessage{
		Type: "connected",
		Data: map[string]interface{}{
			"sessionId": sessionID,
			"message":   "Debug session connected",
		},
	})
}

// handleIncomingMessages processes messages from the WebSocket client
func (ds *DebugSession) handleIncomingMessages() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in handleIncomingMessages: %v", r)
		}
	}()

	for {
		var msg DebugMessage
		err := ds.Connection.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error for session %s: %v", ds.ID, err)
			}
			return
		}

		ds.mutex.Lock()
		ds.LastActiveAt = time.Now()
		ds.mutex.Unlock()

		// Process command
		ds.processCommand(msg)
	}
}

// handleOutgoingMessages sends messages to the WebSocket client
func (ds *DebugSession) handleOutgoingMessages() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("Recovered from panic in handleOutgoingMessages: %v", r)
		}
	}()

	for {
		select {
		case msg := <-ds.messageChan:
			err := ds.Connection.WriteJSON(msg)
			if err != nil {
				log.Printf("Failed to send message to session %s: %v", ds.ID, err)
				return
			}
		case <-ds.stopChan:
			return
		}
	}
}

// processCommand handles debug commands from the client
func (ds *DebugSession) processCommand(msg DebugMessage) {
	log.Printf("Processing command: %s for session %s", msg.Command, ds.ID)

	switch msg.Command {
	case "setBreakpoint":
		ds.setBreakpoint(msg.Line)
	case "removeBreakpoint":
		ds.removeBreakpoint(msg.Line)
	case "continue":
		ds.continueExecution()
	case "stepOver":
		ds.stepOver()
	case "stepInto":
		ds.stepInto()
	case "stepOut":
		ds.stepOut()
	case "start":
		ds.startDebugging()
	case "stop":
		ds.stopDebugging()
	case "disconnect":
		ds.disconnect()
	default:
		ds.sendMessage(DebugMessage{
			Type:  "error",
			Error: fmt.Sprintf("Unknown command: %s", msg.Command),
		})
	}
}

// setBreakpoint adds a breakpoint at the specified line
func (ds *DebugSession) setBreakpoint(line int) {
	ds.mutex.Lock()
	ds.Breakpoints[line] = true
	ds.mutex.Unlock()

	log.Printf("Set breakpoint at line %d in session %s", line, ds.ID)

	ds.sendMessage(DebugMessage{
		Type: "breakpointSet",
		Data: map[string]interface{}{
			"line": line,
		},
	})
}

// removeBreakpoint removes a breakpoint at the specified line
func (ds *DebugSession) removeBreakpoint(line int) {
	ds.mutex.Lock()
	delete(ds.Breakpoints, line)
	ds.mutex.Unlock()

	log.Printf("Removed breakpoint at line %d in session %s", line, ds.ID)

	ds.sendMessage(DebugMessage{
		Type: "breakpointRemoved",
		Data: map[string]interface{}{
			"line": line,
		},
	})
}

// startDebugging starts the debugging session
func (ds *DebugSession) startDebugging() {
	ds.mutex.Lock()
	if ds.IsRunning {
		ds.mutex.Unlock()
		return
	}
	ds.IsRunning = true
	ds.IsPaused = len(ds.Breakpoints) > 0 // Pause at first breakpoint if any exist
	ds.mutex.Unlock()

	log.Printf("Starting debug session %s", ds.ID)

	// Simulate debugging by running the code
	go func() {
		// In a real implementation, this would:
		// 1. Start Ballerina runtime with debug flags
		// 2. Connect to Ballerina debug adapter protocol
		// 3. Control execution through DAP

		// For this implementation, we'll simulate the debugging process
		ds.sendMessage(DebugMessage{
			Type: "started",
			Data: map[string]interface{}{
				"message": "Debugging started",
			},
		})

		// Simulate execution with breakpoints
		ds.simulateExecution()
	}()
}

// simulateExecution simulates code execution with breakpoint support
func (ds *DebugSession) simulateExecution() {
	codeLines := strings.Split(ds.Code, "\n")

	for lineNum := 1; lineNum <= len(codeLines); lineNum++ {
		// Check if stopped
		ds.mutex.RLock()
		if !ds.IsRunning {
			ds.mutex.RUnlock()
			return
		}
		ds.mutex.RUnlock()

		// Check for breakpoint
		ds.mutex.RLock()
		hasBreakpoint := ds.Breakpoints[lineNum]
		ds.mutex.RUnlock()

		if hasBreakpoint {
			ds.mutex.Lock()
			ds.IsPaused = true
			ds.CurrentLine = lineNum
			ds.mutex.Unlock()

			// Send paused event
			ds.sendMessage(DebugMessage{
				Type: "stopped",
				Data: map[string]interface{}{
					"reason": "breakpoint",
					"line":   lineNum,
				},
			})

			// Wait for continue command
			for {
				ds.mutex.RLock()
				isPaused := ds.IsPaused
				isRunning := ds.IsRunning
				ds.mutex.RUnlock()

				if !isPaused || !isRunning {
					break
				}
				time.Sleep(100 * time.Millisecond)
			}
		}

		// Simulate line execution
		time.Sleep(50 * time.Millisecond)
	}

	// Execution completed
	ds.mutex.Lock()
	ds.IsRunning = false
	ds.IsPaused = false
	ds.mutex.Unlock()

	ds.sendMessage(DebugMessage{
		Type: "completed",
		Data: map[string]interface{}{
			"message": "Execution completed",
		},
	})
}

// continueExecution continues execution after a breakpoint
func (ds *DebugSession) continueExecution() {
	ds.mutex.Lock()
	ds.IsPaused = false
	ds.mutex.Unlock()

	log.Printf("Continuing execution in session %s", ds.ID)

	ds.sendMessage(DebugMessage{
		Type: "continued",
		Data: map[string]interface{}{
			"message": "Execution continued",
		},
	})
}

// stepOver executes the next line without entering functions
func (ds *DebugSession) stepOver() {
	log.Printf("Step over in session %s", ds.ID)
	// Implementation would control step over in debug adapter
	ds.sendMessage(DebugMessage{
		Type: "stepped",
		Data: map[string]interface{}{
			"mode": "over",
		},
	})
}

// stepInto steps into function calls
func (ds *DebugSession) stepInto() {
	log.Printf("Step into in session %s", ds.ID)
	// Implementation would control step into in debug adapter
	ds.sendMessage(DebugMessage{
		Type: "stepped",
		Data: map[string]interface{}{
			"mode": "into",
		},
	})
}

// stepOut steps out of the current function
func (ds *DebugSession) stepOut() {
	log.Printf("Step out in session %s", ds.ID)
	// Implementation would control step out in debug adapter
	ds.sendMessage(DebugMessage{
		Type: "stepped",
		Data: map[string]interface{}{
			"mode": "out",
		},
	})
}

// stopDebugging stops the debugging session
func (ds *DebugSession) stopDebugging() {
	ds.mutex.Lock()
	ds.IsRunning = false
	ds.IsPaused = false
	ds.mutex.Unlock()

	log.Printf("Stopping debug session %s", ds.ID)

	ds.sendMessage(DebugMessage{
		Type: "stopped",
		Data: map[string]interface{}{
			"reason": "user_request",
		},
	})
}

// disconnect closes the debug session
func (ds *DebugSession) disconnect() {
	log.Printf("Disconnecting session %s", ds.ID)

	ds.sendMessage(DebugMessage{
		Type: "disconnected",
		Data: map[string]interface{}{
			"message": "Session disconnected",
		},
	})

	// Clean up session
	debugSessionsMutex.Lock()
	delete(debugSessions, ds.ID)
	debugSessionsMutex.Unlock()

	ds.cleanup()
}

// sendMessage queues a message to be sent to the client
func (ds *DebugSession) sendMessage(msg DebugMessage) {
	select {
	case ds.messageChan <- msg:
		// Message queued successfully
	default:
		log.Printf("Warning: Message channel full for session %s", ds.ID)
	}
}

// generateSessionID generates a unique session ID
func generateSessionID() string {
	return fmt.Sprintf("debug-%d", time.Now().UnixNano())
}
