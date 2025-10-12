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

// RunBallerinaPackageWithContext runs a Ballerina package in Docker with context support for cancellation
func RunBallerinaPackageWithContext(parentCtx context.Context, packageDir string) (string, error) {
	// Ensure Ballerina image is available
	ensureImageErr := ensureBallerinaImage()
	if ensureImageErr != nil {
		return "", fmt.Errorf("failed to ensure Ballerina image: %v", ensureImageErr)
	}

	// Create context with timeout, respecting parent context cancellation
	ctx, cancel := context.WithTimeout(parentCtx, 10*time.Second)
	defer cancel()

	// Convert container path to host path for Docker-in-Docker
	hostPath := convertToHostPath(packageDir)

	// Log the paths for debugging
	log.Printf("DEBUG: packageDir (container): %s", packageDir)
	log.Printf("DEBUG: hostPath (for Docker mount): %s", hostPath)

	// Check if files exist before mounting
	tomlPath := filepath.Join(packageDir, "Ballerina.toml")
	mainPath := filepath.Join(packageDir, "main.bal")

	if _, err := os.Stat(tomlPath); os.IsNotExist(err) {
		log.Printf("ERROR: Ballerina.toml not found at %s", tomlPath)
		return "", fmt.Errorf("Ballerina.toml file not created")
	} else {
		log.Printf("DEBUG: Ballerina.toml exists at %s", tomlPath)
	}

	if _, err := os.Stat(mainPath); os.IsNotExist(err) {
		log.Printf("ERROR: main.bal not found at %s", mainPath)
		return "", fmt.Errorf("main.bal file not created")
	} else {
		log.Printf("DEBUG: main.bal exists at %s", mainPath)
	}

	// List directory contents
	entries, _ := os.ReadDir(packageDir)
	log.Printf("DEBUG: Directory contents of %s:", packageDir)
	for _, entry := range entries {
		info, _ := entry.Info()
		log.Printf("  - %s (mode: %v)", entry.Name(), info.Mode())
	}

	// Create target directory on host for separate mount
	targetDir := filepath.Join(packageDir, "target")
	if err := os.MkdirAll(targetDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create target directory: %w", err)
	}
	log.Printf("DEBUG: Created target directory at %s", targetDir)

	// Convert target directory to host path
	hostTargetPath := convertToHostPath(targetDir)

	// Docker arguments with enhanced security constraints
	args := []string{
		"run",
		"--rm",
		"--network", "none", // Disable network access
		"--memory", "256m", // Reduced memory limit
		"--memory-swap", "256m", // Prevent swap usage
		"--cpus", "0.5", // Reduced CPU limit
		"--pids-limit", "50", // Limit number of processes
		"--read-only",                               // Read-only root filesystem
		"--tmpfs", "/tmp:rw,noexec,nosuid,size=50m", // Temporary writable space for build artifacts
		"--security-opt", "no-new-privileges", // Prevent privilege escalation
		"--cap-drop", "ALL", // Drop all capabilities
		"-v", hostPath + ":/home/ballerina/app:ro", // Read-only mount of source
		"-v", hostTargetPath + ":/home/ballerina/app/target:rw", // Writable target directory as separate mount
		"-w", "/home/ballerina/app", // Set working directory
		"-u", "65534:65534", // Run as nobody user
		"ballerina/ballerina:2201.10.2",
		"bal", "run", // Run the package without arguments
	}

	log.Printf("DEBUG: Docker command: docker %s", strings.Join(args, " "))

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

	// Check if context was cancelled
	if ctx.Err() == context.Canceled {
		return "", fmt.Errorf("execution cancelled by user")
	}

	// Check if context deadline exceeded (timeout)
	if ctx.Err() == context.DeadlineExceeded {
		return "", fmt.Errorf("execution timeout: code took longer than 10 seconds")
	}

	// Combine stdout and stderr if there's content in stderr
	var output string
	if stderrStr != "" {
		output = stdoutStr + "\n" + stderrStr
	} else {
		output = stdoutStr
	}

	if err != nil {
		// Return combined output with error
		return output, err
	}

	return output, nil
}

// RunBallerinaPackage runs a Ballerina package in Docker (deprecated - use RunBallerinaPackageWithContext)
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

	// Log the paths for debugging
	log.Printf("DEBUG: packageDir (container): %s", packageDir)
	log.Printf("DEBUG: hostPath (for Docker mount): %s", hostPath)

	// Check if files exist before mounting
	tomlPath := filepath.Join(packageDir, "Ballerina.toml")
	mainPath := filepath.Join(packageDir, "main.bal")

	if _, err := os.Stat(tomlPath); os.IsNotExist(err) {
		log.Printf("ERROR: Ballerina.toml not found at %s", tomlPath)
		return "", fmt.Errorf("Ballerina.toml file not created")
	} else {
		log.Printf("DEBUG: Ballerina.toml exists at %s", tomlPath)
	}

	if _, err := os.Stat(mainPath); os.IsNotExist(err) {
		log.Printf("ERROR: main.bal not found at %s", mainPath)
		return "", fmt.Errorf("main.bal file not created")
	} else {
		log.Printf("DEBUG: main.bal exists at %s", mainPath)
	}

	// List directory contents
	entries, _ := os.ReadDir(packageDir)
	log.Printf("DEBUG: Directory contents of %s:", packageDir)
	for _, entry := range entries {
		info, _ := entry.Info()
		log.Printf("  - %s (mode: %v)", entry.Name(), info.Mode())
	}

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
		"bal", "run", // Run the package without arguments
	}

	log.Printf("DEBUG: Docker command: docker %s", strings.Join(args, " "))

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

	// Combine stdout and stderr if there's content in stderr
	var output string
	if stderrStr != "" {
		output = stdoutStr + "\n" + stderrStr
	} else {
		output = stdoutStr
	}

	if err != nil {
		// Return combined output with error
		return output, err
	}

	return output, nil
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
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Docker arguments with enhanced security constraints
	args := []string{
		"run",
		"--rm",
		"--network", "none", // Disable network access
		"--memory", "128m", // Reduced memory limit
		"--memory-swap", "128m", // Prevent swap usage
		"--cpus", "0.25", // Limited CPU usage
		"--pids-limit", "30", // Limit number of processes
		"--read-only",                               // Read-only root filesystem
		"--tmpfs", "/tmp:rw,noexec,nosuid,size=20m", // Small temporary space
		"--security-opt", "no-new-privileges", // Prevent privilege escalation
		"--cap-drop", "ALL", // Drop all capabilities
		"-v", filePath + ":/home/ballerina/code.bal:ro", // Read-only mount
		"-w", "/home/ballerina", // Set working directory
		"-u", "65534:65534", // Run as nobody user
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
		return "", fmt.Errorf("compilation timeout: code took longer than 10 seconds")
	}

	if err != nil {
		// Return both stdout and stderr for better error messages
		combinedOutput := out.String() + "\n" + stderr.String()
		return combinedOutput, err
	}

	return out.String(), nil
}
