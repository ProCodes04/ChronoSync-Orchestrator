package com.chronosync.orchestrator.scheduler;

import com.chronosync.orchestrator.entity.JobTask;
import com.chronosync.orchestrator.repository.JobTaskRepository;
import com.chronosync.orchestrator.service.JobService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class JobScheduler {

    private final JobTaskRepository jobRepository;
    private final JobService jobService;

    // Spring Inversion of Control injects our DB and Service components
    public JobScheduler(JobTaskRepository jobRepository, JobService jobService) {
        this.jobRepository = jobRepository;
        this.jobService = jobService;
    }

    // This tells Spring to allocate a background thread to run this every 5 seconds
    @Scheduled(fixedDelay = 5000)
    public void pollForJobs() {
        // 1. Ask the DB for the oldest QUEUED ticket (FIFO)
        Optional<JobTask> pendingJob = jobRepository.findFirstByStatusOrderByIdAsc("QUEUED");

        // 2. If a ticket exists, try to process it
        if (pendingJob.isPresent()) {
            Long jobId = pendingJob.get().getId();
            System.out.println("🔍 Scheduler woke up and found pending Job " + jobId + ". Attempting to process...");

            // 3. We hand it off to the Service layer which handles the Redis Locking!
            jobService.processJobWithLock(jobId);
        }
    }
}