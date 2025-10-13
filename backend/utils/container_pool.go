package utils

import (
	"archive/tar"
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"sync"
	"time"

	"github.com/docker/docker/api/types"
	containertypes "github.com/docker/docker/api/types/container"
	imagetypes "github.com/docker/docker/api/types/image"
	"github.com/docker/docker/client"
	"github.com/docker/docker/pkg/stdcopy"
)

// ALL supported Ballerina versions for comprehensive coverage
var SupportedVersions = []string{
	// Latest versions (high priority - more containers)
	"2201.12.0", "2201.11.0", "2201.10.5", "2201.10.4", "2201.10.3", "2201.10.2", "2201.10.1", "2201.10.0",
	// Common versions (medium priority)
	"2201.9.2", "2201.9.1", "2201.9.0",
	"2201.8.6", "2201.8.5", "2201.8.4", "2201.8.3", "2201.8.2", "2201.8.1", "2201.8.0",
	"2201.7.2", "2201.7.1", "2201.7.0",
	// Older versions (lower priority)
	"2201.6.0", "2201.5.0", "2201.4.1", "2201.4.0", "2201.3.0",
}

// Priority-based pool sizing for optimal resource usage (4GB RAM system)
var VersionPriority = map[string]int{
	"2201.12.0": 6, // Latest - 6 containers
	"2201.11.0": 4, // Popular - 4 containers
	"2201.10.5": 4,
	"2201.10.0": 3,
	"2201.9.0":  3,
	"2201.8.0":  2,
	// Others: 2 containers (default)
}

const (
	DefaultPoolSize     = 2  // Default containers per version
	MaxPoolSizePerVer   = 10 // Max containers per version
	MaxUseCount         = 30 // Recycle after 30 uses
	HealthCheckInterval = 30 * time.Second
	ScalingInterval     = 20 * time.Second
)

// PooledContainer represents a container with thread-safe state management
type PooledContainer struct {
	ID         string
	Version    string
	InUse      bool
	Healthy    bool
	CreatedAt  time.Time
	LastUsedAt time.Time
	UseCount   int
	mutex      sync.Mutex
}

// ContainerPool manages reusable Docker containers with advanced features
type ContainerPool struct {
	containers     map[string][]*PooledContainer
	mutex          sync.RWMutex
	client         *client.Client
	ctx            context.Context
	pulledImages   map[string]bool
	imagePullMutex sync.Mutex
	stats          *PoolStats
}

// PoolStats tracks pool performance metrics
type PoolStats struct {
	TotalExecutions  int64
	CacheHits        int64
	PoolHits         int64
	PoolMisses       int64
	TotalWaitTime    time.Duration
	AvgExecutionTime time.Duration
	mutex            sync.Mutex
}

var Pool *ContainerPool

// InitializePool creates and initializes the container pool with all versions
func InitializePool(ctx context.Context) error {
	log.Println("Initializing high-performance container pool...")
	startTime := time.Now()

	cli, err := client.NewClientWithOpts(client.FromEnv, client.WithAPIVersionNegotiation())
	if err != nil {
		return fmt.Errorf("failed to create Docker client: %v", err)
	}

	Pool = &ContainerPool{
		containers:   make(map[string][]*PooledContainer),
		client:       cli,
		ctx:          ctx,
		pulledImages: make(map[string]bool),
		stats:        &PoolStats{},
	}

	log.Printf(" System: 4GB RAM, optimizing for %d Ballerina versions", len(SupportedVersions))
	log.Printf("📥 Phase 1/2: Pre-pulling Docker images (this may take 2-3 minutes)...")

	// Phase 1: Pre-pull all images with parallel downloads (rate limited)
	var pullWg sync.WaitGroup
	pullSemaphore := make(chan struct{}, 6) // 6 concurrent pulls
	pullStart := time.Now()

	for idx, version := range SupportedVersions {
		pullWg.Add(1)
		go func(ver string, index int) {
			defer pullWg.Done()
			pullSemaphore <- struct{}{}        // Acquire
			defer func() { <-pullSemaphore }() // Release

			image := GetBallerinaDockerImage(ver)
			log.Printf("  [%d/%d] Pulling %s...", index+1, len(SupportedVersions), ver)

			reader, err := cli.ImagePull(ctx, image, imagetypes.PullOptions{})
			if err != nil {
				log.Printf("  ❌ Failed to pull %s: %v", ver, err)
				return
			}
			defer reader.Close()

			// Drain the reader to complete the pull
			io.Copy(io.Discard, reader)

			Pool.imagePullMutex.Lock()
			Pool.pulledImages[ver] = true
			Pool.imagePullMutex.Unlock()

			log.Printf("   [%d/%d] Pulled %s", index+1, len(SupportedVersions), ver)
		}(version, idx)
	}
	pullWg.Wait()

	pulledCount := len(Pool.pulledImages)
	log.Printf(" Phase 1 complete: Pulled %d/%d images in %v",
		pulledCount, len(SupportedVersions), time.Since(pullStart))

	// Phase 2: Create container pools in parallel
	log.Printf("🔧 Phase 2/2: Creating container pools...")
	createStart := time.Now()

	var createWg sync.WaitGroup
	totalContainersCreated := 0
	var totalMutex sync.Mutex

	for _, version := range SupportedVersions {
		// Check if image was successfully pulled
		Pool.imagePullMutex.Lock()
		pulled := Pool.pulledImages[version]
		Pool.imagePullMutex.Unlock()

		if !pulled {
			log.Printf("    Skipping %s (image not available)", version)
			continue
		}

		// Determine pool size based on priority
		poolSize, hasPriority := VersionPriority[version]
		if !hasPriority {
			poolSize = DefaultPoolSize
		}

		createWg.Add(1)
		go func(ver string, size int) {
			defer createWg.Done()

			successCount := 0
			for i := 0; i < size; i++ {
				containerID, err := Pool.createContainer(ctx, ver)
				if err != nil {
					log.Printf("  ❌ Failed to create container for %s: %v", ver, err)
					continue
				}

				pooledContainer := &PooledContainer{
					ID:         containerID,
					Version:    ver,
					InUse:      false,
					Healthy:    true,
					CreatedAt:  time.Now(),
					LastUsedAt: time.Now(),
					UseCount:   0,
				}

				Pool.mutex.Lock()
				Pool.containers[ver] = append(Pool.containers[ver], pooledContainer)
				Pool.mutex.Unlock()

				successCount++
			}

			if successCount > 0 {
				totalMutex.Lock()
				totalContainersCreated += successCount
				totalMutex.Unlock()
				log.Printf("   %s: Created %d/%d containers", ver, successCount, size)
			}
		}(version, poolSize)
	}
	createWg.Wait()

	log.Printf(" Phase 2 complete: Created %d containers in %v",
		totalContainersCreated, time.Since(createStart))

	// Phase 3: Aggressive container warm-up to pre-compile and warm JVM
	log.Printf(" Phase 3/3: Warming up containers (pre-compiling dummy code)...")
	warmupStart := time.Now()

	// Dummy Ballerina code to warm up containers
	dummyCode := `import ballerina/io;

public function main() {
    io:println("Container warmed up");
}
`

	var warmupWg sync.WaitGroup
	warmedCount := 0
	var warmupMutex sync.Mutex

	for version, containers := range Pool.containers {
		for idx, container := range containers {
			warmupWg.Add(1)
			go func(ver string, c *PooledContainer, index int) {
				defer warmupWg.Done()

				log.Printf("   [%d] Warming up %s (version: %s)...", index+1, c.ID[:12], ver)

				// Execute dummy code to warm up the container
				_, err := Pool.ExecuteInContainer(ctx, c, dummyCode)
				if err != nil {
					log.Printf("    Warmup failed for %s: %v", c.ID[:12], err)
				} else {
					warmupMutex.Lock()
					warmedCount++
					warmupMutex.Unlock()
					log.Printf("   [%d] Warmed up %s (version: %s)", index+1, c.ID[:12], ver)
				}
			}(version, container, idx)
		}
	}
	warmupWg.Wait()

	log.Printf(" Phase 3 complete: Warmed up %d/%d containers in %v",
		warmedCount, totalContainersCreated, time.Since(warmupStart))

	// Start background maintenance tasks
	go Pool.healthMonitor(ctx)
	go Pool.autoScaler(ctx)
	go Pool.statsReporter(ctx)

	totalTime := time.Since(startTime)
	log.Printf("🎉 Container pool initialization complete in %v!", totalTime)
	Pool.printStats()

	return nil
}

// createContainer creates a new Docker container with optimized settings
func (p *ContainerPool) createContainer(ctx context.Context, version string) (string, error) {
	image := GetBallerinaDockerImage(version)

	config := &containertypes.Config{
		Image:      image,
		Cmd:        []string{"tail", "-f", "/dev/null"}, // Keep alive
		WorkingDir: "/home/ballerina",
		User:       "ballerina",
		Tty:        false,
		OpenStdin:  false,
	}

	hostConfig := &containertypes.HostConfig{
		Resources: containertypes.Resources{
			Memory:   512 * 1024 * 1024, // 512MB per container
			NanoCPUs: 1000000000,        // 1 CPU core
		},
		NetworkMode:    "none", // No network for security
		AutoRemove:     false,
		ReadonlyRootfs: false,
		Tmpfs: map[string]string{
			"/tmp":        "rw,noexec,nosuid,size=100m",
			"/.ballerina": "rw,noexec,nosuid,size=50m",
		},
		SecurityOpt: []string{"no-new-privileges"},
		CapDrop:     []string{"ALL"},
		IpcMode:     "private",
	}

	resp, err := p.client.ContainerCreate(ctx, config, hostConfig, nil, nil, "")
	if err != nil {
		return "", fmt.Errorf("container create failed: %w", err)
	}

	if err := p.client.ContainerStart(ctx, resp.ID, containertypes.StartOptions{}); err != nil {
		p.client.ContainerRemove(ctx, resp.ID, containertypes.RemoveOptions{Force: true})
		return "", fmt.Errorf("container start failed: %w", err)
	}

	// Pre-create app directory with proper permissions
	execConfig := types.ExecConfig{
		User:         "ballerina",
		Cmd:          []string{"mkdir", "-p", "/home/ballerina/app"},
		AttachStdout: true,
		AttachStderr: true,
	}

	execResp, err := p.client.ContainerExecCreate(ctx, resp.ID, execConfig)
	if err == nil {
		p.client.ContainerExecStart(ctx, execResp.ID, types.ExecStartCheck{})
	}

	return resp.ID, nil
}

// GetContainer retrieves a container from the pool with smart waiting and auto-scaling
func (p *ContainerPool) GetContainer(ctx context.Context, version string) (*PooledContainer, error) {
	p.mutex.RLock()
	containers, exists := p.containers[version]
	p.mutex.RUnlock()

	if !exists || len(containers) == 0 {
		return nil, fmt.Errorf("unsupported version: %s", version)
	}

	maxWaitTime := 3 * time.Second
	retryInterval := 50 * time.Millisecond
	startTime := time.Now()

	for {
		p.mutex.Lock()
		for _, container := range containers {
			container.mutex.Lock()
			if !container.InUse && container.Healthy {
				container.InUse = true
				container.UseCount++
				container.LastUsedAt = time.Now()
				container.mutex.Unlock()

				// Track pool hit
				p.stats.mutex.Lock()
				p.stats.PoolHits++
				p.stats.mutex.Unlock()

				p.mutex.Unlock()
				log.Printf(" Retrieved pooled container for version %s (uses: %d)", version, container.UseCount)
				return container, nil
			}
			container.mutex.Unlock()
		}

		currentSize := len(containers)
		maxSize := MaxPoolSizePerVer
		utilizationRate := float64(currentSize) / float64(maxSize)

		// Auto-scale if utilization is high and we haven't reached max
		if utilizationRate >= 0.8 && currentSize < maxSize {
			p.mutex.Unlock()
			log.Printf("⚡ Auto-scaling: Creating additional container for version %s (current: %d/%d)",
				version, currentSize, maxSize)

			containerID, err := p.createContainer(ctx, version)
			if err == nil {
				newContainer := &PooledContainer{
					ID:         containerID,
					Version:    version,
					InUse:      true,
					Healthy:    true,
					CreatedAt:  time.Now(),
					LastUsedAt: time.Now(),
					UseCount:   1,
				}

				p.mutex.Lock()
				p.containers[version] = append(p.containers[version], newContainer)
				p.stats.mutex.Lock()
				p.stats.PoolHits++
				p.stats.mutex.Unlock()
				p.mutex.Unlock()

				log.Printf(" Auto-scaled: Created new container for version %s", version)
				return newContainer, nil
			}
			p.mutex.Lock()
		}
		p.mutex.Unlock()

		// Check if we've exceeded max wait time
		if time.Since(startTime) > maxWaitTime {
			p.stats.mutex.Lock()
			p.stats.PoolMisses++
			p.stats.mutex.Unlock()
			return nil, fmt.Errorf("pool exhausted for version %s after %v", version, maxWaitTime)
		}

		// Wait before retrying
		time.Sleep(retryInterval)
	}
}

// ReturnContainer returns a container to the pool and marks health status
func (p *ContainerPool) ReturnContainer(container *PooledContainer, healthy bool) {
	if container == nil {
		return
	}

	container.mutex.Lock()
	container.InUse = false
	container.Healthy = healthy
	container.LastUsedAt = time.Now()

	// Check if container needs recycling
	needsRecycle := container.UseCount >= 30 || !healthy
	containerID := container.ID
	version := container.Version
	uses := container.UseCount
	container.mutex.Unlock()

	if needsRecycle {
		log.Printf("♻️  Container %s needs recycling (uses: %d, healthy: %v)",
			containerID[:12], uses, healthy)
		go p.recycleContainer(context.Background(), containerID, version)
	} else {
		log.Printf(" Returned healthy container for version %s (uses: %d)", version, uses)
	}
}

// recycleContainer removes and replaces an unhealthy or overused container
func (p *ContainerPool) recycleContainer(ctx context.Context, containerID, version string) {
	// Remove old container
	removeCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	err := p.client.ContainerRemove(removeCtx, containerID, containertypes.RemoveOptions{Force: true})
	if err != nil {
		log.Printf("  Failed to remove container %s: %v", containerID[:12], err)
	}

	// Remove from pool
	p.mutex.Lock()
	containers := p.containers[version]
	for i, c := range containers {
		if c.ID == containerID {
			p.containers[version] = append(containers[:i], containers[i+1:]...)
			break
		}
	}
	p.mutex.Unlock()

	// Create replacement container
	newContainerID, err := p.createContainer(ctx, version)
	if err != nil {
		log.Printf("  Failed to create replacement container for version %s: %v", version, err)
		return
	}

	// Add to pool
	newContainer := &PooledContainer{
		ID:         newContainerID,
		Version:    version,
		InUse:      false,
		Healthy:    true,
		CreatedAt:  time.Now(),
		LastUsedAt: time.Now(),
		UseCount:   0,
	}

	p.mutex.Lock()
	p.containers[version] = append(p.containers[version], newContainer)
	p.mutex.Unlock()

	log.Printf(" Recycled container for version %s: %s → %s",
		version, containerID[:12], newContainerID[:12])
}

// ExecuteInContainer executes Ballerina code in a pooled container with performance tracking
// Uses TWO-STEP compilation: 1) Compile with 'bal build' 2) Run compiled JAR for faster execution
func (p *ContainerPool) ExecuteInContainer(ctx context.Context, container *PooledContainer, code string) (string, error) {
	startTime := time.Now()

	// Step 1: Copy code to container
	copyStart := time.Now()
	if err := p.copyToContainer(ctx, container.ID, code); err != nil {
		return "", fmt.Errorf("failed to copy code: %w", err)
	}
	log.Printf("📁 File copy took: %v", time.Since(copyStart))

	// Step 2: Compile Ballerina package (bal build --offline)
	compileStart := time.Now()
	compileConfig := types.ExecConfig{
		User:         "ballerina",
		Cmd:          []string{"bal", "build", "--offline"},
		AttachStdout: true,
		AttachStderr: true,
		WorkingDir:   "/home/ballerina/app",
	}

	compileResp, err := p.client.ContainerExecCreate(ctx, container.ID, compileConfig)
	if err != nil {
		return "", fmt.Errorf("compile exec create failed: %w", err)
	}

	compileAttach, err := p.client.ContainerExecAttach(ctx, compileResp.ID, types.ExecStartCheck{})
	if err != nil {
		return "", fmt.Errorf("compile exec attach failed: %w", err)
	}

	var compileBuf bytes.Buffer
	var compileErrBuf bytes.Buffer
	_, err = stdcopy.StdCopy(&compileBuf, &compileErrBuf, compileAttach.Reader)
	compileAttach.Close()

	if err != nil {
		return "", fmt.Errorf("failed to read compile output: %w", err)
	}

	// Check compilation exit code
	compileInspect, err := p.client.ContainerExecInspect(ctx, compileResp.ID)
	if err == nil && compileInspect.ExitCode != 0 {
		return compileBuf.String() + compileErrBuf.String(), fmt.Errorf("compilation failed with exit code %d", compileInspect.ExitCode)
	}

	log.Printf("🔨 Compilation took: %v", time.Since(compileStart))

	// Step 3: Run the compiled JAR
	execStart := time.Now()
	execConfig := types.ExecConfig{
		User:         "ballerina",
		Cmd:          []string{"bal", "run", "target/bin/playground.jar"},
		AttachStdout: true,
		AttachStderr: true,
		WorkingDir:   "/home/ballerina/app",
	}

	execResp, err := p.client.ContainerExecCreate(ctx, container.ID, execConfig)
	if err != nil {
		return "", fmt.Errorf("exec create failed: %w", err)
	}

	attachResp, err := p.client.ContainerExecAttach(ctx, execResp.ID, types.ExecStartCheck{})
	if err != nil {
		return "", fmt.Errorf("exec attach failed: %w", err)
	}
	defer attachResp.Close()

	var outputBuf bytes.Buffer
	var errBuf bytes.Buffer
	_, err = stdcopy.StdCopy(&outputBuf, &errBuf, attachResp.Reader)
	if err != nil {
		return "", fmt.Errorf("failed to read output: %w", err)
	}

	execInspect, err := p.client.ContainerExecInspect(ctx, execResp.ID)
	if err == nil && execInspect.ExitCode != 0 {
		return outputBuf.String() + errBuf.String(), fmt.Errorf("execution failed with exit code %d", execInspect.ExitCode)
	}

	log.Printf("⚡ Execution took: %v", time.Since(execStart))

	duration := time.Since(startTime)

	// Update statistics
	p.stats.mutex.Lock()
	p.stats.TotalExecutions++
	p.stats.AvgExecutionTime = time.Duration(
		(int64(p.stats.AvgExecutionTime)*int64(p.stats.TotalExecutions-1) + int64(duration)) / int64(p.stats.TotalExecutions),
	)
	p.stats.mutex.Unlock()

	log.Printf(" Total execution time: %v using pooled container %s", duration, container.ID[:12])

	return outputBuf.String() + errBuf.String(), nil
}

// copyToContainer copies code to container using tar archive
// Creates a complete Ballerina package with Ballerina.toml for proper compilation
func (p *ContainerPool) copyToContainer(ctx context.Context, containerID, code string) error {
	var buf bytes.Buffer
	tw := tar.NewWriter(&buf)

	// Create Ballerina.toml with optimized build options
	ballerinaToml := `[package]
org = "playground"
name = "playground"
version = "0.1.0"

[build-options]
observabilityIncluded = false
offline = true
cloud = "docker"
`

	// Add Ballerina.toml to archive
	tomlHeader := &tar.Header{
		Name: "Ballerina.toml",
		Mode: 0644,
		Size: int64(len(ballerinaToml)),
	}
	if err := tw.WriteHeader(tomlHeader); err != nil {
		return fmt.Errorf("tar header write failed for Ballerina.toml: %w", err)
	}
	if _, err := tw.Write([]byte(ballerinaToml)); err != nil {
		return fmt.Errorf("tar write failed for Ballerina.toml: %w", err)
	}

	// Add main.bal to archive
	header := &tar.Header{
		Name: "main.bal",
		Mode: 0644,
		Size: int64(len(code)),
	}

	if err := tw.WriteHeader(header); err != nil {
		return fmt.Errorf("tar header write failed for main.bal: %w", err)
	}

	if _, err := tw.Write([]byte(code)); err != nil {
		return fmt.Errorf("tar write failed for main.bal: %w", err)
	}

	if err := tw.Close(); err != nil {
		return fmt.Errorf("tar close failed: %w", err)
	}

	return p.client.CopyToContainer(ctx, containerID, "/home/ballerina/app", &buf, types.CopyToContainerOptions{})
}

// healthMonitor performs periodic health checks
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

// checkHealth verifies container health and recycles if needed
func (p *ContainerPool) checkHealth(ctx context.Context) {
	p.mutex.RLock()
	defer p.mutex.RUnlock()

	for version, containers := range p.containers {
		for _, container := range containers {
			container.mutex.Lock()
			if !container.InUse && container.Healthy {
				// Quick health check using container inspect
				inspectCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
				containerJSON, err := p.client.ContainerInspect(inspectCtx, container.ID)
				cancel()

				if err != nil || !containerJSON.State.Running {
					container.Healthy = false
					container.mutex.Unlock()
					log.Printf("  Unhealthy container detected: %s (version: %s)",
						container.ID[:12], version)
					go p.recycleContainer(context.Background(), container.ID, version)
					continue
				}
			}
			container.mutex.Unlock()
		}
	}
}

// autoScaler adjusts pool sizes based on usage patterns
func (p *ContainerPool) autoScaler(ctx context.Context) {
	ticker := time.NewTicker(20 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.scale(ctx)
		}
	}
}

// scale evaluates and adjusts pool sizes
func (p *ContainerPool) scale(ctx context.Context) {
	p.mutex.Lock()
	defer p.mutex.Unlock()

	for version, containers := range p.containers {
		inUseCount := 0
		totalCount := len(containers)

		for _, container := range containers {
			container.mutex.Lock()
			if container.InUse {
				inUseCount++
			}
			container.mutex.Unlock()
		}

		utilization := float64(inUseCount) / float64(totalCount)

		// Scale up if utilization > 80% and below max
		if utilization > 0.8 && totalCount < MaxPoolSizePerVer {
			log.Printf(" High utilization for %s: %.1f%% (%d/%d) - scaling up",
				version, utilization*100, inUseCount, totalCount)

			p.mutex.Unlock()
			containerID, err := p.createContainer(ctx, version)
			p.mutex.Lock()

			if err == nil {
				newContainer := &PooledContainer{
					ID:         containerID,
					Version:    version,
					InUse:      false,
					Healthy:    true,
					CreatedAt:  time.Now(),
					LastUsedAt: time.Now(),
					UseCount:   0,
				}
				p.containers[version] = append(p.containers[version], newContainer)
				log.Printf(" Scaled up %s: %d → %d containers", version, totalCount, totalCount+1)
			}
		}

		// Scale down if utilization < 20% and above minimum
		minSize := VersionPriority[version]
		if minSize == 0 {
			minSize = DefaultPoolSize
		}

		if utilization < 0.2 && totalCount > minSize {
			log.Printf(" Low utilization for %s: %.1f%% (%d/%d) - scaling down",
				version, utilization*100, inUseCount, totalCount)

			// Find an unused healthy container to remove
			for i := len(containers) - 1; i >= 0; i-- {
				container := containers[i]
				container.mutex.Lock()
				if !container.InUse && container.Healthy {
					containerID := container.ID
					container.mutex.Unlock()

					// Remove from pool
					p.containers[version] = append(containers[:i], containers[i+1:]...)

					// Remove container in background
					go func(id string) {
						removeCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
						defer cancel()
						p.client.ContainerRemove(removeCtx, id, containertypes.RemoveOptions{Force: true})
						log.Printf(" Scaled down %s: removed container %s", version, id[:12])
					}(containerID)

					break
				}
				container.mutex.Unlock()
			}
		}
	}
}

// statsReporter prints pool statistics periodically
func (p *ContainerPool) statsReporter(ctx context.Context) {
	ticker := time.NewTicker(2 * time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.printStats()
		}
	}
}

// printStats displays detailed pool statistics
func (p *ContainerPool) printStats() {
	p.mutex.RLock()
	defer p.mutex.RUnlock()

	totalContainers := 0
	inUseContainers := 0
	healthyContainers := 0

	log.Println(" ========== Container Pool Statistics ==========")

	for version, containers := range p.containers {
		versionInUse := 0
		versionHealthy := 0

		for _, container := range containers {
			container.mutex.Lock()
			if container.InUse {
				versionInUse++
				inUseContainers++
			}
			if container.Healthy {
				versionHealthy++
				healthyContainers++
			}
			container.mutex.Unlock()
		}

		totalContainers += len(containers)
		log.Printf("  📦 %s: %d total (%d in-use, %d healthy)",
			version, len(containers), versionInUse, versionHealthy)
	}

	p.stats.mutex.Lock()
	hitRate := float64(0)
	if p.stats.PoolHits+p.stats.PoolMisses > 0 {
		hitRate = float64(p.stats.PoolHits) / float64(p.stats.PoolHits+p.stats.PoolMisses) * 100
	}

	log.Println("   Performance Metrics:")
	log.Printf("    - Total Containers: %d", totalContainers)
	log.Printf("    - In Use: %d (%.1f%%)", inUseContainers,
		float64(inUseContainers)/float64(totalContainers)*100)
	log.Printf("    - Healthy: %d (%.1f%%)", healthyContainers,
		float64(healthyContainers)/float64(totalContainers)*100)
	log.Printf("    - Total Executions: %d", p.stats.TotalExecutions)
	log.Printf("    - Pool Hits: %d", p.stats.PoolHits)
	log.Printf("    - Pool Misses: %d", p.stats.PoolMisses)
	log.Printf("    - Hit Rate: %.2f%%", hitRate)
	log.Printf("    - Avg Execution Time: %v", p.stats.AvgExecutionTime)
	p.stats.mutex.Unlock()
	log.Println("================================================")
}

// Shutdown gracefully stops the pool and cleans up containers
func (p *ContainerPool) Shutdown(ctx context.Context) error {
	log.Println(" Shutting down container pool...")

	p.mutex.Lock()
	defer p.mutex.Unlock()

	var wg sync.WaitGroup
	errorsChan := make(chan error, len(p.containers)*10)

	for version, containers := range p.containers {
		for _, container := range containers {
			wg.Add(1)
			go func(id string, ver string) {
				defer wg.Done()

				removeCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
				defer cancel()

				if err := p.client.ContainerRemove(removeCtx, id, containertypes.RemoveOptions{Force: true}); err != nil {
					errorsChan <- fmt.Errorf("failed to remove container %s (%s): %w", id[:12], ver, err)
				} else {
					log.Printf(" Removed container %s (%s)", id[:12], ver)
				}
			}(container.ID, version)
		}
	}

	// Wait for all removals to complete
	go func() {
		wg.Wait()
		close(errorsChan)
	}()

	// Collect errors
	var errors []error
	for err := range errorsChan {
		errors = append(errors, err)
	}

	if len(errors) > 0 {
		log.Printf("  Encountered %d errors during shutdown", len(errors))
		return fmt.Errorf("shutdown completed with %d errors", len(errors))
	}

	log.Println(" Container pool shutdown complete")
	return nil
}
