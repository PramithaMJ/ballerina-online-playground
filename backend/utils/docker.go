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

// GetBallerinaDockerImage returns the Docker image name for a given Ballerina version
func GetBallerinaDockerImage(version string) string {
	// Map version to Docker image
	switch version {
	// Swan Lake Update 12 and later
	case "2201.12.0":
		return "ballerina/ballerina:2201.12.0"
	case "2201.11.0":
		return "ballerina/ballerina:2201.11.0"
	case "2201.10.5":
		return "ballerina/ballerina:2201.10.5"
	case "2201.10.4":
		return "ballerina/ballerina:2201.10.4"
	case "2201.10.3":
		return "ballerina/ballerina:2201.10.3"
	case "2201.10.2":
		return "ballerina/ballerina:2201.10.2"
	case "2201.10.1":
		return "ballerina/ballerina:2201.10.1"
	case "2201.10.0":
		return "ballerina/ballerina:2201.10.0"
	case "2201.9.3":
		return "ballerina/ballerina:2201.9.3"
	case "2201.9.2":
		return "ballerina/ballerina:2201.9.2"
	case "2201.9.1":
		return "ballerina/ballerina:2201.9.1"
	case "2201.9.0":
		return "ballerina/ballerina:2201.9.0"
	case "2201.8.6":
		return "ballerina/ballerina:2201.8.6"
	case "2201.8.5":
		return "ballerina/ballerina:2201.8.5"
	case "2201.8.4":
		return "ballerina/ballerina:2201.8.4"
	case "2201.8.3":
		return "ballerina/ballerina:2201.8.3"
	case "2201.8.2":
		return "ballerina/ballerina:2201.8.2"
	case "2201.8.1":
		return "ballerina/ballerina:2201.8.1"
	case "2201.8.0":
		return "ballerina/ballerina:2201.8.0"
	case "2201.7.2":
		return "ballerina/ballerina:2201.7.2"
	case "2201.7.0":
		return "ballerina/ballerina:2201.7.0"
	case "2201.6.0":
		return "ballerina/ballerina:2201.6.0"
	case "2201.5.0":
		return "ballerina/ballerina:2201.5.0"
	case "2201.4.1":
		return "ballerina/ballerina:2201.4.1"
	case "2201.4.0":
		return "ballerina/ballerina:2201.4.0"
	case "swan-lake", "latest":
		return "ballerina/ballerina:swan-lake"
	default:
		// Default to latest stable version
		return "ballerina/ballerina:2201.12.0"
	}
}

// IsValidBallerinaVersion checks if the provided version is valid
func IsValidBallerinaVersion(version string) bool {
	validVersions := []string{
		// Swan Lake Update 12 (Latest)
		"2201.12.0",
		// Swan Lake Update 11
		"2201.11.0",
		// Swan Lake Update 10
		"2201.10.5", "2201.10.4", "2201.10.3", "2201.10.2", "2201.10.1", "2201.10.0",
		// Swan Lake Update 9
		"2201.9.3", "2201.9.2", "2201.9.1", "2201.9.0",
		// Swan Lake Update 8
		"2201.8.6", "2201.8.5", "2201.8.4", "2201.8.3", "2201.8.2", "2201.8.1", "2201.8.0",
		// Swan Lake Update 7
		"2201.7.2", "2201.7.0",
		// Swan Lake Update 6
		"2201.6.0",
		// Swan Lake Update 5
		"2201.5.0",
		// Swan Lake Update 4
		"2201.4.1", "2201.4.0",
		// Special tags
		"swan-lake", "latest",
	}
	for _, v := range validVersions {
		if version == v {
			return true
		}
	}
	return false
}

// RunBallerinaPackageWithContext runs a Ballerina package in Docker with context support for cancellation
func RunBallerinaPackageWithContext(parentCtx context.Context, packageDir string, version string) (string, error) {
	startTime := time.Now()

	// Set default version if empty
	if version == "" {
		version = "2201.12.0"
	}

	// Create context with timeout, respecting parent context cancellation
	ctx, cancel := context.WithTimeout(parentCtx, 60*time.Second)
	defer cancel()

	// Try to use container pool if available
	if Pool != nil {
		container, err := Pool.GetContainer(ctx, version)
		if err != nil {
			log.Printf("  Pool unavailable for version %s, falling back to docker run: %v", version, err)
		} else {
			// Read the code from main.bal file
			mainBalPath := filepath.Join(packageDir, "main.bal")
			codeBytes, readErr := os.ReadFile(mainBalPath)
			if readErr != nil {
				Pool.ReturnContainer(container, false)
				return "", fmt.Errorf("failed to read main.bal: %v", readErr)
			}

			// Execute using pooled container
			output, execErr := Pool.ExecuteInContainer(ctx, container, string(codeBytes))

			// Determine if container is still healthy
			healthy := execErr == nil || ctx.Err() == nil

			// Return container to pool
			Pool.ReturnContainer(container, healthy)

			log.Printf("⚡ Execution completed in %v using pooled container", time.Since(startTime))
			return output, execErr
		}
	}

	// Fallback to original docker run method if pool is not available
	log.Printf(" Container pool not available, using docker run fallback")

	// Get Docker image for the version
	dockerImage := GetBallerinaDockerImage(version)

	// Ensure Ballerina image is available
	ensureImageErr := ensureBallerinaImage(dockerImage)
	if ensureImageErr != nil {
		return "", fmt.Errorf("failed to ensure Ballerina image: %v", ensureImageErr)
	}

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

	// Create target directory on host for separate mount with world-writable permissions
	targetDir := filepath.Join(packageDir, "target")
	if err := os.MkdirAll(targetDir, 0777); err != nil {
		return "", fmt.Errorf("failed to create target directory: %w", err)
	}
	// Ensure the directory is writable by the nobody user (65534:65534)
	if err := os.Chmod(targetDir, 0777); err != nil {
		return "", fmt.Errorf("failed to set permissions on target directory: %w", err)
	}
	log.Printf("DEBUG: Created target directory at %s with permissions 0777", targetDir)

	// Ensure package directory has proper permissions for Dependencies.toml creation
	if err := os.Chmod(packageDir, 0777); err != nil {
		return "", fmt.Errorf("failed to set permissions on package directory: %w", err)
	}

	// Docker arguments with enhanced security constraints
	// Note: Package directory is mounted as rw to allow Dependencies.toml creation
	args := []string{
		"run",
		"--rm",
		"--network", "none", // Disable network access
		"--memory", "512m", // Increased memory limit
		"--memory-swap", "512m", // Prevent swap usage
		"--cpus", "1.0", // Increased CPU limit
		"--pids-limit", "100", // Increased process limit
		"--read-only",                                // Read-only root filesystem
		"--tmpfs", "/tmp:rw,noexec,nosuid,size=100m", // Larger temporary writable space
		"--tmpfs", "/.ballerina:rw,noexec,nosuid,size=20m", // Larger writable home for Ballerina config
		"--security-opt", "no-new-privileges", // Prevent privilege escalation
		"--cap-drop", "ALL", // Drop all capabilities
		"-v", hostPath + ":/home/ballerina/app:rw", // Read-write mount for Dependencies.toml
		"-w", "/home/ballerina/app", // Set working directory
		"-u", "65534:65534", // Run as nobody user
		dockerImage,
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
		return "", fmt.Errorf("execution timeout: code took longer than 60 seconds")
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
	// Default to version 2201.12.0
	dockerImage := "ballerina/ballerina:2201.12.0"

	// Ensure Ballerina image is available
	ensureImageErr := ensureBallerinaImage(dockerImage)
	if ensureImageErr != nil {
		return "", fmt.Errorf("failed to ensure Ballerina image: %v", ensureImageErr)
	}

	// Create context with timeout to prevent long-running executions
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
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
		dockerImage,
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
func ensureBallerinaImage(dockerImage string) error {
	// Check if image exists locally
	checkCmd := exec.Command("docker", "images", "-q", dockerImage)
	output, err := checkCmd.Output()

	// If image exists (output is not empty), return immediately
	if err == nil && len(strings.TrimSpace(string(output))) > 0 {
		return nil
	}

	// Image doesn't exist, pull it with a timeout
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	log.Printf("Pulling Docker image: %s", dockerImage)
	pullCmd := exec.CommandContext(ctx, "docker", "pull", dockerImage)
	pullErr := pullCmd.Run()

	if pullErr != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return fmt.Errorf("timeout pulling Ballerina image: %s", dockerImage)
		}
		return pullErr
	}

	log.Printf("Successfully pulled Docker image: %s", dockerImage)
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
