package com.chronosync.orchestrator.controller;

import com.chronosync.orchestrator.entity.JobTask;
import com.chronosync.orchestrator.repository.JobTaskRepository;
import com.chronosync.orchestrator.service.JobService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobTaskRepository jobRepository;
    private final JobService jobService;

    // Spring Inversion of Control injects both the DB proxy and our Custom Service
    public JobController(JobTaskRepository jobRepository, JobService jobService) {
        this.jobRepository = jobRepository;
        this.jobService = jobService;
    }

    // Our previous endpoint to create jobs
    @PostMapping
    public JobTask submitJob(@RequestBody JobTask incomingJob) {
        incomingJob.setStatus("QUEUED");
        return jobRepository.save(incomingJob);
    }

    // NEW ENDPOINT: Trigger the processing of a specific job
    @PostMapping("/{id}/process")
    public String processJob(@PathVariable Long id) {
        boolean success = jobService.processJobWithLock(id);

        if (success) {
            return "Job " + id + " processed successfully.\n";
        } else {
            return "HTTP 429: Too Many Requests - Job " + id + " is currently locked by another worker!\n";
        }
    }
}