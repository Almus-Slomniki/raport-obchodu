import React, { useState } from "react";
import { supabase } from "../supabaseClient";

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Nieprawidłowy email lub hasło");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin();
  };

  return (
    <div style={{ maxWidth: 400, margin: "80px auto", padding: 30, borderRadius: 12, background: "#f9f9f9", textAlign: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
      <h2>Logowanie</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 12, borderRadius: 8, border: "1px solid #ccc" }}
      />

      <input
        type="password"
        placeholder="Hasło"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: "100%", padding: 12, marginBottom: 16, borderRadius: 8, border: "1px solid #ccc" }}
      />

      {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

      <button
        onClick={handleLogin}
        disabled={loading}
        style={{ width: "100%", padding: 12, fontSize: 16, backgroundColor: "#1464f4", color: "white", borderRadius: 8, border: "none", cursor: "pointer" }}
      >
        {loading ? "Logowanie..." : "Zaloguj"}
      </button>
    </div>
  );
};
