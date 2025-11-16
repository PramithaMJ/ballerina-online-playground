package utils

import (
	"testing"
)

func TestResourceExhaustionWithoutUnderscores(t *testing.T) {
	attackCode := `import ballerina/io;
import ballerina/lang.runtime as runtime;

public function main() {
    // Use plain numbers without underscores
    int maxIterations = 10000000; 
    // 10 million
    int count = 0;

    while count < maxIterations {
        count = count + 1; 
        // use '+' instead of shorthand operators

        if count % 1000000 == 0 { 
        // every 1 million
            io:println("Reached iteration: ", count);
            runtime:sleep(1); 
            // yield to allow strand cancellation
        }
    }

    io:println("Finished safe stress loop");
}`

	err := ValidateCode(attackCode)

	if err == nil {
		t.Fatal("Expected code to be blocked, but validation passed")
	}

	validationErr, ok := err.(*ValidationError)
	if !ok {
		t.Fatalf("Expected ValidationError, got %T", err)
	}

	t.Logf("Attack blocked with error: %s", validationErr.Reason)

	// Should block either due to runtime import OR large numeric literal
	hasRuntimeBlock := contains(validationErr.Reason, "Runtime operations")
	hasNumericBlock := contains(validationErr.Reason, "Large numeric literal") ||
		contains(validationErr.Reason, "10000000") ||
		contains(validationErr.Reason, "1000000")

	if !hasRuntimeBlock && !hasNumericBlock {
		t.Errorf("Expected block for runtime or large numeric, got: %s", validationErr.Reason)
	}
}

func TestVariousResourceExhaustionPatterns(t *testing.T) {
	tests := []struct {
		name        string
		code        string
		shouldBlock bool
		reason      string
	}{
		{
			name: "Plain 10 million in maxIterations",
			code: `int maxIterations = 10000000;
while count < maxIterations {
    count = count + 1;
}`,
			shouldBlock: true,
			reason:      "Large numeric in loop context",
		},
		{
			name: "Plain 5 million in comparison",
			code: `while count < 5000000 {
    count = count + 1;
}`,
			shouldBlock: true,
			reason:      "Large numeric in comparison",
		},
		{
			name: "Plain 1 million modulo check",
			code: `if count % 1000000 == 0 {
    io:println("milestone");
}`,
			shouldBlock: true,
			reason:      "Large numeric in comparison",
		},
		{
			name:        "Suspicious variable name with large number",
			code:        `int stressTest = 8000000;`,
			shouldBlock: true,
			reason:      "Suspicious variable name",
		},
		{
			name: "Safe small iteration",
			code: `int maxCount = 100;
while count < maxCount {
    count = count + 1;
}`,
			shouldBlock: false,
			reason:      "",
		},
		{
			name: "Large number not in loop context",
			code: `int timestamp = 1699999999;
io:println("Timestamp: ", timestamp);`,
			shouldBlock: false,
			reason:      "",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCode(tt.code)

			if tt.shouldBlock {
				if err == nil {
					t.Errorf("Expected code to be blocked (%s), but validation passed", tt.reason)
					return
				}
				t.Logf("✓ Blocked: %s", err.(*ValidationError).Reason)
			} else {
				if err != nil {
					t.Errorf("Expected code to pass, but got error: %v", err)
				}
			}
		})
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 || findSubstring(s, substr))
}

func findSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
