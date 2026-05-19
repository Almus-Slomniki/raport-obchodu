import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Login } from "./Login";
import { ChangePassword } from "./ChangePassword";
import { AuditForm } from "./AuditForm";

export const LoginWrapper: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [resetMode, setResetMode] = useState(false);

useEffect(() => {
  const checkSession = async () => {
    const hash = window.location.hash;

    // 🔥 ZAWSZE najpierw to:
    const { data } = await supabase.auth.getSession();

    // wykrycie resetu hasła z maila
    if (hash.includes("type=recovery")) {
      setResetMode(true);
      setIsLoggedIn(!!data.session);
      setLoadingSession(false);
      return;
    }

    setIsLoggedIn(!!data.session);
    setLoadingSession(false);
  };

  checkSession();

  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setIsLoggedIn(!!session);
  });

  return () => listener.subscription.unsubscribe();
}, []);

  if (loadingSession) return <div>Ładowanie...</div>;

  if (resetMode) {
    return <ChangePassword onDone={() => setResetMode(false)} />;
  }

  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div>
      <button
        onClick={async () => {
          await supabase.auth.signOut();
          setIsLoggedIn(false);
        }}
        style={{
          position: "fixed",
          top: 10,
          right: 10,
          padding: "6px 12px",
          borderRadius: 6,
          backgroundColor: "#eee",
          cursor: "pointer",
        }}
      >
        Wyloguj
      </button>

      <AuditForm />
    </div>
  );
};