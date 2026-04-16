import React, { useState } from "react";
import { supabase } from "../supabaseClient";

interface LoginProps {
  onLogin: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Nieprawidłowy email lub hasło");
      setLoading(false);
      return;
    }

    setLoading(false);
    onLogin();
  };

  const handleResetPassword = async () => {
    if (!email) {
      setMessage("Podaj email");
      return;
    }

    setResetLoading(true);
    setMessage(null);

    // 🔥 KLUCZOWA POPRAWKA
    const redirectUrl =
      window.location.hostname === "localhost"
        ? "http://localhost:3000"
        : "https://karolije.github.io/RaportAudytu/";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      setMessage("Nie udało się wysłać maila");
    } else {
      setMessage("Mail do zmiany hasła został wysłany");
      setShowResetModal(false);
    }

    // blokada żeby nie spamować kliknięciem
    setTimeout(() => setResetLoading(false), 10000);
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          padding: 20,
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
          <h2 style={{ marginBottom: 24 }}>Logowanie:</h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "85%",
              padding: 14,
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #ccc",
            }}
          />

          <input
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "85%",
              padding: 14,
              marginBottom: 16,
              borderRadius: 12,
              border: "1px solid #ccc",
            }}
          />

          {message && (
            <div style={{ marginBottom: 16, color: "red" }}>
              {message}
            </div>
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
            }}
          >
            {loading ? "Logowanie..." : "Zaloguj"}
          </button>

          <button
            onClick={() => setShowResetModal(true)}
            style={{
              marginTop: 12,
              background: "none",
              border: "none",
              color: "#1464f4",
              cursor: "pointer",
            }}
          >
            Zmień hasło
          </button>
        </div>
      </div>

      {showResetModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: 30,
              borderRadius: 12,
              width: 300,
              textAlign: "center",
            }}
          >
            <h3>Reset hasła</h3>

            <input
              type="email"
              placeholder="Twój email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 10,
                marginBottom: 16,
                borderRadius: 8,
                border: "1px solid #ccc",
              }}
            />

            <button
              onClick={handleResetPassword}
              disabled={resetLoading}
              style={{
                width: "100%",
                padding: 12,
                backgroundColor: "#1464f4",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                cursor: resetLoading ? "not-allowed" : "pointer",
              }}
            >
              {resetLoading ? "Wysyłanie..." : "Wyślij"}
            </button>

            <button
              onClick={() => setShowResetModal(false)}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </>
  );
};