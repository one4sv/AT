import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook";

export default function AuthForm({showPass, showedPass, swipeForm}:{showPass: (value: "auth" | "reg" | "conf") => void,showedPass:{auth:boolean, reg:boolean, conf:boolean}, swipeForm: (targetForm: "auth" | "reg") => void}) {
    const { auth, response, setResponse } = useAuth()
    const [ pass, setPass ] = useState("");
    const [ login, setLogin ] = useState("");

    const success = response.success;
    const form = "form" in response ? response.form : null;
    const error = "error" in response ? response.error : "";
    const field = "field" in response ? response.field : null;

    const handleAuth = async () => {
        if (login.trim() === "") {
            setResponse({success:false, error:"Поле не может быть пустым", field:"login", form:"auth"})
        }        
        if (pass.trim() === "") {
            setResponse({success:false, error:"Поле не может быть пустым", field:"pass", form:"auth"})
        }
        await auth({ login, pass })
    };

    const wrongLogin = success === false && (field === "login" || field === "all") && form === "auth"
    const wrongPass = success === false && (field === "pass"  || field === "all") && form === "auth"

    useEffect(() => {
        if (login && (field === "login" || field === "all") && form === "auth") setResponse({success:null}) 
        if (pass && (field === "pass"  || field === "all") && form === "auth") setResponse({success:null}) 
    }, [login, pass, field, form])

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            await auth({ login, pass });
        }
    };

    return (
        <div
            className="landingForm"
            onKeyDown={handleKeyDown}
        >
            <input
                type="text"
                className={`landingInput ${wrongLogin && "invalid"}`}
                placeholder={wrongLogin ? error : "Email или nickname:"}
                required
                value={login}
                onChange={(e) => setLogin(e.currentTarget.value)}
            />
            <div className="passWrap">
                <input
                    type={showedPass.auth ? "text" : "password"}
                    className={`landingInput landingInputPass ${wrongPass && "invalid"}`}
                    placeholder={wrongPass ? error : "Пароль:"}
                    required
                    value={pass}
                    onChange={(e) => setPass(e.currentTarget.value)}
                />
                {showedPass.auth ? (
                    <Eye onClick={() => showPass("auth")} />
                ) : (
                    <EyeOff onClick={() => showPass("auth")} />
                )}
            </div>
            <div className="landingButts">
                <button className="greenButt" onClick={() => handleAuth()}>Войти</button>
                <a href="" className="wtbgButt">Забыли пароль?</a>
            </div>
            <button type="button" onClick={() => swipeForm("reg")}>Создать аккаунт</button>
        </div>
    )
}