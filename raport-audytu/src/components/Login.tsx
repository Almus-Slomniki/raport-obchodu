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
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: 30,
          borderRadius: 16,
          backgroundColor: "#fff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        <h2 style={{ marginBottom: 24, fontSize: 24, color: "#333" }}>Logowanie</h2>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 16,
            borderRadius: 12,
            border: "1px solid #ccc",
            fontSize: 16,
            boxSizing: "border-box",
            textAlign: "center",
          }}
        />

        <input
          type="password"
          placeholder="Hasło"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            marginBottom: 16,
            borderRadius: 12,
            border: "1px solid #ccc",
            fontSize: 16,
            boxSizing: "border-box",
            textAlign: "left",
          }}
        />

        {error && (
          <div style={{ color: "red", marginBottom: 16, fontSize: 14 }}>{error}</div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 16,
            fontSize: 18,
            backgroundColor: "#1464f4",
            color: "#fff",
            borderRadius: 12,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            transition: "background 0.3s",
          }}
        >
          {loading ? "Logowanie..." : "Zaloguj"}
        </button>
      </div>
    </div>
  );
};