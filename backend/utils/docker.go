package utils

import (
	"bytes"
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

// RunBallerinaPackage runs a Ballerina package in Docker
func RunBallerinaPackage(packageDir string) (string, error) {
	// Ensure Ballerina image is available
	ensureImageErr := ensureBallerinaImage()
	if ensureImageErr != nil {
		return "", fmt.Errorf("failed to ensure Ballerina image: %v", ensureImageErr)
	}

	// Create context with timeout to prevent long-running executions
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Convert container path to host path for Docker-in-Docker
	hostPath := convertToHostPath(packageDir)

	// Docker arguments with resource limits for security
	// We mount as read-write because Ballerina needs to create build artifacts
	args := []string{
		"run",
		"--rm",
		"--network", "none", // Disable network access
		"--memory", "512m", // Increased memory for compilation
		"--cpus", "1.0", // Increased CPU for compilation
		"--pids-limit", "50", // Limit number of processes
		"-v", hostPath + ":/home/ballerina/app", // Read-write mount for build artifacts
		"-w", "/home/ballerina/app", // Set working directory
		"ballerina/ballerina:2201.10.2",
		"bal", "run",
	}

	cmd := exec.CommandContext(ctx, "docker", args...)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()

	// Capture both stdout and stderr
	stdoutStr := out.String()
	stderrStr := stderr.String()

	// Debug logging
	log.Printf("DEBUG: stdout length: %d, stderr length: %d", len(stdoutStr), len(stderrStr))
	log.Printf("DEBUG: stdout content: %q", stdoutStr)
	log.Printf("DEBUG: stderr content: %q", stderrStr)

	// Check if context deadline exceeded (timeout)
	if ctx.Err() == context.DeadlineExceeded {
		return "", fmt.Errorf("execution timeout: code took longer than 30 seconds")
	}

	// Prepend Ballerina version information to output
	versionInfo := "Ballerina 2201.10.2 (Swan Lake Update 10)\n\n"

	// Combine stdout and stderr if there's content in stderr
	var outputWithVersion string
	if stderrStr != "" {
		outputWithVersion = versionInfo + stdoutStr + "\n" + stderrStr
	} else {
		outputWithVersion = versionInfo + stdoutStr
	}

	if err != nil {
		// Return combined output with error
		return outputWithVersion, err
	}

	return outputWithVersion, nil
}

// ensureBallerinaImage ensures the Ballerina Docker image is available locally
func ensureBallerinaImage() error {
	// Check if image exists locally
	checkCmd := exec.Command("docker", "images", "-q", "ballerina/ballerina:2201.10.2")
	output, err := checkCmd.Output()

	// If image exists (output is not empty), return immediately
	if err == nil && len(strings.TrimSpace(string(output))) > 0 {
		return nil
	}

	// Image doesn't exist, pull it with a timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	pullCmd := exec.CommandContext(ctx, "docker", "pull", "ballerina/ballerina:2201.10.2")
	pullErr := pullCmd.Run()

	if pullErr != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return fmt.Errorf("timeout pulling Ballerina image")
		}
		return pullErr
	}

	return nil
}

// convertToHostPath converts a container path to a host path for Docker-in-Docker
func convertToHostPath(containerPath string) string {
	tempDir := os.Getenv("TEMP_DIR")
	hostTempDir := os.Getenv("HOST_TEMP_DIR")

	// If HOST_TEMP_DIR is not set, return the container path as-is
	if hostTempDir == "" || tempDir == "" {
		return containerPath
	}

	// Clean paths to ensure consistent comparison
	tempDir = filepath.Clean(tempDir)
	containerPath = filepath.Clean(containerPath)

	// Replace the container temp dir with the host temp dir
	if strings.HasPrefix(containerPath, tempDir) {
		relativePath := strings.TrimPrefix(containerPath, tempDir)
		return filepath.Join(hostTempDir, relativePath)
	}

	return containerPath
}

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
		"-w", "/home/ballerina", // Set working directory
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
