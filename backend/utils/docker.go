package utils

import (
	"bytes"
	"context"
	"fmt"
	"os/exec"
	"time"
)

func RunInDocker(filePath string, image string, command ...string) (string, error) {
	// Create context with timeout to prevent long-running executions
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Docker arguments with resource limits for security
	args := []string{
		"run",
		"--rm",
		"--network", "none", // Disable network access
		"--memory", "256m", // Limit memory to 256MB
		"--cpus", "0.5", // Limit CPU usage
		"--pids-limit", "50", // Limit number of processes
		"-v", filePath + ":/home/ballerina/code.bal:ro", // Read-only mount
		image,
	}
	args = append(args, command...)

	cmd := exec.CommandContext(ctx, "docker", args...)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()

	// Check if context deadline exceeded (timeout)
	if ctx.Err() == context.DeadlineExceeded {
		return "", fmt.Errorf("execution timeout: code took longer than 30 seconds")
	}

	if err != nil {
		// Return both stdout and stderr for better error messages
		combinedOutput := out.String() + "\n" + stderr.String()
		return combinedOutput, err
	}

	return out.String(), nil
}
