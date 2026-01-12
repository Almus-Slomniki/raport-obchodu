import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Login } from "./Login";
import { AuditForm } from "./AuditForm";

export const LoginWrapper: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);

  // sprawdzenie sesji przy starcie
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
      setLoadingSession(false);
    };

    checkSession();

    // subskrypcja zmian stanu logowania
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (loadingSession) return <div>Ładowanie...</div>;

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
