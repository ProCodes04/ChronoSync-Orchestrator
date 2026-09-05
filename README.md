# Chronosync 
CS

A horizontally scaled background job orchestrator that solves the "double execution" race condition using Redis distributed locks.


##  The Problem
When scaling worker nodes horizontally, traditional database polling breaks down. If multiple identical servers poll a PostgreSQL queue at the exact same millisecond, they will often fetch the same task and execute it simultaneously.

##  The Solution
ChronoSync introduces a **Redis Mutex Layer**. Multiple Spring Boot worker nodes safely poll the database, but before processing, they race to acquire a cryptographic lock using Redis `SETNX`.
* **Atomic Guarantees:** Exactly one worker acquires the lock.
* **Graceful Backoff:** Losing nodes immediately return to a sleep state.
* **Durable State:** PostgreSQL tracks the lifecycle (`PENDING` → `PROCESSING` → `COMPLETE`).

##  Tech Stack
* **Backend:** Java 25, Spring Boot
* **Infrastructure:** Redis (Distributed Lock), PostgreSQL (Task Queue), Docker
* **Frontend:** React, Tailwind CSS, Framer Motion (Real-time Simulation)

