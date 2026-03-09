---
name: tavily-search
description: "Search the web using Tavily Search API. Use when: user wants to search for information, news, or research topics. Returns structured results with title, URL, and content snippets. Requires Tavily API key. NOT for: local file searches or database queries."
emoji: 🔍
requires:
  env:
    - TAVILY_API_KEY
  bins:
    - curl
---

# Tavily Search Skill

Search the web using Tavily's search API for fast, relevant results.

## When to Use

✅ **USE this skill when:**

- User wants to search for information on the web
- User asks about recent news or current events
- User needs research on a topic
- User wants to find specific websites or resources

❌ **DON'T use this skill when:**

- User wants to search local files or code
- User asks about weather (use weather skill)

## Tavily API Setup

The Tavily API key must be set as an environment variable:

```bash
export TAVILY_API_KEY="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"
```

In OpenClaw, you can set this in your startup script or config.

## Usage

### Basic Search

```bash
curl -s "https://api.tavily.com/search?api_key=$TAVILY_API_KEY&q=your+search+query"
```

### Advanced Search

```bash
curl -s "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"$TAVILY_API_KEY\",
    \"query\": \"your search query\",
    \"search_depth\": \"basic\",
    \"max_results\": 5
  }"
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| q | string | Search query (required) |
| api_key | string | Your Tavily API key (required) |
| search_depth | string | "basic" or "advanced" |
| max_results | number | Number of results (1-10) |
| include_answer | boolean | Include AI answer |
| include_raw_content | boolean | Include raw content |
| include_images | boolean | Include images |

## Example: Search for OpenClaw

```bash
curl -s "https://api.tavily.com/search?api_key=$TAVILY_API_KEY&q=openclaw%20ai%20agent&max_results=3" | jq '.results[] | {title, url, content}'
```

## Response Format

The API returns JSON with:

- `results`: Array of search results
- `answer`: AI-generated answer (if requested)
- `images`: Related images (if requested)

Each result contains:
- `title`: Page title
- `url`: Page URL  
- `content`: Relevant snippet
- `score`: Relevance score (0-1)

## Quick Examples

**Search for news:**
```bash
curl -s "https://api.tavily.com/search?api_key=$TAVILY_API_KEY&q=latest+ai+news&max_results=5"
```

**Research a topic:**
```bash
curl -s "https://api.tavily.com/search?api_key=$TAVILY_API_KEY&q=python%20async%20programming&search_depth=advanced&max_results=10"
```

## Notes

- Tavily provides 1000 free queries/month on the free tier
- Results are ranked by relevance score
- The API supports both basic and advanced search modes
- Advanced mode uses AI to provide more comprehensive results
