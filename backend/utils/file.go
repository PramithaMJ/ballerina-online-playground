package utils

import (
	"os"
	"path/filepath"
)

func SaveToTempFile(content string, fileName string) (string, error) {
	tempFile, err := os.CreateTemp("", fileName)
	if err != nil {
		return "", err
	}
	defer tempFile.Close()

	_, err = tempFile.WriteString(content)
	if err != nil {
		return "", err
	}

	return tempFile.Name(), nil
}

// CreateBallerinaPackage creates a minimal Ballerina package structure with the given code
func CreateBallerinaPackage(code string) (string, error) {
	// Use TEMP_DIR environment variable or fall back to system temp
	tempBaseDir := os.Getenv("TEMP_DIR")
	if tempBaseDir == "" {
		tempBaseDir = os.TempDir()
	}

	// Ensure base directory exists with proper permissions
	if err := os.MkdirAll(tempBaseDir, 0777); err != nil {
		return "", err
	}

	// Create temp directory for the package
	tempDir, err := os.MkdirTemp(tempBaseDir, "ballerina-pkg-*")
	if err != nil {
		return "", err
	}

	// Set proper permissions for the package directory
	if err := os.Chmod(tempDir, 0777); err != nil {
		os.RemoveAll(tempDir)
		return "", err
	}

	// Create Ballerina.toml with optimized build options
	ballerinaToml := `[package]
org = "playground"
name = "playground"
version = "0.1.0"
distribution = "2201.10.0"

[build-options]
observabilityIncluded = false
offline = true
cloud = "docker"
`
	err = os.WriteFile(filepath.Join(tempDir, "Ballerina.toml"), []byte(ballerinaToml), 0666)
	if err != nil {
		os.RemoveAll(tempDir)
		return "", err
	}

	// Create main.bal with the user code
	err = os.WriteFile(filepath.Join(tempDir, "main.bal"), []byte(code), 0666)
	if err != nil {
		os.RemoveAll(tempDir)
		return "", err
	}

	return tempDir, nil
}
