import { useState, useCallback } from "react";
import Editor from "@monaco-editor/react";
import { compileMSNToString } from "./msn-compiler";

const DEFAULT_MSN = `# Welcome to the MSN Playground!
# Try editing this MSN and see JSON output in real time.

# Application Config
- app
-- name: My Application
-- version: 2.0.0
-- debug: false

# Server
- server
-- host: localhost
-- port: 3000
-- ssl
--- enabled: true
--- cert: /path/to/cert.pem

# Database
- database
-- driver: postgres
-- host: db.example.com
-- port: 5432
-- credentials
--- username: admin
--- password: secret

# Features
- features
-- * authentication
-- * dashboard
-- * api
-- * logging

# Team
- team
-- *
--- name: Alice
--- role: Lead
-- *
--- name: Bob
--- role: Developer
-- *
--- name: Charlie
--- role: Designer
`;

function App() {
  const [msnSource, setMsnSource] = useState(DEFAULT_MSN);
  const [jsonOutput, setJsonOutput] = useState(() => {
    try {
      return compileMSNToString(DEFAULT_MSN);
    } catch {
      return "{}";
    }
  });
  const [error, setError] = useState<string | null>(null);

  const handleMsnChange = useCallback((value: string | undefined) => {
    const src = value ?? "";
    setMsnSource(src);
    try {
      const result = compileMSNToString(src);
      setJsonOutput(result);
      setError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      setJsonOutput("");
    }
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(jsonOutput);
  }, [jsonOutput]);

  const handleReset = useCallback(() => {
    setMsnSource(DEFAULT_MSN);
    try {
      setJsonOutput(compileMSNToString(DEFAULT_MSN));
      setError(null);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h1>MSN Playground</h1>
        </div>
        <p className="subtitle">
          Mad Sam Notation — Write MSN, see JSON in real time
        </p>
        <div className="header-actions">
          <button onClick={handleReset} className="btn btn-secondary">
            Reset
          </button>
          <button
            onClick={handleCopy}
            className="btn btn-primary"
            disabled={!!error}
          >
            Copy JSON
          </button>
        </div>
      </header>

      <main className="editors">
        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-label">MSN Input</span>
            <span className="panel-badge">.msn</span>
          </div>
          <Editor
            height="100%"
            defaultLanguage="plaintext"
            value={msnSource}
            onChange={handleMsnChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 16 },
            }}
          />
        </div>

        <div className="editor-panel">
          <div className="panel-header">
            <span className="panel-label">JSON Output</span>
            <span className="panel-badge">.json</span>
            {error && <span className="panel-error">Error</span>}
          </div>
          {error ? (
            <div className="error-display">
              <p className="error-title">Parse Error</p>
              <p className="error-message">{error}</p>
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage="json"
              value={jsonOutput}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                padding: { top: 16 },
              }}
            />
          )}
        </div>
      </main>

      <footer className="footer">
        <p>MSN — The most token-efficient structured data format for AI</p>
      </footer>
    </div>
  );
}

export default App;
