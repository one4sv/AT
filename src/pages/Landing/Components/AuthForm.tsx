import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook";
import { CheckSquareIcon, SquareIcon } from "@phosphor-icons/react";
import { LoaderSmall } from "../../../components/ts/LoaderSmall";

export default function AuthForm({showPass, showedPass, swipeForm}:{showPass: (value: "auth" | "reg" | "conf") => void,showedPass:{auth:boolean, reg:boolean, conf:boolean}, swipeForm: (targetForm: "auth" | "reg") => void}) {
    const { auth, response, setResponse, loadingAuth } = useAuth()
    const [ pass, setPass ] = useState("");
    const [ login, setLogin ] = useState("");
    const [ isCookie, setIsCookie ] = useState(false)

    const success = response.success;
    const form = "form" in response && response.form === "auth" ? response.form : null;
    const error = "error" in response ? response.error : "";
    const field = "field" in response ? response.field : null;

    const handleAuth = async () => {
        if (login.trim() === "") {
            setResponse({success:false, error:"Login не может быть пустым", field:"login", form:"auth"})
            return
        }        
        if (pass.trim() === "") {
            setResponse({success:false, error:"Пароль не может быть пустым", field:"pass", form:"auth"})
            return
        }
        await auth({ login, pass })
    };

    const wrongLogin = success === false && (field === "login" || field === "all") && form
    const wrongPass = success === false && (field === "pass"  || field === "all") && form

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
                onChange={(e) => {
                    if (field === "all") setResponse({ success:false, error:error, field:"pass", form:"auth" })
                    if (field === "login") setResponse({ success:null })
                    setLogin(e.currentTarget.value)}
                }
            />
            <div className="passWrap">
                <input
                    type={showedPass.auth ? "text" : "password"}
                    className={`landingInput landingInputPass ${wrongPass && "invalid"}`}
                    placeholder={wrongPass ? error : "Пароль:"}
                    required
                    value={pass}
                    onChange={(e) => {
                        if (field === "all") setResponse({ success:false, error:error, field:"login", form:"auth" })
                        if (field === "pass") setResponse({ success:null })
                        setPass(e.currentTarget.value)}
                    }
                />
                {showedPass.auth ? (
                    <Eye onClick={() => showPass("auth")} />
                ) : (
                    <EyeOff onClick={() => showPass("auth")} />
                )}
            </div>
            <div className="checkString" onClick={() => setIsCookie(!isCookie)}>
                {isCookie ? <CheckSquareIcon weight="fill"/> : <SquareIcon/>}
                не выходить из системы
            </div>
            <div className="landingButts">
                {loadingAuth
                    ? <LoaderSmall/>
                    : <button className="greenButt" onClick={() => handleAuth()}>Войти</button>
                }
                
                <a href="" className="wtbgButt">Забыли пароль?</a>
            </div>
            <button type="button" onClick={() => swipeForm("reg")}>Создать аккаунт</button>
        </div>
    )
}