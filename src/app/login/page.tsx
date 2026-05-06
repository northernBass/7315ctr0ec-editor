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
    <div className="login-wrap">
        <div className="login-box">
          <div className="login-hex">
            <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="#4fc3f7" strokeWidth="1">
              <polygon points="12 2 22 22 2 22" />
            </svg>
          </div>
          <div className="login-title">7315-CTR0 EC</div>
          <div className="login-sub">Manuscript System — Access Required</div>
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
    </div>
  );
}
