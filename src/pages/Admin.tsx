import { useState } from "react";
import axios from "axios";

export default function Admin() {
  const [nick, setNick] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    if (!nick.trim()) return;

    setLoading(true);
    setMsg("");
    try {
      const res = await axios.post(
        "http://localhost:3001/admin",
        { nick: nick.trim() },
        { withCredentials: true } // чтобы токен в куки отправился
      );

      if (res.data.success) {
        setMsg("Вход успешен!");
        setNick("");
      } else {
        setMsg(res.data.error || "Ошибка при входе");
      }
    } catch (err) {
      console.error(err);
      setMsg("Ошибка при запросе к серверу");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Админка (Вход)</h2>
      <input
        type="text"
        placeholder="Введите ник"
        value={nick}
        onChange={(e) => setNick(e.target.value)}
        disabled={loading}
      />
      <button onClick={handleLogin} disabled={loading || !nick.trim()}>
        {loading ? "Входим..." : "Войти"}
      </button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
