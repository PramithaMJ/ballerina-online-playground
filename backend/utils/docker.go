package utils

import (
	"bytes"
	"os/exec"
)

func RunInDocker(filePath string, image string, command ...string) (string, error) {
	args := []string{"run", "--rm", "-v", filePath + ":/home/ballerina/code.bal", image}
	args = append(args, command...)

	cmd := exec.Command("docker", args...)
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return stderr.String(), err
	}

	return out.String(), nil
}
