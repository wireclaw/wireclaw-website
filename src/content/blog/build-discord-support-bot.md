---
title: "Build a Discord Support Agent with Docs Search"
description: "Deploy an AI support agent on Discord that searches your documentation, remembers past issues, and learns which answers work — using MCP and persistent memory."
date: 2026-03-25
author: Wireclaw Team
tags: [tutorial, discord, support-agent, mcp]
series: build-this
---

# Build a Discord Support Agent with Docs Search

By the end of this tutorial, you'll have a support agent running on Discord that searches your documentation to answer questions, remembers past issues, and builds a knowledge base over time — no scripted flows, no decision trees, just an autonomous agent with access to your docs.

If you're a freelancer, this is the kind of agent you can deploy for clients — each client gets their own support agent with isolated memory and per-client cost controls.

## Prerequisites

- A [Wireclaw account](https://app.wireclaw.ai) (free, no credit card)
- A Discord bot token (from the [Discord Developer Portal](https://discord.com/developers/applications))
- Your Discord server (guild) ID
- Documentation hosted somewhere accessible (a public docs site, GitHub pages, etc.)

### Create a Discord Bot

1. Go to the Discord Developer Portal → New Application
2. Navigate to Bot → Reset Token → copy the token
3. Under Privileged Gateway Intents, enable **Message Content Intent**
4. Generate an invite link: Bot → OAuth2 URL Generator → select `bot` scope with `Send Messages` and `Read Message History` permissions
5. Invite the bot to your server using the generated URL

## Step 1: Configure Your Agent

Create a new Agent Config in the Wireclaw dashboard. Name it `support-agent`.

**Model:** Select `claude-sonnet-4-5`. For high-volume support, you might later switch to `gemini-2.5-flash` for lower per-token cost — one dropdown change, no code changes.

**AGENTS.md:**

```markdown
# Support Agent

You are a support agent for our product. Your job is to help users with questions
by searching the documentation and providing accurate, actionable answers.

## How to Answer

1. When a user asks a question, search the documentation first
2. If the docs contain the answer, provide it with a link to the relevant page
3. If the docs don't cover it, say so honestly — don't make things up
4. For common issues you've seen before, check your memory first

## Memory Protocol

- After resolving an issue, store a summary: the question, the solution, and whether
  the user confirmed it worked
- When you see a similar question, recall past resolutions before searching docs
- Track patterns: if the same question comes up 3+ times, note it as a documentation gap

## Response Style

- Direct and concise — users want answers, not essays
- Include code snippets when relevant
- Always link to the docs page where you found the answer
- If a question requires multiple steps, use a numbered list

## Escalation

If you can't find an answer after searching docs and memory:
- Say "I couldn't find this in the docs. Let me flag this for the team."
- Store the unanswered question in memory for review
```

## Step 2: Add MCP Server for Docs Search

This is where it gets interesting. Instead of pre-indexing your docs into a vector database, we'll give the agent a Playwright browser via MCP — it can navigate your docs site, search, and read pages on demand.

In the Wireclaw dashboard, go to **MCP Servers** → **Create New**:

- **Name:** `docs-browser`
- **Code:** `docs-browser` (unique identifier)
- **Configuration:**

```json
{
  "command": "npx",
  "args": ["-y", "@anthropic-ai/mcp-playwright"],
  "transport": "stdio"
}
```

This spins up a Playwright MCP server that gives your agent full browser capabilities — navigate, click, fill search fields, extract text.

Now link the MCP server to your agent config. In the Agent Config page, add `docs-browser` to the MCP Servers section.

Update the **AGENTS.md** to tell the agent where to search:

```markdown
## Documentation Access

Your primary documentation source is https://docs.example.com

When searching for answers:
1. Navigate to the docs site
2. Use the search function if available
3. Browse relevant sections based on the question topic
4. Read the full page content before answering

Sections to check first:
- /quickstart — setup and getting started issues
- /guides — how-to questions
- /reference — API and config questions
- /troubleshooting — error messages and common problems
```

The agent now has a live connection to your docs. When a user asks about configuration syntax, the agent opens your docs site, searches for the relevant page, reads it, and formulates an answer — all autonomously.

## Step 3: Connect Discord and Deploy

Create a new **Channel** in the dashboard:

- **Type:** Discord
- **Bot token:** Paste your Discord bot token
- **Guild ID:** Your Discord server ID

What the platform generates:

```toml
[channels.discord]
bot_token = "MTIz..."
guild_id = "987654321098765432"
```

Create an **Agent Instance** linking your `support-agent` config to the Discord channel.

Configure **memory** for persistent knowledge. In the dashboard, select **Lucid** as the memory backend in the **Memory** tab.

The `lucid` backend combines SQLite (structured queries) with Markdown (human-readable logs). The agent gets both fast retrieval and a readable history of everything it has learned.

Under the hood, the platform generates this configuration (you never edit this directly):

```toml
default_model = "claude-sonnet-4-5"

[memory]
backend = "lucid"
```

Hit **Deploy**. Your support agent is live on Discord.

Test it in your server:

```
@support-agent How do I configure environment variables?
```

The agent searches your docs, finds the relevant page, and responds with the answer and a direct link. Ask a follow-up:

```
@support-agent What's the difference between env vars set in config vs. the dashboard?
```

It remembers the context and gives a focused comparison.

## Step 4: Extend It

**Build a knowledge base automatically.** After a few days of answering questions, check the agent's workspace — its `MEMORY.md` and `memory/` directory will contain a structured log of every question, answer, and resolution. This is a living FAQ that grows organically.

**Add a second channel.** Create a Telegram channel and link it to the same agent instance. Now your support agent handles questions from both Discord and Telegram, sharing the same docs access and memory. A user can start a conversation on Discord and reference it from Telegram — the agent remembers across channels.

**Monitor documentation gaps.** The agent's memory tracks unanswered questions — topics your docs don't cover. Review these periodically to prioritize what to document next.

**Set up swarms.** For high-volume support, create multiple agent instances linked to the same Discord channel — each with its own personality or area of expertise. One agent handles setup questions, another handles API issues, a third handles billing. They share the same channel but respond to different types of questions based on their AGENTS.md instructions.

## What's Next

- [Deploy a Telegram research agent in 5 minutes](/blog/deploy-telegram-research-agent) — if you missed the first Build This
- [Give your agent a browser: Playwright MCP](/blog) — deep dive into MCP tool integration (Toolbox series)

Start building at [app.wireclaw.ai](https://app.wireclaw.ai). Your support agent deploys in minutes.
