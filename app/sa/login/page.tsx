"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SaLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Determine SA path prefix from the current URL for redirects
  const getSaPath = () => {
    if (typeof window === "undefined") return "";
    const parts = window.location.pathname.split("/");
    return parts[1] || "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/sa/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
      } else {
        const saPath = getSaPath();
        router.push(`/${saPath}/users`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ background: "#0F1117", minHeight: "100vh" }}
      className="flex items-center justify-center px-4"
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <div className="text-center mb-8">
          <div
            style={{ color: "#6C63FF", fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em" }}
          >
            Waitlistku Admin
          </div>
          <p style={{ color: "#718096", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Restricted access only
          </p>
        </div>

        <div
          style={{
            background: "#1A1D27",
            border: "1px solid #2D3148",
            borderRadius: "1rem",
            padding: "2rem",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label style={{ color: "#E2E8F0", fontSize: "0.875rem", fontWeight: 500 }} className="block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: "100%",
                  background: "#0F1117",
                  border: "1px solid #2D3148",
                  borderRadius: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  color: "#E2E8F0",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#2D3148")}
              />
            </div>

            <div>
              <label style={{ color: "#E2E8F0", fontSize: "0.875rem", fontWeight: 500 }} className="block mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: "100%",
                  background: "#0F1117",
                  border: "1px solid #2D3148",
                  borderRadius: "0.625rem",
                  padding: "0.625rem 0.875rem",
                  color: "#E2E8F0",
                  fontSize: "0.875rem",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#6C63FF")}
                onBlur={(e) => (e.target.style.borderColor = "#2D3148")}
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(252,129,129,0.1)",
                  border: "1px solid rgba(252,129,129,0.3)",
                  borderRadius: "0.5rem",
                  padding: "0.625rem 0.875rem",
                  color: "#FC8181",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#4a46b8" : "#6C63FF",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.9375rem",
                padding: "0.75rem",
                borderRadius: "0.75rem",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s",
                marginTop: "0.5rem",
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
