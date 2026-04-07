import React, { useState } from "react";
import { supabase } from "../supabaseClient";

interface Props {
  onDone: () => void;
}

export const ChangePassword: React.FC<Props> = ({ onDone }) => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleChangePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password
    });

    if (error) {
      setMessage("Nie udało się zmienić hasła");
    } else {
      setMessage("Hasło zostało zmienione");
     setTimeout(() => {
  window.location.hash = "";
  onDone();
}, 2000);
    }
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>Ustaw nowe hasło</h2>

      <input
        type="password"
        placeholder="Nowe hasło"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{
          padding: 12,
          borderRadius: 8,
          border: "1px solid #ccc"
        }}
      />

      <br />
      <br />

      <button
        onClick={handleChangePassword}
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: "#1464f4",
          color: "#fff",
          border: "none"
        }}
      >
        Zmień hasło
      </button>

      <div style={{ marginTop: 16 }}>{message}</div>
    </div>
  );
};