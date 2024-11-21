package utils

import (
	"os"
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
