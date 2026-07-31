import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../components/hooks/AuthHook"
import "../scss/bodyMail.scss"
import { useNote } from "../../../components/hooks/NoteHook"
import { isMobile } from "react-device-detect";
import { CircleNotchIcon, XIcon } from "@phosphor-icons/react";

export default function BodyMail() {
    const { response, checkCode } = useAuth()
    const { showNotification } = useNote()
    const { success } = response;

    const email =
        "email" in response
            ? response.email
            : "";

    const [ editEmail, setEditEmail] = useState(false)
    const [ newEmail, setNewEmail ] = useState(email)
    const [ code, setCode ] = useState("");
    const [ loadingCode, setLoadingCode ] = useState(false)
    const [ validCode, setIsValidCode ] = useState<boolean | null>(null)

    const codeRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const codeTimeout = useRef<number | undefined>(undefined);
    const codeAbort = useRef<AbortController | null>(null);
    const codeReqId = useRef(0);

    useEffect(() => {
        setNewEmail(email)
    }, [email])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "").slice(0, 6);
        setCode(value);
        setIsValidCode(null)
        if (value.length === 6) {
        clearTimeout(codeTimeout.current);
        codeAbort.current?.abort();
        codeAbort.current = null;
        codeTimeout.current = window.setTimeout(async () => {
            const controller = new AbortController();
            codeAbort.current = controller;

            setLoadingCode(true);
            const currentReqId = ++codeReqId.current;

            try {
                const res = await checkCode({ code: value, email:email, signal:controller.signal});

                if (currentReqId !== codeReqId.current) return;

                if (!res.success) {
                    setIsValidCode(false);
                } else {
                    setIsValidCode(true);
                }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (e: any) {
                if (e?.name === "AbortError") return;
                console.log(e);
            } finally {
                if (currentReqId === codeReqId.current) {
                    setLoadingCode(false);
                }
            }
        }, 500);
        }
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
                                } ${
                                    validCode === false && "invalid"
                                }`}
                            >
                                {code[index] || ""}
                            </div>
                        ))}
                    </div>
                    {loadingCode ? (
                        <span className="inpExtraSpan loading">
                            <CircleNotchIcon weight="bold" />
                            Проверяем код
                        </span>
                    ) : validCode === false ? (
                        <span className="inpExtraSpan invalid">
                            <XIcon weight="bold" />
                            Неверный код
                        </span>
                    ) : ""}
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