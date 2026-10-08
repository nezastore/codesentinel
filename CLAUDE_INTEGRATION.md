# CodeSentinel x Claude AI

## How CodeSentinel Uses Claude

CodeSentinel is built on Claude API — and this document explains exactly how.

### Architecture

```
User Code → CodeSentinel → Claude API → Structured Analysis → Developer
                     ↑
              System Prompt:
              "You are CodeSentinel,
               expert code reviewer..."
```

### Claude API Usage

**Model**: `claude-3-5-sonnet` (via OpenRouter)
**Max Tokens**: 4096
**Temperature**: 0.3 (focused, deterministic output)

### System Prompt Engineering

CodeSentinel's power comes from a carefully crafted system prompt that:

1. Defines role as expert code reviewer
2. Specifies 5 analysis categories (bugs, security, performance, quality, best practices)
3. Requires structured JSON output
4. Demands specific severity levels (CRITICAL/HIGH/MEDIUM/LOW/INFO)
5. Requires concrete code snippets and fixes

### Example Analysis

**Input Code:**
```javascript
const query = 'SELECT * FROM users WHERE id = ' + userId;
db.query(query);
```

**Claude's Response:**
```json
{
  "issues": [{
    "severity": "CRITICAL",
    "type": "security",
    "title": "SQL Injection Vulnerability",
    "description": "User input directly concatenated into SQL query",
    "snippet": "'SELECT * FROM users WHERE id = ' + userId",
    "fix": "db.query('SELECT * FROM users WHERE id = ?', [userId])"
  }]
}
```

### Why Claude?

| Requirement | Why Claude Wins |
|------------|----------------|
| Code understanding | Best-in-class reasoning |
| Security analysis | Strong threat modeling |
| Multi-language | 95+ languages supported |
| Structured output | Reliable JSON generation |
| Context window | 200K tokens for large files |

### Integration Points

1. **OpenRouter** - Primary API access
2. **Direct Claude API** - For production scaling
3. **Anthropic SDK** - Future enterprise features

### Usage Metrics

- Average analysis: 2-5 seconds
- Tokens per analysis: ~500 input + ~2000 output
- Cost per review: ~$0.01 (via OpenRouter)

---

## For Anthropic

We're building with Claude because:
- Best code understanding in the industry
- Reliable structured output for analysis results
- Cost-effective via OpenRouter

** We'd love to join the Claude Startup program to:**
1. Get dedicated API credits for development
2. Access Anthropic support for fine-tuning our analysis prompts
3. Be part of the Claude developer ecosystem
4. Potentially become a featured integration

---

*Built with Claude AI*
