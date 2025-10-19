import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import '../scss/Extra.scss';
import { useNote } from "../components/hooks/NoteHook";
import { useUser } from "../components/hooks/UserHook";

export default function Confirm() {
  const { refetchUser } = useUser();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"pending" | "success" | "error" | "expired">("pending");
  const [countdown, setCountdown] = useState(5);
  const { showNotification } = useNote()
  const API_URL = import.meta.env.VITE_API_URL
  const navigate = useNavigate();

  // Проверка токена
  useEffect(() => {
    const checkToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("error");
        return;
      }

      try {
        const res = await axios.post(`${API_URL}confirm`, { token }, { withCredentials:true });
        if (res.data.success) {
          setStatus("success");
          refetchUser()
        } else {
          setStatus("error");
        }
      } catch (err) {
        if (axios.isAxiosError(err)) {
          const response = err.response;
          if (response && response.status === 404 && response.data?.error === "Срок действия токена истёк") {
            setStatus("expired");
            showNotification("error", "Срок действия ссылки истёк");
          } else {
            setStatus("error");
          }
        } else {
          setStatus("error");
        }
        console.error("Ошибка подтверждения:", err);
      }
    };

    checkToken();
  }, [refetchUser, searchParams, showNotification]);


  // Отсчёт и редирект
  useEffect(() => {
    if (status === "success") {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            navigate("/");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status, navigate]);

  const goHome = useCallback(() => navigate("/"), [navigate]);
  return (
    <>
      <div className="titleConfirm" onClick={goHome}>Achieve Together</div>
      <div className="confirmDiv">
        {status === "pending" && <p>⏳ Подтверждаем...</p>}
        {status === "success" && (
          <p>✅ Email подтверждён. Перенаправление через {countdown} сек...</p>
        )}
        {status === "expired" && <p>⏰ Срок действия ссылки истёк. Требуется повторная регистрация.</p>}
        {status === "error" && <p>Ошибка. Неверная ссылка или токен.</p>}
      </div>
    </>
  );
}
