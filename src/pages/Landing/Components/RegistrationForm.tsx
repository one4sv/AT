import { Eye, EyeOff } from "lucide-react";
import { useRef, useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook";

export default function RegistrationForm({showPass, showedPass, swipeForm}:{showPass: (value: "auth" | "reg" | "conf") => void,showedPass:{auth:boolean, reg:boolean, conf:boolean}, swipeForm: (targetForm: "auth" | "reg") => void}) {
    const { register } = useAuth()

    const [ nick, setNick ] = useState("");
    const [ mail, setMail ] = useState("");
    const [ pass, setPass ] = useState("");
    const [ confPass, setConfPass ] = useState("");
    const [ showRules, setShowRules ] = useState(false);
    const [ isValidNick, setIsValidNick ] = useState(true);
    const [ isValidMail, setIsValidMail ] = useState(true);
    const [ isValidPass, setIsValidPass ] = useState(true);
    const [ isValidConf, setIsValidConf ] = useState(true); 
    
    const regRef = useRef<HTMLInputElement>(null);
    const confRef = useRef<HTMLInputElement>(null);
    const hideTimeout = useRef<number | null>(null);

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
        setIsValidConf(value === confPass);
    };
    const validateConf = (value: string) => {
        setConfPass(value);
        setIsValidConf(value === pass && value.length > 0);
    };

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

    const handleRegister = async () => {
        if (isValidNick && isValidMail && isValidPass && isValidConf) {
        await register({ mail, pass, nick });
        }
    };
    return (
        <div
            className="landingForm"
        >
            <input
                type="text"
                className={`landingInput ${!isValidNick ? "inputNotValid" : ""}`}
                placeholder="Nickname:"
                required
                onInput={(e) => validateNick(e.currentTarget.value)}
            />
            <input
                type="text"
                className={`landingInput ${!isValidMail ? "inputNotValid" : ""}`}
                placeholder="Email:"
                required
                onInput={(e) => validateMail(e.currentTarget.value)}
            />
            <div
                className={`passWrap ${showRules ? "showRules" : ""}`}
                onFocus={handleFocus}
                onBlur={handleBlur}
            >
                <input
                    type={showedPass.reg ? "text" : "password"}
                    className={`landingInput landingInputPass ${!isValidPass ? "inputNotValid" : ""}`}
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
                    <li style={{ color: pass.length >= 8 && pass.length <= 30 ? "#14b314" : "#a1a1a1" }}>От 8 до 30 символов</li>
                    <li style={{ color: /^[A-Za-z\d]+$/.test(pass) ? "#14b314" : "#a1a1a1" }}>Цифры и буквы латинского алфавита</li>
                    <li style={{ color: /[A-Za-z]/.test(pass) && /\d/.test(pass) ? "#14b314" : "#a1a1a1" }}>Минимум 1 цифра и буква</li>
                </ul>
            </div>
            <div className="passWrap">
                <input
                    type={showedPass.conf ? "text" : "password"}
                    className={`landingInput landingInputPass ${!isValidConf ? "inputNotValid" : ""}`}
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
                <button type="submit" className="greenButt" onClick={()=>handleRegister()}>Создать аккаунт</button>
            </div>
            <button type="button" onClick={() => swipeForm("auth")}>Войти в аккаунт</button>
        </div>
    )
}