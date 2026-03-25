---
title: "How We Handle Agent Lifecycle: Wake, Run, Dehydrate"
description: "A deep dive into Wireclaw's wake-on-demand architecture — how agents wake in seconds, run autonomously, and persist their entire workspace to S3 on idle."
date: 2026-03-25
author: Wireclaw Team
tags: [engineering, architecture, lifecycle, workspace]
series: under-the-hood
---

# How We Handle Agent Lifecycle: Wake, Run, Dehydrate

Running one AI agent is easy. Running a hundred — each with persistent memory, tool access, and multi-channel presence — without burning money on idle compute is an infrastructure problem that most teams solve by not solving it.

We built a lifecycle system that makes agents free when they're not working and fully operational within seconds when they are. Here's how it works.

## The Problem

Autonomous AI agents aren't request-response services. They maintain state: memory, files, configurations, conversation history. A research agent accumulates a knowledge base. A support agent builds a database of resolved issues. A monitoring agent keeps logs of every anomaly it's flagged.

This state needs to survive across sessions, restarts, and deploys. But keeping agents always-on — even when no one is talking to them — is wasteful. A typical agent might be active for 5 minutes out of every hour. The other 55 minutes, it's doing nothing, consuming compute.

The naive solutions don't work well:

- **Always-on containers** — you pay for 100% uptime, your agent uses 8%. Multiply by 50 agents and it gets expensive fast.
- **Serverless functions** — fast to start, but stateless. Your agent forgets everything between invocations. Bolting on external state management defeats the purpose.
- **Container hibernation** — save the container image, restore on demand. Slow (minutes, not seconds), fragile across host migrations, and cloud providers don't support it well.

We needed something different: agents that wake in seconds, run with their full context restored, and go dormant without losing a byte of state.

## How Others Do It

Most agent platforms fall into two camps.

**Camp 1: Always-on.** The agent runs as a long-lived process. Memory is in-process (SQLite, Redis, in-memory vectors). When the process dies, you hope your persistence layer captured everything. Scaling means more always-on processes.

**Camp 2: Stateless with external stores.** The agent is a function. State lives in a database. On each invocation, the function queries the database, reconstructs context, processes the message, writes state back. This works for simple chatbots but falls apart for autonomous agents that maintain complex workspace state — files, configs, evolving instructions, tool outputs.

Neither camp handles the fundamental tension: agents need rich, persistent workspace state AND cost-efficient scaling.

## Our Approach

Wireclaw uses a three-phase lifecycle: **wake**, **run**, **dehydrate**.

The key insight is treating the agent's entire workspace — not just a database row, but the full filesystem including config, memory, files, and runtime state — as a portable archive.

### Architecture Overview

```
┌─────────┐     webhook     ┌─────────┐     Redis      ┌──────────┐
│ Telegram │ ──────────────► │   IEG   │ ─────────────► │ Sidecar  │
│ Discord  │                 │ Gateway │   wake signal  │ (claims  │
│ Slack    │                 └─────────┘                │  session) │
└─────────┘                                             └────┬─────┘
                                                             │
                                              hydrate ▼      │ S3
                                             ┌───────────────┐
                                             │  Workspace    │
                                             │  config.toml  │
                                             │  AGENTS.md    │
                                             │  MEMORY.md    │
                                             │  files/       │
                                             └───────┬───────┘
                                                     │
                                              launch ▼
                                             ┌───────────────┐
                                             │   RayCore     │
                                             │  (agent loop) │
                                             └───────────────┘
```

Five components, all stateless. State lives in two places: Redis (ephemeral session coordination) and S3 (persistent workspace archives).

### Phase 1: Wake

A message arrives at one of the connected channels. The Incoming Event Gateway (IEG) receives the webhook and does two things atomically via a Redis Lua script:

1. Pushes the event to the user's queue: `{tenantID}:queue`
2. Checks for an active session (`{userID}:session:status`). If none exists, pushes a wake signal to `queue:global_pool`

```
IEG receives webhook
  → Redis Lua: LPUSH event to user queue
  → Redis Lua: check session key
    → session exists? → done (hot path, agent already running)
    → no session? → LPUSH wake to global_pool (cold path)
```

The wake signal is a JSON payload containing the user ID and any environment variables the agent needs.

A pool of Sidecar processes sits idle, each running `BRPOP` on the global pool queue. When a wake signal arrives, the first available Sidecar picks it up.

### Phase 2: Hydrate and Run

The Sidecar that claimed the wake task does the following:

**1. Claim the session.** Attempts `SET NX` on `{userID}:session:status` with a 60-second TTL. This is a distributed lock — only one Sidecar can own a session at a time. If the claim fails (another Sidecar got there first), it goes back to waiting.

**2. Hydrate the workspace.** Downloads `workspace_{userID}.tar.gz` from S3 and extracts it to `/workspace` using streaming decompression — no intermediate files on disk.

The workspace contains everything the agent needs:

```
/workspace/
├── config.toml          # Agent configuration (model, tools, channels)
├── AGENTS.md            # System instructions
├── SOUL.md              # Personality and behavioral rules
├── MEMORY.md            # Persistent memory (if using Markdown backend)
├── memory/              # Memory directory (daily logs, structured data)
└── state/               # Runtime state (costs.jsonl, tool outputs)
```

**3. Launch the agent.** Sidecar starts the RayCore process with the hydrated workspace mounted. RayCore loads `config.toml`, resolves the model via Sulaert router, connects to configured channels, and enters the autonomous agent loop: read messages → reason → select tools → execute → respond.

**4. Maintain the session.** Sidecar runs a heartbeat on the Redis session key, extending the TTL every few seconds. If the heartbeat fails (Redis issue, network partition), Sidecar initiates a graceful shutdown — preventing split-brain scenarios where two Sidecars think they own the same session.

### Phase 3: Dehydrate

When the agent has been idle for the configured timeout (default: 15 minutes), or when the pod receives a `SIGTERM` (Kubernetes preemption, scale-down):

**1. Stop the agent.** Sidecar sends `SIGTERM` to the RayCore process. RayCore finishes any in-progress tool execution and exits cleanly.

**2. Restore channel webhooks.** If the agent was using Telegram in daemon mode (polling via `getUpdates`), Sidecar calls `setWebhook` to point back to the IEG gateway. This ensures messages arriving after shutdown are routed correctly.

**3. Dehydrate the workspace.** The entire `/workspace` directory — including any new files the agent created, updated memory, modified configs — is compressed and uploaded to S3 as `workspace_{userID}.tar.gz`. This uses streaming compression with a background context and bounded timeout, ensuring the upload completes even after SIGTERM cancels the parent context.

**4. Release the session.** Delete `{userID}:session:status` from Redis. The Sidecar goes back to the pool, ready for the next wake.

```
idle timeout or SIGTERM
  → SIGTERM to RayCore
  → restore channel webhooks
  → tar+gzip /workspace → S3 PutObject (streaming, background context)
  → DELETE session key from Redis
  → Sidecar returns to pool
```

## Trade-offs

Every architecture decision has costs. Here's what we gained and what we paid.

**Cold start latency vs. cost efficiency.** Agents aren't instant-on. The cold path (no active session) takes a few seconds: Sidecar claims session, downloads workspace from S3, extracts, launches RayCore. For a typical workspace (~5-10 MB compressed), this is 2-4 seconds. Compare this to always-on (zero latency) — we traded a few seconds of cold start for the ability to run 100 agents for the cost of the ones actually working.

**Full archive vs. incremental sync.** We upload and download the entire workspace on every cycle. An incremental sync (only changed files) would be faster for large workspaces but adds significant complexity: file diffing, conflict resolution, partial failure recovery. For typical agent workspaces (single-digit megabytes), the full-archive approach is fast enough and dramatically simpler. If workspace sizes grow, incremental sync is a future optimization.

**One workspace per user vs. per instance.** Currently, all agent instances for a user share the same workspace. This simplifies the lifecycle (one S3 key per user) but means agents can see each other's files. Per-instance workspaces would provide better isolation but multiply storage and lifecycle complexity. We're evaluating this trade-off as multi-agent use cases grow.

**Stateless components vs. operational simplicity.** Every component (Gate, IEG, Sidecar) is stateless. No leader election, no consensus, no state replication. A crashed component restarts with zero recovery time. The price: coordination happens through Redis, adding a dependency. But Redis is well-understood, and our usage pattern (simple key-value operations, Lua scripts) keeps it reliable.

## Results

The lifecycle system is running in production. Here's what we're seeing:

- **Cold start:** 2-4 seconds for typical workspaces (5-10 MB compressed)
- **Hot path:** Sub-second — message goes directly to the running agent, no wake needed
- **Dehydration:** 1-2 seconds for workspace upload
- **Cost efficiency:** Agents consume compute only when active. 100 idle agents = 0 additional cost
- **Reliability:** Stateless components restart cleanly. Workspace persistence survives pod migrations, restarts, and deploys. Heartbeat-based session management prevents split-brain
- **Memory preservation:** Workspace survives across sessions. An agent's MEMORY.md from last week is fully intact when it wakes today

## What's Next

We're working on reducing cold start latency further through event-driven pod pre-warming — predicting when an agent is likely to receive a message and hydrating the workspace proactively. The goal is sub-second cold starts without sacrificing the cost efficiency of wake-on-demand.

We're also exploring per-instance workspaces with deduplication, so multiple agents for the same user can have isolated state without multiplying storage costs.

---

Want to see the lifecycle in action? [Deploy your first agent](/blog/deploy-telegram-research-agent) — it takes under 5 minutes. Or read about [Sulaert: routing LLM requests across 10+ providers](/blog) for another look under the hood.
