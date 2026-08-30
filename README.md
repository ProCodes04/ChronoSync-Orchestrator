# ChronoSync:Job Orchestrator And Distribution Of Tasks.

Hi Developers ! I built this project  experience with distributed systems and race conditions.

When we scale an application horizontally (running multiple instances of the same server), traditional background jobs or database polling mechanisms run into a major issue: "The Double Execution Problem." If two identical servers poll a database at the exact same time, they will both pick up the same pending task and process it twice.

ChronoSync solves this by using **Redis Distributed Locks** to coordinate between the servers.

## How it works

1. **The Queue:** PostgreSQL holds a table of `JobTasks` with lifecycle states (`QUEUED`, `IN_PROGRESS`, `COMPLETED`).
2. **The Workers:** Multiple instances of this Spring Boot app poll the database every 5 seconds looking for `QUEUED` jobs.
3. **The Lock:** When a job is found, all worker nodes race to Redis to execute a `SETNX` (Set if Not Exists) command using the job's ID as the key.
4. **The Result:** The first server to hit Redis gets the lock and processes the task. The other servers are locked out, realize another node is already handling it, and safely back off without corrupting the database.

## Tech Stack
* Java 25 & Spring Boot
* PostgreSQL (Persistence)
* Redis (Distributed Locking)
* Docker & Docker Compose (Infrastructure)
* HikariCP (Connection Pooling)

## Running it locally

To see the distributed lock in action, you'll need Docker Desktop installed.

**1. Start the database and cache**
`docker-compose up -d`


**2. Add your database password**
Create a `.env` file in the root of the project to inject the Postgres password:
`POSTGRES_PASSWORD=your_password_here`

**3. Start the cluster**
Boot up two separate instances of the `OrchestratorApplication`.
*Note: I've included a `.run` folder in this repo with a "Worker 2" profile that automatically overrides the second server's port to `8081` so they don't conflict.*

**4. Trigger the race condition**
With both servers running and actively polling the database, drop a new job into the queue via your terminal:
`curl -X POST http://localhost:8080/api/jobs -H "Content-Type: application/json" -d '{"taskName": "Process_4K_Video"}'`

If you watch your application logs, you'll see both servers detect the new job almost simultaneously, but only one will successfully acquire the Redis lock and execute the task!