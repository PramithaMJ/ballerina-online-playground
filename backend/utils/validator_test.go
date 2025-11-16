package utils

import (
	"testing"
)

func TestValidateInfiniteLoops(t *testing.T) {
	tests := []struct {
		name    string
		code    string
		wantErr bool
		errMsg  string
	}{
		{
			name: "while true infinite loop",
			code: `import ballerina/io;

public function main() {
    int[] items = [1, 2, 3];
    while true {
        foreach int x in items {
            io:println("item = ", x);
        }
    }
}`,
			wantErr: true,
			errMsg:  "Infinite loop detected: while true is not allowed",
		},
		{
			name: "while(true) infinite loop",
			code: `while (true) {
    io:println("loop");
}`,
			wantErr: true,
			errMsg:  "Infinite loop detected: while(true) is not allowed",
		},
		{
			name: "valid code with regular loop",
			code: `import ballerina/io;

public function main() {
    int[] items = [1, 2, 3];
    foreach int x in items {
        io:println("item = ", x);
    }
}`,
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidateCode(tt.code)
			if (err != nil) != tt.wantErr {
				t.Errorf("ValidateCode() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if tt.wantErr && err != nil {
				validationErr, ok := err.(*ValidationError)
				if !ok {
					t.Errorf("Expected ValidationError, got %T", err)
					return
				}
				if validationErr.Reason != tt.errMsg {
					t.Errorf("Expected error message '%s', got '%s'", tt.errMsg, validationErr.Reason)
				}
			}
		})
	}
}
