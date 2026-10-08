#!/usr/bin/env node
/**
 * CodeSentinel - Autonomous Code Review Agent
 * Uses Claude API to analyze code, find bugs, security issues, and suggest fixes
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ─── Config ────────────────────────────────────────────────────────────────
const CONFIG = {
  apiEndpoint: process.env.CLAUDE_API_URL || 'https://ai.databyte.co.id/v1/chat/completions',
  apiKey: process.env.CLAUDE_API_KEY || '',
  model: 'databyte-m1',
  port: parseInt(process.env.PORT || '8080'),
  maxTokens: 4096,
  temperature: 0.3,
};

// ─── Prompts ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are CodeSentinel, an expert autonomous code reviewer. You analyze code for:

1. **Bugs**: Logic errors, null pointer issues, race conditions, edge cases
2. **Security**: SQL injection, XSS, auth bypass, sensitive data exposure, insecure deserialization
3. **Performance**: N+1 queries, memory leaks, inefficient algorithms, unnecessary computations
4. **Code Quality**: DRY violations, naming conventions, missing error handling, poor abstractions
5. **Best Practices**: Type safety, testing gaps, documentation, API design

For each issue found, provide:
- Severity: CRITICAL / HIGH / MEDIUM / LOW / INFO
- File & line number
- Description of the issue
- Code snippet showing the problem
- Suggested fix with corrected code

Format your response as valid JSON:
{
  "issues": [
    {
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "file": "path/to/file.js",
      "line": 42,
      "type": "bug|security|performance|quality|practice",
      "title": "Brief issue title",
      "description": "Detailed explanation",
      "snippet": "problematic code",
      "fix": "corrected code"
    }
  ],
  "summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 0,
    "info": 0,
    "overall_score": 0-100
  },
  "recommendations": ["priority action items"]
}`;

// ─── API Client ──────────────────────────────────────────────────────────
function callClaudeAPI(messages, model = CONFIG.model) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: CONFIG.maxTokens,
      temperature: CONFIG.temperature,
      stream: false,
    });

    const url = new URL(CONFIG.apiEndpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.apiKey}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = (url.protocol === 'https:' ? https : http).request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) reject(new Error(json.error.message || 'API Error'));
          else resolve(json);
        } catch (e) {
          reject(new Error(`Parse error: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ─── Code Analysis ─────────────────────────────────────────────────────────
async function analyzeCode(code, language = 'javascript', filename = 'unknown') {
  const language_hints = {
    javascript: 'JavaScript/Node.js',
    typescript: 'TypeScript',
    python: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust',
    php: 'PHP',
    ruby: 'Ruby',
    default: language,
  };

  const userPrompt = `Analyze this ${language_hints[language] || language} code and identify all issues:

Filename: ${filename}
\`\`\`${language}
${code}
\`\`\`

Provide a thorough analysis in JSON format.`;

  try {
    const response = await callClaudeAPI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ]);

    const content = response.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // If no JSON, return raw analysis
    return {
      issues: [],
      raw_analysis: content,
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, overall_score: 50 },
      recommendations: ['Unable to parse structured response']
    };
  } catch (error) {
    return {
      issues: [],
      error: error.message,
      summary: { critical: 0, high: 0, medium: 0, low: 0, info: 0, overall_score: 0 },
      recommendations: [`Error: ${error.message}`]
    };
  }
}

// ─── GitHub Integration ────────────────────────────────────────────────────
async function fetchGitHubPR(owner, repo, prNumber, githubToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls/${prNumber}`,
      headers: {
        'User-Agent': 'CodeSentinel/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(githubToken && { 'Authorization': `token ${githubToken}` }),
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function fetchPRFiles(owner, repo, prNumber, githubToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      headers: {
        'User-Agent': 'CodeSentinel/1.0',
        'Accept': 'application/vnd.github.v3+json',
        ...(githubToken && { 'Authorization': `token ${githubToken}` }),
      },
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// ─── HTTP Server ──────────────────────────────────────────────────────────
function createServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${CONFIG.port}`);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    try {
      // Health check
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // Analyze endpoint
      if (url.pathname === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const { code, language, filename } = JSON.parse(body);
          
          if (!code) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Missing code parameter' }));
            return;
          }

          const result = await analyzeCode(code, language || 'javascript', filename || 'unknown');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        });
        return;
      }

      // GitHub Webhook
      if (url.pathname === '/webhook/github' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const payload = JSON.parse(body);
          const githubToken = req.headers['x-github-token'];
          
          if (payload.pull_request) {
            const pr = payload.pull_request;
            const [owner, repo] = pr.base.repo.full_name.split('/');
            
            const files = await fetchPRFiles(owner, repo, pr.number, githubToken);
            const results = [];
            
            for (const file of files.slice(0, 10)) { // Limit to 10 files
              const lang = file.filename.split('.').pop();
              const analysis = await analyzeCode(file.patch || file.diff, lang, file.filename);
              results.push({
                filename: file.filename,
                ...analysis
              });
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ pr: pr.number, results }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'No PR data in webhook' }));
          }
        });
        return;
      }

      // Documentation
      if (url.pathname === '/docs' || url.pathname === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html>
<head>
  <title>CodeSentinel - Autonomous Code Review Agent</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; }
    h1 { color: #2563eb; }
    pre { background: #f1f5f9; padding: 20px; border-radius: 8px; overflow-x: auto; }
    .endpoint { margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 4px solid #2563eb; }
    code { background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>🔍 CodeSentinel API</h1>
  <p>Autonomous Code Review Agent powered by Claude AI</p>
  
  <h2>Endpoints</h2>
  
  <div class="endpoint">
    <h3>POST /analyze</h3>
    <p>Analyze code for bugs, security issues, and improvements</p>
    <pre>{
  "code": "const x = null; x.foo();",
  "language": "javascript",
  "filename": "app.js"
}</pre>
  </div>
  
  <div class="endpoint">
    <h3>POST /webhook/github</h3>
    <p>GitHub webhook for automatic PR review</p>
    <p>Header: <code>x-github-token: YOUR_TOKEN</code></p>
  </div>
  
  <div class="endpoint">
    <h3>GET /health</h3>
    <p>Health check endpoint</p>
  </div>
</body>
</html>
        `);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    } catch (error) {
      console.error('Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
  });

  return server;
}

// ─── CLI Interface ─────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  
  if (args[0] === 'serve') {
    const server = createServer();
    server.listen(CONFIG.port, () => {
      console.log(`🔍 CodeSentinel running on http://localhost:${CONFIG.port}`);
      console.log(`   - POST /analyze - Analyze code`);
      console.log(`   - POST /webhook/github - GitHub webhook`);
      console.log(`   - GET /health - Health check`);
    });
    return;
  }
  
  if (args[0] === 'analyze' && args[1]) {
    const filename = args[1];
    if (!fs.existsSync(filename)) {
      console.error(`File not found: ${filename}`);
      process.exit(1);
    }
    
    const code = fs.readFileSync(filename, 'utf8');
    const language = filename.split('.').pop();
    
    console.log(`🔍 Analyzing ${filename}...`);
    const result = await analyzeCode(code, language, filename);
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  
  console.log(`
🔍 CodeSentinel - Autonomous Code Review Agent

Usage:
  node codesentinel.js serve        Start API server
  node codesentinel.js analyze <file>  Analyze a file

Environment:
  CLAUDE_API_URL   API endpoint (default: https://ai.databyte.co.id/v1/chat/completions)
  CLAUDE_API_KEY   API key
  PORT             Server port (default: 8080)
`);
}

main().catch(console.error);
