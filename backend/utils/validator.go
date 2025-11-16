package utils

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	// Security limits
	MaxCodeSize      = 50 * 1024 // 50KB
	MaxLineCount     = 1000
	MaxLoopCount     = 10
	MaxFunctionCount = 20
)

// ValidationError represents a code validation error
type ValidationError struct {
	Message string
	Reason  string
}

func (e *ValidationError) Error() string {
	return fmt.Sprintf("%s: %s", e.Message, e.Reason)
}

// ValidateCode performs comprehensive security validation on user code
func ValidateCode(code string) error {
	// 1. Check code size
	if len(code) > MaxCodeSize {
		return &ValidationError{
			Message: "Code size exceeds maximum allowed",
			Reason:  fmt.Sprintf("Maximum size is %d bytes, got %d bytes", MaxCodeSize, len(code)),
		}
	}

	// 2. Check line count
	lines := strings.Split(code, "\n")
	if len(lines) > MaxLineCount {
		return &ValidationError{
			Message: "Too many lines",
			Reason:  fmt.Sprintf("Maximum %d lines allowed, got %d lines", MaxLineCount, len(lines)),
		}
	}

	// 3. Check for forbidden imports and patterns
	if err := checkForbiddenPatterns(code); err != nil {
		return err
	}

	// 4. Check for excessive complexity
	if err := checkComplexity(code); err != nil {
		return err
	}

	return nil
}

// checkForbiddenPatterns checks for dangerous imports and operations
func checkForbiddenPatterns(code string) error {
	// Forbidden imports that allow network, file, or system operations
	forbiddenImports := []struct {
		pattern string
		reason  string
	}{
		{"import\\s+ballerina/file", "File system operations are not allowed"},
		{"import\\s+ballerina/http", "HTTP operations are not allowed"},
		{"import\\s+ballerina/tcp", "TCP operations are not allowed"},
		{"import\\s+ballerina/udp", "UDP operations are not allowed"},
		{"import\\s+ballerina/websocket", "WebSocket operations are not allowed"},
		{"import\\s+ballerina/grpc", "gRPC operations are not allowed"},
		{"import\\s+ballerina/graphql", "GraphQL operations are not allowed"},
		{"import\\s+ballerina/sql", "Database operations are not allowed"},
		{"import\\s+ballerina/mysql", "Database operations are not allowed"},
		{"import\\s+ballerina/postgresql", "Database operations are not allowed"},
		{"import\\s+ballerina/java", "Java interop is not allowed"},
		{"import\\s+ballerina/jballerina.java", "Java interop is not allowed"},
		{"import\\s+ballerina/email", "Email operations are not allowed"},
		{"import\\s+ballerina/ftp", "FTP operations are not allowed"},
		{"import\\s+ballerina/kafka", "Kafka operations are not allowed"},
		{"import\\s+ballerina/rabbitmq", "RabbitMQ operations are not allowed"},
		{"import\\s+ballerina/nats", "NATS operations are not allowed"},
		{"import\\s+ballerina/task", "Task scheduling is not allowed"},
		{"import\\s+ballerina/xmldata", "XML data operations are restricted"},
		{"import\\s+ballerina/jsondata", "JSON data operations are restricted"},
		{"import\\s+ballerina/csv", "CSV operations are restricted"},
		{"import\\s+ballerina/url", "URL operations are not allowed"},
		{"import\\s+ballerina/mime", "MIME operations are not allowed"},
		{"import\\s+ballerina/auth", "Auth operations are not allowed"},
		{"import\\s+ballerina/jwt", "JWT operations are not allowed"},
		{"import\\s+ballerina/oauth2", "OAuth2 operations are not allowed"},
		{"import\\s+ballerina/ldap", "LDAP operations are not allowed"},
		{"import\\s+ballerina/crypto", "Cryptographic operations are restricted"},
		{"import\\s+ballerina/cache", "Cache operations are not allowed"},
		{"import\\s+ballerina/log", "Logging operations are restricted"},
		{"import\\s+ballerina/os", "OS operations are not allowed"},
		{"import\\s+ballerina/system", "System operations are not allowed"},
		{"import\\s+ballerina/runtime", "Runtime operations are not allowed"},
		{"import\\s+ballerina/lang\\.runtime", "Runtime operations are not allowed (can cause DoS)"},
		{"import\\s+ballerina/reflect", "Reflection is not allowed"},
		{"import\\s+ballerina/regex", "Regex operations are not allowed (can cause DoS)"},
		{"import\\s+ballerina/lang\\.thread", "Thread operations are not allowed"},
		{"import\\s+ballerina/time", "Time/sleep operations are restricted"},
	}

	for _, forbidden := range forbiddenImports {
		matched, _ := regexp.MatchString(forbidden.pattern, code)
		if matched {
			return &ValidationError{
				Message: "Forbidden import detected",
				Reason:  forbidden.reason,
			}
		}
	}

	// Forbidden annotations
	forbiddenAnnotations := []struct {
		pattern string
		reason  string
	}{
		{"@docker:", "Docker annotations are not allowed"},
		{"@kubernetes:", "Kubernetes annotations are not allowed"},
		{"@cloud:", "Cloud annotations are not allowed"},
		{"@aws:", "AWS annotations are not allowed"},
		{"@azure:", "Azure annotations are not allowed"},
		{"@gcp:", "GCP annotations are not allowed"},
	}

	for _, forbidden := range forbiddenAnnotations {
		if strings.Contains(code, forbidden.pattern) {
			return &ValidationError{
				Message: "Forbidden annotation detected",
				Reason:  forbidden.reason,
			}
		}
	}

	// Check for Java interop keywords
	javaPatterns := []string{
		"java:",
		"@java:",
		"javacast",
	}

	for _, pattern := range javaPatterns {
		if strings.Contains(code, pattern) {
			return &ValidationError{
				Message: "Java interop detected",
				Reason:  "Java interoperability is not allowed for security reasons",
			}
		}
	}

	return nil
}

// checkComplexity checks for code complexity that might indicate malicious intent
func checkComplexity(code string) error {
	// Count loops (while, foreach, loop)
	whileCount := strings.Count(code, "while")
	foreachCount := strings.Count(code, "foreach")
	loopCount := whileCount + foreachCount

	if loopCount > MaxLoopCount {
		return &ValidationError{
			Message: "Too many loops detected",
			Reason:  fmt.Sprintf("Maximum %d loops allowed, found %d loops", MaxLoopCount, loopCount),
		}
	}

	// Count functions (potential for recursive bombs)
	functionPattern := regexp.MustCompile(`(?m)^\s*(?:public\s+)?function\s+\w+`)
	functionMatches := functionPattern.FindAllString(code, -1)
	if len(functionMatches) > MaxFunctionCount {
		return &ValidationError{
			Message: "Too many functions detected",
			Reason:  fmt.Sprintf("Maximum %d functions allowed, found %d functions", MaxFunctionCount, len(functionMatches)),
		}
	}

	// Check for large numeric literals that could indicate resource exhaustion
	if err := checkLargeNumericLiterals(code); err != nil {
		return err
	}

	// Check for suspicious patterns that might cause infinite loops or resource exhaustion
	suspiciousPatterns := []struct {
		pattern string
		reason  string
	}{
		// Basic infinite loops
		{`while\s*\(\s*true\s*\)`, "Infinite loop detected: while(true) is not allowed"},
		{`while\s*true\s*\{`, "Infinite loop detected: while true is not allowed"},
		{`while\s*\(\s*1\s*==\s*1\s*\)`, "Infinite loop detected: while(1==1) is not allowed"},
		{`while\s*\(\s*1\s*\)`, "Infinite loop detected: while(1) is not allowed"},

		// Loop keyword (Ballerina's forever loop)
		{`loop\s*\{`, "Infinite loop detected: loop keyword is not allowed"},

		// For loops with no condition or always-true condition
		{`for\s*\(\s*;\s*;\s*\)`, "Infinite loop detected: for(;;) is not allowed"},
		{`for\s*\(\s*;true;`, "Infinite loop detected: for with always-true condition is not allowed"},

		// Resource exhaustion: Variables with suspicious names (removed broad numeric pattern)
		{`(maxIterations|max_iterations|iterations|loop_count|huge|massive|enormous)\s*=\s*[0-9]{5,}`, "Suspicious high iteration variable detected"},

		// Sleep/delay operations (even if import blocked, check for usage)
		{`runtime:sleep\s*\(`, "Sleep operation is not allowed"},
		{`thread:sleep\s*\(`, "Sleep operation is not allowed"},
		{`time:sleep\s*\(`, "Sleep operation is not allowed"},
		{`sleep\s*\(`, "Sleep/delay operation is not allowed"},

		// Excessive iterations
		{`foreach.*in\s+1\\.\\.\\.[\\.]{6,}`, "Excessive iteration range detected (over 100k iterations)"},
		{`foreach.*in\s+0\\.\\.\\.[\\.]{6,}`, "Excessive iteration range detected (over 100k iterations)"},
		{`\\.\\.<\s*[\\d]{6,}`, "Excessive range detected (over 100k elements)"},

		// Large array/map allocations
		{`\\[\\s*[0-9]{5,}\\s*\\]`, "Large array size detected (potential memory exhaustion)"},
		{`int\\[\\]\\s+\\w+\\s*=\\s*\\[.*[0-9]{4,}`, "Large array initialization detected"},

		// Potential recursion bombs - recursive function calls
		{`function\s+(\w+)[^}]*\1\s*\(`, "Potential recursion detected - direct recursive call"},

		// Suspicious large string repetitions (can cause memory DoS)
		{`["\'](.)\1{10000,}["\']`, "Suspicious large string repetition detected"},

		// Regex DoS patterns - catastrophic backtracking
		{"re\\s+`[^`]*\\([^)]*\\+[^)]*\\)\\+", "Potentially dangerous regex with nested quantifiers detected"},
		{"re\\s+`[^`]*\\([^)]*\\*[^)]*\\)\\+", "Potentially dangerous regex with nested quantifiers detected"},
		{"re\\s+`[^`]*\\([^)]*\\+[^)]*\\)\\*", "Potentially dangerous regex with nested quantifiers detected"},

		// Ballerina regex patterns (re `pattern`)
		{"re\\s+`.*\\(.*\\)\\{[0-9]{3,},", "Regex with large repetition count detected"},
	}

	for _, suspicious := range suspiciousPatterns {
		matched, _ := regexp.MatchString(suspicious.pattern, code)
		if matched {
			return &ValidationError{
				Message: "Suspicious pattern detected",
				Reason:  suspicious.reason,
			}
		}
	}

	return nil
}

// checkLargeNumericLiterals detects numeric literals that could cause resource exhaustion
func checkLargeNumericLiterals(code string) error {
	// Pattern to match numeric literals (including those with underscores like 10_000_000)
	// Matches: 10000000, 10_000_000, 1000000, etc.
	numericPattern := regexp.MustCompile(`\b(\d[\d_]*)\b`)
	matches := numericPattern.FindAllString(code, -1)

	for _, match := range matches {
		// Remove underscores to get actual number
		numStr := strings.ReplaceAll(match, "_", "")

		// Check if it's a large number (more than 100,000)
		// Exception: numbers that look like timestamps (10 digits) are allowed
		if len(numStr) >= 6 && len(numStr) <= 9 {
			// Check if this number is used in any context that could cause issues

			// 1. Check for comparison operators near the number (loop conditions)
			comparisonPattern := regexp.MustCompile(`(while|for|foreach)[^{;]*[<>=!]+\s*` + regexp.QuoteMeta(match) + `|` +
				regexp.QuoteMeta(match) + `\s*[<>=!]+`)
			if comparisonPattern.MatchString(code) {
				return &ValidationError{
					Message: "Resource exhaustion pattern detected",
					Reason:  fmt.Sprintf("Large numeric literal (%s) used in loop condition - potential DoS attack", match),
				}
			}

			// 2. Check for assignment patterns with suspicious variable names
			assignmentPattern := regexp.MustCompile(`(?i)(max|count|iteration|limit|size|huge|massive|enormous|stress|loop)\w*\s*=\s*` + regexp.QuoteMeta(match))
			if assignmentPattern.MatchString(code) {
				return &ValidationError{
					Message: "Resource exhaustion pattern detected",
					Reason:  fmt.Sprintf("Large numeric literal (%s) assigned to loop-related variable - potential DoS attack", match),
				}
			}

			// 3. Check if number appears in same line as 'while', 'for', or 'foreach'
			lines := strings.Split(code, "\n")
			for _, line := range lines {
				lineLower := strings.ToLower(line)
				if strings.Contains(line, match) {
					if strings.Contains(lineLower, "while") ||
						strings.Contains(lineLower, "foreach") ||
						strings.Contains(lineLower, "for") {
						// Not a comment line
						if !strings.Contains(lineLower, "//") ||
							strings.Index(lineLower, "//") > strings.Index(line, match) {
							return &ValidationError{
								Message: "Resource exhaustion pattern detected",
								Reason:  fmt.Sprintf("Large numeric literal (%s) detected in loop statement - potential DoS attack", match),
							}
						}
					}
				}
			}
		}
	}

	return nil
} // SanitizeErrorOutput removes sensitive information from error messages
func SanitizeErrorOutput(output string) string {
	// Remove file system paths
	pathPattern := regexp.MustCompile(`(/[a-zA-Z0-9_\-./]+|[A-Z]:\\[a-zA-Z0-9_\-\\./]+)`)
	sanitized := pathPattern.ReplaceAllString(output, "[PATH]")

	// Remove IP addresses
	ipPattern := regexp.MustCompile(`\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b`)
	sanitized = ipPattern.ReplaceAllString(sanitized, "[IP]")

	// Remove potential usernames
	userPattern := regexp.MustCompile(`/home/[a-zA-Z0-9_-]+|/Users/[a-zA-Z0-9_-]+`)
	sanitized = userPattern.ReplaceAllString(sanitized, "/home/[USER]")

	return sanitized
}
