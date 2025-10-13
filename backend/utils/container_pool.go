package utils

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	"github.com/docker/docker/api/types/container"
	imagetypes "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// ContainerPool manages a pool of reusable Docker containers for each Ballerina version
type ContainerPool struct {
	containers map[string][]*PooledContainer // version -> list of containers
	mutex      sync.Mutex
	maxSize    int
	client     *client.Client
}

// PooledContainer represents a container in the pool with metadata
type PooledContainer struct {
	ID          string
	Version     string
	InUse       bool
	CreatedAt   time.Time
	LastUsedAt  time.Time
	UseCount    int
	MaxUseCount int // Recycle container after this many uses
}

var (
	// Global pool instance
	Pool *ContainerPool

	// Supported versions to pre-initialize
	SupportedVersions = []string{
		"2201.12.0", // Latest
		"2201.11.0",
		"2201.10.5",
		"2201.10.0",
		"2201.9.0",
	}

	// Pool configuration
	PoolSizePerVersion = 3  // Number of containers per version
	MaxUseCount        = 50 // Recycle container after 50 uses
)

// InitializePool creates and initializes the container pool with pre-warmed containers
func InitializePool(ctx context.Context) error {
	log.Println("🚀 Initializing container pool...")

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %v", err)
	}

	Pool = &ContainerPool{
		containers: make(map[string][]*PooledContainer),
		maxSize:    PoolSizePerVersion,
		client:     cli,
	}

	// Pre-pull images and create containers for each supported version
	var wg sync.WaitGroup
	for _, version := range SupportedVersions {
		wg.Add(1)
		go func(ver string) {
			defer wg.Done()

			image := GetBallerinaDockerImage(ver)
			log.Printf(" Pre-pulling image: %s", image)

			// Pull image
			reader, err := cli.ImagePull(ctx, image, imagetypes.PullOptions{})
			if err != nil {
				log.Printf(" Failed to pull image %s: %v", image, err)
				return
			}
			io.Copy(io.Discard, reader)
			reader.Close()
			log.Printf(" Successfully pulled image: %s", image)

			// Create initial containers for this version
			for i := 0; i < PoolSizePerVersion; i++ {
				containerID, err := Pool.createContainer(ctx, ver)
				if err != nil {
					log.Printf(" Failed to create container for %s: %v", ver, err)
					continue
				}

				pooledContainer := &PooledContainer{
					ID:          containerID,
					Version:     ver,
					InUse:       false,
					CreatedAt:   time.Now(),
					LastUsedAt:  time.Now(),
					UseCount:    0,
					MaxUseCount: MaxUseCount,
				}

				Pool.mutex.Lock()
				Pool.containers[ver] = append(Pool.containers[ver], pooledContainer)
				Pool.mutex.Unlock()

				log.Printf(" Pre-initialized container %d/%d for version %s: %s",
					i+1, PoolSizePerVersion, ver, containerID[:12])
			}
		}(version)
	}

	wg.Wait()

	// Start background health monitor
	go Pool.healthMonitor(ctx)

	log.Println(" Container pool initialization complete!")
	Pool.printStats()

	return nil
}

// createContainer creates a new Docker container for the pool
func (p *ContainerPool) createContainer(ctx context.Context, version string) (string, error) {
	image := GetBallerinaDockerImage(version)

	config := &container.Config{
		Image:      image,
		Cmd:        []string{"tail", "-f", "/dev/null"}, // Keep container running
		WorkingDir: "/home/ballerina",
		Tty:        false,
		OpenStdin:  false,
		User:       "ballerina", // Run as ballerina user
	}

	hostConfig := &container.HostConfig{
		Resources: container.Resources{
			Memory:   512 * 1024 * 1024, // 512MB
			NanoCPUs: 1000000000,        // 1 CPU core
		},
		NetworkMode:    "none", // Disable network for security
		AutoRemove:     false,  // Keep container for pooling
		ReadonlyRootfs: false,
		Tmpfs: map[string]string{
			"/tmp":        "rw,noexec,nosuid,size=100m",
			"/.ballerina": "rw,noexec,nosuid,size=20m",
		},
		SecurityOpt: []string{"no-new-privileges"},
		CapDrop:     []string{"ALL"},
	}

	resp, err := p.client.ContainerCreate(ctx, config, hostConfig, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("container create failed: %v", err)
	}

	if err := p.client.ContainerStart(ctx, resp.ID, container.StartOptions{}); err != nil {
		return "", fmt.Errorf("container start failed: %v", err)
	}

	// Create app directory with proper permissions
	execConfig := types.ExecConfig{
		Cmd:          []string{"mkdir", "-p", "/home/ballerina/app"},
		AttachStdout: true,
		AttachStderr: true,
		User:         "ballerina",
	}

	execResp, err := p.client.ContainerExecCreate(ctx, resp.ID, execConfig)
	if err != nil {
		log.Printf("Warning: failed to create app directory: %v", err)
	} else {
		if err := p.client.ContainerExecStart(ctx, execResp.ID, types.ExecStartCheck{}); err != nil {
			log.Printf("Warning: failed to start exec for mkdir: %v", err)
		}
	}

	return resp.ID, nil
}

// GetContainer retrieves an available container from the pool
func (p *ContainerPool) GetContainer(version string) (*PooledContainer, error) {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	containers := p.containers[version]

	// Find an available container
	for _, c := range containers {
		if !c.InUse {
			c.InUse = true
			c.LastUsedAt = time.Now()
			c.UseCount++
			log.Printf(" Using container from pool: %s (version: %s, uses: %d)",
				c.ID[:12], version, c.UseCount)
			return c, nil
		}
	}

	// No available container, create a new one if pool isn't full
	if len(containers) < p.maxSize*2 { // Allow pool to grow up to 2x during high load
		log.Printf(" Pool exhausted, creating new container for version %s", version)
		containerID, err := p.createContainer(context.Background(), version)
		if err != nil {
			return nil, fmt.Errorf("failed to create new container: %v", err)
		}

		pooledContainer := &PooledContainer{
			ID:          containerID,
			Version:     version,
			InUse:       true,
			CreatedAt:   time.Now(),
			LastUsedAt:  time.Now(),
			UseCount:    1,
			MaxUseCount: MaxUseCount,
		}

		p.containers[version] = append(p.containers[version], pooledContainer)
		return pooledContainer, nil
	}

	return nil, fmt.Errorf("no available containers for version %s", version)
}

// ReturnContainer returns a container back to the pool
func (p *ContainerPool) ReturnContainer(c *PooledContainer, healthy bool) {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	if !healthy || c.UseCount >= c.MaxUseCount {
		// Remove unhealthy or overused container
		log.Printf("  Recycling container: %s (healthy: %v, uses: %d/%d)",
			c.ID[:12], healthy, c.UseCount, c.MaxUseCount)

		go func() {
			ctx := context.Background()
			p.client.ContainerRemove(ctx, c.ID, container.RemoveOptions{Force: true})

			// Create replacement container
			newID, err := p.createContainer(ctx, c.Version)
			if err != nil {
				log.Printf(" Failed to create replacement container: %v", err)
				return
			}

			newContainer := &PooledContainer{
				ID:          newID,
				Version:     c.Version,
				InUse:       false,
				CreatedAt:   time.Now(),
				LastUsedAt:  time.Now(),
				UseCount:    0,
				MaxUseCount: MaxUseCount,
			}

			p.mutex.Lock()
			// Replace old container with new one
			containers := p.containers[c.Version]
			for i, container := range containers {
				if container.ID == c.ID {
					p.containers[c.Version][i] = newContainer
					break
				}
			}
			p.mutex.Unlock()

			log.Printf(" Replaced container: %s -> %s", c.ID[:12], newID[:12])
		}()
	} else {
		// Return healthy container to pool
		c.InUse = false
		log.Printf(" Returned container to pool: %s (version: %s)", c.ID[:12], c.Version)
	}
}

// ExecuteInContainer executes Ballerina code in a pooled container
func (p *ContainerPool) ExecuteInContainer(ctx context.Context, c *PooledContainer, packageDir string) (string, error) {
	// Copy files to container
	if err := p.copyToContainer(ctx, c.ID, packageDir); err != nil {
		return "", fmt.Errorf("failed to copy files: %v", err)
	}

	// Create exec configuration
	execConfig := types.ExecConfig{
		Cmd:          []string{"bal", "run"},
		WorkingDir:   "/home/ballerina/app",
		AttachStdout: true,
		AttachStderr: true,
		User:         "ballerina", // Run as ballerina user
	}

	// Create exec instance
	execResp, err := p.client.ContainerExecCreate(ctx, c.ID, execConfig)
	if err != nil {
		return "", fmt.Errorf("exec create failed: %v", err)
	}

	// Attach to exec
	attachResp, err := p.client.ContainerExecAttach(ctx, execResp.ID, types.ExecStartCheck{})
	if err != nil {
		return "", fmt.Errorf("exec attach failed: %v", err)
	}
	defer attachResp.Close()

	// Read output with timeout
	var outputBuf bytes.Buffer
	var stderrBuf bytes.Buffer

	done := make(chan error, 1)
	go func() {
		_, err := stdcopy.StdCopy(&outputBuf, &stderrBuf, attachResp.Reader)
		done <- err
	}()

	select {
	case <-ctx.Done():
		return "", fmt.Errorf("execution timeout")
	case err := <-done:
		if err != nil && err != io.EOF {
			return "", fmt.Errorf("read output failed: %v", err)
		}
	}

	// Check exit code
	inspectResp, err := p.client.ContainerExecInspect(ctx, execResp.ID)
	if err != nil {
		return "", fmt.Errorf("exec inspect failed: %v", err)
	}

	output := outputBuf.String()
	if stderrBuf.Len() > 0 {
		output += "\n" + stderrBuf.String()
	}

	if inspectResp.ExitCode != 0 {
		return output, fmt.Errorf("execution failed with exit code %d", inspectResp.ExitCode)
	}

	return output, nil
}

// copyToContainer copies files from packageDir to container
func (p *ContainerPool) copyToContainer(ctx context.Context, containerID, packageDir string) error {
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	// Walk through package directory and add files to tar
	err := filepath.Walk(packageDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// Get relative path
		relPath, err := filepath.Rel(packageDir, path)
		if err != nil {
			return err
		}

		// Skip if it's the root directory
		if relPath == "." {
			return nil
		}

		// Create tar header
		header, err := tar.FileInfoHeader(info, "")
		if err != nil {
			return err
		}
		header.Name = relPath

		// Write header
		if err := tw.WriteHeader(header); err != nil {
			return err
		}

		// If it's a file, write content
		if !info.IsDir() {
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			if _, err := io.Copy(tw, file); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to create tar: %v", err)
	}

	if err := tw.Close(); err != nil {
		return fmt.Errorf("failed to close tar writer: %v", err)
	}

	// Copy tar to container
	return p.client.CopyToContainer(ctx, containerID, "/home/ballerina/app",
		&buf, types.CopyToContainerOptions{})
}

// healthMonitor periodically checks container health
func (p *ContainerPool) healthMonitor(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.checkHealth(ctx)
		}
	}
}

// checkHealth checks the health of all containers in the pool
func (p *ContainerPool) checkHealth(ctx context.Context) {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	for version, containers := range p.containers {
		for i, c := range containers {
			if c.InUse {
				continue // Skip containers in use
			}

			// Check if container is still running
			inspect, err := p.client.ContainerInspect(ctx, c.ID)
			if err != nil || !inspect.State.Running {
				log.Printf(" Unhealthy container detected: %s (version: %s)", c.ID[:12], version)

				// Remove and replace
				p.client.ContainerRemove(ctx, c.ID, container.RemoveOptions{Force: true})

				newID, err := p.createContainer(ctx, version)
				if err != nil {
					log.Printf(" Failed to replace unhealthy container: %v", err)
					continue
				}

				p.containers[version][i] = &PooledContainer{
					ID:          newID,
					Version:     version,
					InUse:       false,
					CreatedAt:   time.Now(),
					LastUsedAt:  time.Now(),
					UseCount:    0,
					MaxUseCount: MaxUseCount,
				}

				log.Printf(" Replaced unhealthy container: %s -> %s", c.ID[:12], newID[:12])
			}
		}
	}
}

// printStats prints pool statistics
func (p *ContainerPool) printStats() {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	log.Println(" Container Pool Statistics:")
	for version, containers := range p.containers {
		available := 0
		inUse := 0
		for _, c := range containers {
			if c.InUse {
				inUse++
			} else {
				available++
			}
		}
		log.Printf("  Version %s: %d total (%d available, %d in use)",
			version, len(containers), available, inUse)
	}
}

// Shutdown gracefully shuts down the pool
func (p *ContainerPool) Shutdown(ctx context.Context) {
	log.Println(" Shutting down container pool...")
	p.mutex.Lock()
	defer p.mutex.Unlock()

	for version, containers := range p.containers {
		for _, c := range containers {
			log.Printf("Removing container: %s (version: %s)", c.ID[:12], version)
			p.client.ContainerRemove(ctx, c.ID, container.RemoveOptions{Force: true})
		}
	}

	log.Println(" Container pool shutdown complete")
}
