package com.chronosync.orchestrator.service;

import com.chronosync.orchestrator.entity.JobTask;
import com.chronosync.orchestrator.repository.JobTaskRepository;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Optional;

@Service
public class JobService {

    private final JobTaskRepository jobRepository;
    private final StringRedisTemplate redisTemplate;

    public JobService(JobTaskRepository jobRepository, StringRedisTemplate redisTemplate) {
        this.jobRepository = jobRepository;
        this.redisTemplate = redisTemplate;
    }

    // @Transactional ensures all database saves in this method succeed or fail together (Atomicity)
    @Transactional
    public boolean processJobWithLock(Long jobId) {
        String lockKey = "lock:job:" + jobId;
        Boolean lockAcquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, "LOCKED", Duration.ofSeconds(60));

        if (Boolean.FALSE.equals(lockAcquired)) {
            return false;
        }

        try {
            System.out.println("✅ Lock acquired! Fetching Job " + jobId + " from DB...");

            // 1. Read the ticket from the PostgreSQL rail
            Optional<JobTask> optionalJob = jobRepository.findById(jobId);
            if (optionalJob.isEmpty()) {
                System.out.println("❌ Job " + jobId + " does not exist in DB!");
                return false;
            }

            JobTask job = optionalJob.get();

            // 2. Update state to IN_PROGRESS
            job.setStatus("IN_PROGRESS");
            jobRepository.save(job);
            System.out.println("⏳ Job " + jobId + " marked as IN_PROGRESS. Simulating work...");

            // 3. Simulate processing
            Thread.sleep(5000);

            // 4. Update state to COMPLETED
            job.setStatus("COMPLETED");
            jobRepository.save(job);
            System.out.println("🎉 Job " + jobId + " marked as COMPLETED!");

            return true;

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return false;
        } finally {
            redisTemplate.delete(lockKey);
        }
    }
}