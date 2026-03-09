"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050810; }
        body::before {
          content: ''; position: fixed; inset: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px);
          pointer-events: none; z-index: 9999;
        }
        .login-wrap {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: #050810;
        }
        .login-box {
          width: 340px; display: flex; flex-direction: column; align-items: center; gap: 28px;
        }
        .login-hex { animation: float 4s ease-in-out infinite; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        .login-title {
          font-family: 'Share Tech Mono', monospace; font-size: 13px; letter-spacing: 0.25em;
          color: #4fc3f7; text-transform: uppercase; text-align: center;
        }
        .login-sub {
          font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.15em;
          color: #3d5a7a; text-transform: uppercase; margin-top: -20px;
        }
        .login-field {
          width: 100%; background: #080d1a; border: 1px solid #1e3560;
          border-radius: 3px; outline: none;
          font-family: 'Share Tech Mono', monospace; font-size: 14px; letter-spacing: 0.1em;
          color: #e8f0fe; padding: 12px 16px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .login-field:focus {
          border-color: #4fc3f7;
          box-shadow: 0 0 0 1px rgba(79,195,247,0.15), inset 0 0 12px rgba(79,195,247,0.05);
        }
        .login-btn {
          width: 100%; padding: 11px; background: transparent;
          border: 1px solid #4fc3f7; border-radius: 3px;
          font-family: 'Rajdhani', sans-serif; font-size: 13px; font-weight: 600;
          letter-spacing: 0.25em; text-transform: uppercase; color: #4fc3f7;
          cursor: pointer; transition: all 0.15s;
        }
        .login-btn:hover:not(:disabled) { background: rgba(79,195,247,0.1); box-shadow: 0 0 16px rgba(79,195,247,0.2); }
        .login-btn:disabled { opacity: 0.5; cursor: default; }
        .login-error {
          font-family: 'Share Tech Mono', monospace; font-size: 9px; letter-spacing: 0.15em;
          color: #ff4444; text-transform: uppercase;
        }
      `}</style>
      <div className="login-wrap">
        <div className="login-box">
          <div className="login-hex">
            <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1">
              <polygon points="12 2 22 7 22 17 12 22 2 17 2 7" />
            </svg>
          </div>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="login-title">7315-CTR0 EC</div>
            <div className="login-sub">Manuscript System — Access Required</div>
          </div>
          <input
            className="login-field"
            type="password"
            placeholder="ENTER ACCESS CODE"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
          />
          <button className="login-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Verifying..." : "Authenticate"}
          </button>
          {error && <div className="login-error">⨯ Access denied</div>}
        </div>
      </div>
    </>
  );
}
