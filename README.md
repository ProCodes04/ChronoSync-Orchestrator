# ChronoSync ⚡️

Have you ever spun up a second backend worker node and suddenly realized your background tasks are executing twice? I built ChronoSync to explore and solve exactly that problem.

## The "Double Execution" Headache
When scaling a Spring Boot application horizontally, traditional database polling gets messy. If three identical servers poll a PostgreSQL queue at the exact same millisecond, they will often fetch the same task. The result? Duplicate emails, double charges, or unpredictable race conditions.

## How I Solved It
To fix this, I introduced a **Redis Mutex Layer**.

Now, when a task lands, the workers still observe the database—but before they are allowed to process anything, they race to acquire a cryptographic lock using Redis `SETNX` (Set if Not Exists).

* **The Winner:** Grabs the lock, executes the job, and updates Postgres.
* **The Runners-Up:** See that the lock is already held and gracefully go back to sleep.

## Why the Visualizer?
Terminal logs are great, but I wanted to actually *see* the distributed architecture in action. I built a minimalist, engineering-focused React dashboard that acts as a live telemetry monitor for the worker fleet.

## The Stack
* **Backend:** Java 25, Spring Boot
* **Locking & Data:** Redis, PostgreSQL, Docker
* **Frontend:** React, Tailwind CSS, Framer Motion

## Run it Yourself
If you want to spin up the fleet and watch them race for the lock:

1. Start the database and cache: `docker-compose up -d`
2. Boot the Java worker nodes: `./mvnw spring-boot:run`
3. Launch the telemetry UI: `cd frontend && npm install && npm run dev`