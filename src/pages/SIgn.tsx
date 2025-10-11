import { useState, useRef, useEffect } from "react";
import "../scss/Landing.scss";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../components/hooks/AuthHook";
import { useUser } from "../components/hooks/UserHook";
import { useNavigate } from "react-router-dom";

export default function Log() {
  const { register, auth, success, loadingAuth } = useAuth();
  const { loadingUser, isAuthenticated } = useUser();
  const navigate = useNavigate();

  const [showRules, setShowRules] = useState(false);

  // Поля формы
  const [mail, setMail] = useState("");
  const [pass, setPass] = useState("");
  const [nick, setNick] = useState("");
  const [confPass, setConfPass] = useState("");
  const [login, setLogin] = useState("");

  const [showedPass, setShowedPass] = useState({
    auth: false,
    reg: false,
    conf: false,
  });

  // Состояние валидности
  const [isValidNick, setIsValidNick] = useState(true);
  const [isValidMail, setIsValidMail] = useState(true);
  const [isValidPass, setIsValidPass] = useState(true);
  const [isValidConf, setIsValidConf] = useState(true);

  const formRef = useRef<HTMLDivElement>(null);
  const authRef = useRef<HTMLInputElement>(null);
  const regRef = useRef<HTMLInputElement>(null);
  const confRef = useRef<HTMLInputElement>(null);
  const hideTimeout = useRef<number | null>(null);

  // --- Навигация между формами ---
  const swipeForm = (targetForm: "auth" | "reg") => {
    if (!formRef.current) return;
    const scrollTarget = targetForm === "reg" ? 1 : 0;
    formRef.current.scrollTo({
      left: scrollTarget * formRef.current.clientWidth,
      behavior: "smooth",
    });
  };

  // --- Валидация ---
  const validateNick = (value: string) => {
    setNick(value);
    setIsValidNick(value.trim().length >= 3);
  };

  const validateMail = (value: string) => {
    setMail(value);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidMail(regex.test(value));
  };

  const validatePass = (value: string) => {
    setPass(value);
    const lengthV = value.length >= 8 && value.length <= 30;
    const type = /^[A-Za-z\d]+$/.test(value);
    const min = /[A-Za-z]/.test(value) && /\d/.test(value);
    setIsValidPass(lengthV && type && min);
    // проверка совпадения с confirm
    setIsValidConf(value === confPass);
  };

  const validateConf = (value: string) => {
    setConfPass(value);
    setIsValidConf(value === pass && value.length > 0);
  };

  // --- Показываем/скрываем пароль ---
  const showPass = (value: "auth" | "reg" | "conf") => {
    if (value === "auth") setShowedPass({ ...showedPass, auth: !showedPass.auth });
    if (value === "reg") setShowedPass({ ...showedPass, reg: !showedPass.reg });
    if (value === "conf") setShowedPass({ ...showedPass, conf: !showedPass.conf });
  };

  // --- Фокус и подсказки для пароля ---
  const handleFocus = () => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }
    setShowRules(true);
  };

  const handleBlur = () => {
    hideTimeout.current = window.setTimeout(() => {
      setShowRules(false);
      hideTimeout.current = null;
    }, 200);
  };

  const handleMouseEnter = () => handleFocus();
  const handleMouseLeave = () => handleBlur();

  // --- Отправка форм ---
  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isValidNick && isValidMail && isValidPass && isValidConf) {
      await register({ mail, pass, nick });
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (login && pass) {
      await auth({ login, pass });
    }
  };

  // --- Редирект если аутентифицирован ---
  useEffect(() => {
    if (isAuthenticated) navigate("/");
    else navigate("/sign");
  }, [isAuthenticated]);

  return (
    <div className="landing">
      <div className="landingDiv">
        <div className="title">Achieve Together</div>

        {/* Форма */}
        <div className="landingForm" ref={formRef} style={{ display: success || loadingAuth || loadingUser ? "none" : "flex" }}>
          {/* Авторизация */}
          <form className="landingFormAuth" onSubmit={handleAuth}>
            <input
              type="text"
              className={`inpLand`}
              placeholder="Email или nickname:"
              required
              onInput={(e) => setLogin(e.currentTarget.value)}
            />
            <div className="passWrap">
              <input
                type={showedPass.auth ? "text" : "password"}
                className="inpLand"
                placeholder="Пароль:"
                ref={authRef}
                required
                onInput={(e) => setPass(e.currentTarget.value)}
              />
              {showedPass.auth ? (
                <Eye onClick={() => showPass("auth")} />
              ) : (
                <EyeOff onClick={() => showPass("auth")} />
              )}
            </div>
            <div className="landingButts">
              <button type="submit" className="whiteButt">Войти</button>
              <a href="" className="wtbgButt">Забыли пароль?</a>
            </div>
            <button type="button" onClick={() => swipeForm("reg")}>Создать аккаунт</button>
          </form>

          {/* Регистрация */}
          <form className="landingFormReg" onSubmit={handleRegister}>
            <input
              type="text"
              className={`inpLand ${!isValidNick ? "inputNotValid" : ""}`}
              placeholder="Nickname:"
              required
              onInput={(e) => validateNick(e.currentTarget.value)}
            />

            <input
              type="text"
              className={`inpLand ${!isValidMail ? "inputNotValid" : ""}`}
              placeholder="Email:"
              required
              onInput={(e) => validateMail(e.currentTarget.value)}
            />

            <div
              className={`passWrap ${showRules ? "showRules" : ""}`}
              onFocus={handleMouseEnter}
              onBlur={handleMouseLeave}
            >
              <input
                type={showedPass.reg ? "text" : "password"}
                className={`inpLand ${!isValidPass ? "inputNotValid" : ""}`}
                placeholder="Пароль:"
                ref={regRef}
                required
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={(e) => validatePass(e.target.value)}
              />
              {showedPass.reg ? (
                <Eye onClick={() => showPass("reg")} onMouseDown={(e) => e.preventDefault()} />
              ) : (
                <EyeOff onClick={() => showPass("reg")} onMouseDown={(e) => e.preventDefault()} />
              )}
              <ul className={`passRules ${showRules ? "active" : ""}`}>
                <li style={{ color: pass.length >= 8 && pass.length <= 30 ? "white" : "#a1a1a1" }}>От 8 до 30 символов</li>
                <li style={{ color: /^[A-Za-z\d]+$/.test(pass) ? "white" : "#a1a1a1" }}>Цифры и буквы латинского алфавита</li>
                <li style={{ color: /[A-Za-z]/.test(pass) && /\d/.test(pass) ? "white" : "#a1a1a1" }}>Минимум 1 цифра и буква</li>
              </ul>
            </div>

            <div className="passWrap">
              <input
                type={showedPass.conf ? "text" : "password"}
                className={`inpLand ${!isValidConf ? "inputNotValid" : ""}`}
                placeholder="Повторите пароль:"
                ref={confRef}
                required
                onChange={(e) => validateConf(e.target.value)}
              />
              {showedPass.conf ? (
                <Eye onClick={() => showPass("conf")} />
              ) : (
                <EyeOff onClick={() => showPass("conf")} />
              )}
            </div>

            <div className="landingButts">
              <button type="submit" className="greenButt">Создать аккаунт</button>
            </div>
            <button type="button" onClick={() => swipeForm("auth")}>Войти в аккаунт</button>
          </form>
        </div>

        {/* Загрузка */}
        {(loadingAuth || loadingUser) && (
          <div className="loading">
            <div className="loadingPic"></div>
            <span>Секундучку...</span>
          </div>
        )}

        {/* Подтверждение почты */}
        <div className="landingFormConfEmail" style={{ display: success ? "flex" : "none" }}>
          <div className="ConfEmailText">
            <span>Проверьте почту.</span>
            <span>Мы отправили вам письмо с ссылкой для входа.</span>
            <button type="button" className="wtbgButt">Отправить письмо повторно.</button>
          </div>
        </div>
      </div>

      <div className="landingFooter">
        <div>Achieve Together © 2025</div>
        <div>
          <a href="">О нас</a>
          <a href="">Условия</a>
          <a href="">Конфиденциальность</a>
          <span>Русский</span>
        </div>
      </div>
    </div>
  );
}
