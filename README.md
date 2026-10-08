# CodeSentinel

**Autonomous AI-powered code review agent that finds bugs, security vulnerabilities, and performance issues before they reach production.**

[![Stars](https://img.shields.io/github/stars/nezastore/codesentinel)](https://github.com/nezastore/codesentinel)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)

---

## Why CodeSentinel?

Every year, **$3.1 trillion** is lost to software bugs globally. Manual code reviews are slow, inconsistent, and often miss critical issues that slip into production.

CodeSentinel changes that. It's an autonomous code review agent that:
- Works 24/7 with consistent quality
- Catches what humans miss
- Suggests concrete fixes, not just problems
- Learns from your codebase patterns

---

## Features

### 🔍 Deep Code Analysis
- **Bug Detection**: Logic errors, null pointers, race conditions, edge cases
- **Security Scanning**: SQL injection, XSS, auth bypass, OWASP Top 10
- **Performance Analysis**: N+1 queries, memory leaks, inefficient algorithms
- **Code Quality**: DRY violations, naming conventions, missing error handling

### 🤖 AI-Powered Fix Suggestions
Not just finding issues — CodeSentinel provides concrete code patches you can apply directly.

### 🔗 GitHub Integration
- Automatic PR analysis on open/updated
- Webhook support for CI/CD pipelines
- Comment directly on pull requests

### 📊 Team Analytics
- Track common issues across your codebase
- Identify patterns in technical debt
- Measure improvement over time

---

## Quick Start

### Install

```bash
npm install -g codesentinel
```

### Analyze Code

```bash
# Analyze a single file
codesentinel analyze ./src/index.js

# Start API server
codesentinel serve
```

### API Endpoints

```bash
# Health check
curl http://localhost:8080/health

# Analyze code
curl -X POST http://localhost:8080/analyze \
  -H "Content-Type: application/json" \
  -d '{"code": "const x = null; x.foo();", "language": "javascript"}'
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 16+ |
| AI Engine | Claude API (Anthropic) |
| Integrations | GitHub API, GitLab API |
| Webhooks | GitHub, GitLab, Bitbucket |
| Deployment | Docker, Railway, Vercel |

---

## API Response Example

```json
{
  "issues": [
    {
      "severity": "CRITICAL",
      "file": "auth.js",
      "line": 42,
      "type": "security",
      "title": "SQL Injection Vulnerability",
      "description": "User input is directly concatenated into SQL query",
      "snippet": "db.query('SELECT * FROM users WHERE id = ' + userId)",
      "fix": "db.query('SELECT * FROM users WHERE id = ?', [userId])"
    }
  ],
  "summary": {
    "critical": 1,
    "high": 3,
    "medium": 5,
    "overall_score": 72
  }
}
```

---

## Roadmap

- [x] **v0.1** - Core analysis engine
- [x] **v0.5** - CLI and API server
- [ ] **v1.0** - GitHub PR integration
- [ ] **v1.5** - Auto-fix PR generation
- [ ] **v2.0** - Team dashboard, analytics

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Contact

- **GitHub**: [nezastore/codesentinel](https://github.com/nezastore/codesentinel)

---

*Built with Claude AI. Analyzed by CodeSentinel.*
