---
title: Platform Overview
description: Architecture and key concepts of the Wireclaw autonomous agent platform.
category: Platform
order: 1
---

# Platform Overview

Wireclaw is an autonomous AI agent platform. You configure agents through a web interface — the platform handles deployment, orchestration, message routing, and persistent state.

## Core Concepts

### Agents

An agent is the central unit. Each agent has:

- **Model** — the LLM powering its reasoning (Claude, GPT, Gemini, DeepSeek, Llama, Mistral, Grok, etc.)
- **Instructions** — system prompts that define personality, goals, and constraints
- **Tools** — capabilities like web search, browser automation, HTTP requests, and file I/O
- **Channels** — messaging platforms where the agent communicates (Telegram, Discord, Slack, and more)
- **Memory** — persistent state that carries across sessions

Agents are autonomous. They don't just respond to prompts — they reason, use tools, and take actions without human intervention.

### Channels

Channels are the communication endpoints. A single agent can be connected to multiple channels simultaneously. Supported channels include:

- Telegram
- Discord
- Slack
- Web chat
- And more

Messages from any channel are routed to the same agent, which maintains a unified memory across all of them.

### Workspaces

Every agent has a persistent workspace — a filesystem that survives across sessions. The workspace contains:

- **Configuration** — model settings, tool permissions, provider routing
- **Instructions** — the agent's personality and behavioral guidelines
- **Memory** — structured and unstructured memory files
- **State** — runtime state from previous sessions

When an agent wakes up, its workspace is restored. When it goes idle, the workspace is saved. This means agents remember everything from previous conversations.

### Sessions

A session is one continuous run of an agent. Sessions start when a message arrives and the agent wakes up. They end when the agent has been idle for a configurable timeout.

During a session, the agent:

1. Receives messages from connected channels
2. Reasons about the message using its LLM
3. Executes tools as needed
4. Sends responses back through the originating channel
5. Updates its memory and workspace state

### Model Routing

Wireclaw is model-agnostic. You choose the model for each agent, and the platform routes LLM requests through an internal router that supports all major providers. You send the bare model ID (e.g., `claude-sonnet-4-6`, `gemini-2.5-flash`) — the router resolves the provider at runtime.

## Pay-as-You-Go

There are no subscriptions. You pay only for what your agents use:

- **$0/month** base cost
- **$2 welcome bonus** for new accounts
- Usage-based billing for LLM calls, tool execution, and compute time
- All features included — unlimited agents, channels, models, and tools
