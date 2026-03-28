---
title: "Deploy a Telegram Research Agent in 5 Minutes"
description: "Step-by-step guide to deploying an autonomous AI research agent on Telegram with web search, browser access, and persistent memory."
date: 2026-03-25
author: Wireclaw Team
tags: [tutorial, telegram, research-agent, deploy]
series: build-this
---

# Deploy a Telegram Research Agent in 5 Minutes

By the end of this tutorial, you'll have an autonomous AI agent running on Telegram that searches the web, reads articles, remembers your past conversations, and synthesizes research — all without you managing a single server.

This tutorial works for anyone — solopreneurs who want a research assistant that works 24/7, indie hackers adding AI to a side project, or developers prototyping an agent-powered product.

## Prerequisites

- A [Wireclaw account](https://app.wireclaw.ai) (free, no credit card)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)
- Your Telegram user ID (get it from [@userinfobot](https://t.me/userinfobot))

## Step 1: Configure Your Agent

Log into the Wireclaw dashboard and create a new Agent Config. Name it something like `research-assistant`.

**Model:** Pick `claude-sonnet-4-5` from the dropdown. You can switch to GPT, Gemini, or any other model later — one config change, no code rewrites.

**AGENTS.md** — this is where you define what your agent does. Open the AGENTS.md tab and paste:

```markdown
# Research Assistant

You are a research assistant deployed on Telegram. When a user asks a question:

1. Search the web for relevant, recent information
2. Open and read the most promising results
3. Cross-reference claims across multiple sources
4. Synthesize findings into a clear, structured answer
5. Always cite your sources with links

## Rules

- Prefer primary sources (papers, official docs, announcements) over blog summaries
- If information is uncertain or conflicting, say so explicitly
- Keep answers under 400 words unless the user asks for more
- When the user says "remember this" — store the information for future sessions
- Use your memory to build context over time: user preferences, past research, recurring topics

## Response Format

Use short paragraphs. Bold key findings. Include source links inline.
When summarizing multiple sources, use a numbered list.
```

**Tools:** In the dashboard, open the **Tools** tab and enable **Web Search**, **Browser (Playwright)**, and **Memory (Markdown)**.

The agent gets web search for finding information, web fetch for reading full pages, and Playwright for navigating JavaScript-heavy sites. Memory is set to markdown — human-readable logs stored in `MEMORY.md` that persist across sessions.

Under the hood, the platform generates this configuration (you never edit this directly):

```toml
default_model = "claude-sonnet-4-5"

[memory]
backend = "markdown"

[tools]
web_search = true
web_fetch = true

[browser]
enabled = true
backend = "playwright"
```

## Step 2: Connect Telegram

Create a new **Channel** in the dashboard:

- **Type:** Telegram
- **Bot token:** Paste the token from BotFather
- **Allowed users:** Your Telegram user ID (restricts who can talk to the agent)

What the platform generates:

```toml
[channels.telegram]
bot_token = "7123456789:AAH..."
allowed_users = ["198234567"]
```

Now create an **Agent Instance** — this links your config to the channel. Select your `research-assistant` config and the Telegram channel you just created.

## Step 3: Deploy and Test

Hit **Deploy**. Behind the scenes, Wireclaw packages your config, instructions, and tools into a workspace archive, uploads it to S3, and registers the Telegram webhook. Your agent is live.

Open Telegram. Send your bot a message:

```
What are the latest developments in MCP (Model Context Protocol)?
```

The agent wakes up, hydrates its workspace, searches the web, reads the top results, and sends back a synthesized answer with sources — all within seconds.

Try a follow-up:

```
Compare MCP to traditional plugin systems for AI agents
```

The agent remembers the context from your first question. No re-explaining needed.

Now test memory persistence. Send:

```
Remember: I'm building a customer support agent and I'm evaluating MCP for tool integration
```

Close the chat. Come back hours later and ask:

```
What was I working on?
```

The agent recalls your project context from the previous session. Its workspace was dehydrated to S3 when it went idle and fully restored when you sent the new message — memory, files, and all.

## Step 4: Extend It

**Add a second channel.** Create a Discord channel, link it to the same agent instance. Now your research assistant is available on both Telegram and Discord, sharing the same memory and context.

**Explore MCP tools.** Connect custom MCP servers to give your agent access to databases, internal APIs, or specialized tools. Add them in the dashboard and redeploy. The agent picks up the new tools automatically.

**Set cost limits.** In the Cost tab, set a daily limit — say $1/day. The agent stops responding when it hits the cap. No surprise bills.

## What's Next

- [Build a Discord support agent with docs search](/blog/build-discord-support-bot) — the next Build This tutorial
- [How we handle agent lifecycle](/blog/agent-lifecycle-wake-run-dehydrate) — the engineering behind wake, run, and dehydrate

Deploy your first agent at [app.wireclaw.ai](https://app.wireclaw.ai). It takes less than 5 minutes.
