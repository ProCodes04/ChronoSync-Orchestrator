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

    public JobScheduler(JobTaskRepository jobRepository, JobService jobService) {
        this.jobRepository = jobRepository;
        this.jobService = jobService;
    }
    @Scheduled(fixedDelay = 5000)
    public void pollForJobs() {

        Optional<JobTask> pendingJob = jobRepository.findFirstByStatusOrderByIdAsc("QUEUED");

        if (pendingJob.isPresent()) {
            Long jobId = pendingJob.get().getId();
            System.out.println("🔍 Scheduler woke up and found pending Job " + jobId + ". Attempting to process...");

            jobService.processJobWithLock(jobId);
        }
    }
}
