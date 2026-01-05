package scheduler

import (
	"sync"
	"uptrackai/internal/monitoring/domain"
)

// WorkerPool manages a pool of concurrent workers for processing monitoring targets
type WorkerPool struct {
	workerCount int
	jobQueue    chan *domain.MonitoringTarget
	workerFunc  func(*domain.MonitoringTarget)
	wg          sync.WaitGroup
	stopChan    chan struct{}
}

// WorkerPoolConfig holds configuration for the worker pool
type WorkerPoolConfig struct {
	WorkerCount int
	BufferSize  int
}

// NewWorkerPool creates a new worker pool with the specified configuration
func NewWorkerPool(config WorkerPoolConfig, workerFunc func(*domain.MonitoringTarget)) *WorkerPool {
	return &WorkerPool{
		workerCount: config.WorkerCount,
		jobQueue:    make(chan *domain.MonitoringTarget, config.BufferSize),
		workerFunc:  workerFunc,
		stopChan:    make(chan struct{}),
	}
}

// Start launches the worker goroutines
func (wp *WorkerPool) Start() {
	for i := 0; i < wp.workerCount; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

// Stop gracefully shuts down the worker pool
func (wp *WorkerPool) Stop() {
	close(wp.stopChan)
	close(wp.jobQueue)
	wp.wg.Wait()
}

// Submit adds a target to the job queue
func (wp *WorkerPool) Submit(target *domain.MonitoringTarget) {
	select {
	case wp.jobQueue <- target:
		// Target submitted successfully
	case <-wp.stopChan:
		// Pool is stopping, don't block
	}
}

// SubmitBatch adds multiple targets to the job queue
func (wp *WorkerPool) SubmitBatch(targets []*domain.MonitoringTarget) {
	go func() {
		for _, target := range targets {
			select {
			case wp.jobQueue <- target:
				// Target submitted successfully
			case <-wp.stopChan:
				return // Pool is stopping
			}
		}
	}()
}

// GetQueueLength returns the current number of jobs in the queue
func (wp *WorkerPool) GetQueueLength() int {
	return len(wp.jobQueue)
}

// GetWorkerCount returns the number of workers
func (wp *WorkerPool) GetWorkerCount() int {
	return wp.workerCount
}

// worker is the main worker goroutine
func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()

	processedCount := 0

	for {
		select {
		case target, ok := <-wp.jobQueue:
			if !ok {
				// Channel closed, worker should exit
				return
			}

			// Process the target
			wp.workerFunc(target)
			processedCount++

		case <-wp.stopChan:
			// Stop signal received
			return
		}
	}
}
