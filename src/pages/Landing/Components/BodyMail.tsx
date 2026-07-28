import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook"
import "../scss/bodyMail.scss"
import { useNote } from "../../../components/hooks/NoteHook"
import { isMobile } from "react-device-detect";

export default function BodyMail() {
    const { response } = useAuth()
    const { showNotification } = useNote()
    const { success } = response;

    const email =
        "email" in response
            ? response.email
            : "";

    const [ editEmail, setEditEmail] = useState(false)
    const [ newEmail, setNewEmail ] = useState(email)
    const [code, setCode] = useState("");

    const codeRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setNewEmail(email)
    }, [email])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setCode(value);
    };

    const handleEditEmail = () => {
        if (email === newEmail) {
            showNotification("info", "новый email совпадает со старым")
        }
    }

    useEffect(() => {
        if (editEmail) {
            emailRef.current?.focus();
        } else {
            codeRef.current?.focus();
        }
    }, [editEmail]);

    if (success === false) return

    return (
        <div className="landingFormWrapper">
            <div className="landingFormEmail">
                <div className="emailCodeWrapper">
                    <span className="emailSendedText">Введите код из письма:</span>

                    <div className="codeWrapper">
                        <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={code}
                            onChange={handleChange}
                            className="hiddenCodeInput"
                            ref={codeRef}
                            onBlur={() => {
                                if (!editEmail && !isMobile) {
                                    codeRef.current?.focus();
                                }
                            }}
                        />
                        {[...Array(6)].map((_, index) => (
                            <div
                                key={index}
                                className={`codeCell ${
                                    !editEmail && index === code.length ? "active" : ""
                                }`}
                            >
                                {code[index] || ""}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="emailEditWrapper">
                    <span className="emailSendedText">Письмо с кодом отправлено на почту:</span>
                    <input
                        type="email"
                        ref={emailRef}
                        value={newEmail} 
                        className="emailEditInput" 
                        disabled={!editEmail}
                        placeholder="Email:"
                        onChange={(e) => setNewEmail(e.target.value)}
                        onBlur={() => {
                            if (editEmail) {
                                emailRef.current?.focus();
                            }
                        }}
                    />
                    <div className="emailButtsWrapper">
                        {editEmail ? (
                        <>
                            <div
                                className="wtbgButt"
                                onClick={() =>{
                                    if (editEmail) handleEditEmail()
                                    setEditEmail(!editEmail)
                                }}
                            >
                                Отправить
                            </div>
                                <div className="wtbgButt"
                                    onClick={() => {
                                        setNewEmail(email)
                                        setEditEmail(false)
                                    }}
                                >
                                    Отмена
                                </div>
                            </>
                        ) : (
                            <div
                                className="wtbgButt"
                                onClick={() =>{
                                    setEditEmail(!editEmail)
                            }}>
                                Изменить
                            </div>
                        )}
                    </div>
                </div>
                <div className="wtbgButt">Отправить письмо повторно</div>
            </div>
            
        </div>
    )
}