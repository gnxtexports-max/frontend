import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Truck, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    const p = password;
    if (!u || !p) {
      setError("Please enter both username and password.");
      return;
    }
    if (u.length > 100) {
      setError("Username is too long.");
      return;
    }
    if (p.length > 128) {
      setError("Password is too long.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(u, p);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] flex items-center justify-center p-4">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8">
          {/* Brand */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-white text-2xl tracking-tight">GNXT</h1>
            <p className="text-white/50 text-sm mt-1">Distribution Hub — Sign In</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs text-white/60 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <input
                id="login-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoFocus
                className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs text-white/60 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/15 rounded-xl px-4 py-3 pr-12 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#1d4ed8] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#1d4ed8] hover:bg-[#1e40af] disabled:opacity-60 text-white py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
