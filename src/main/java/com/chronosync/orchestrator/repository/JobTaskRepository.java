package com.chronosync.orchestrator.repository;

import com.chronosync.orchestrator.entity.JobTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface JobTaskRepository extends JpaRepository<JobTask, Long> {

    Optional<JobTask> findFirstByStatusOrderByIdAsc(String status);
}
