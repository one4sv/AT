import React, { createContext, useState, type Dispatch } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
import { useUser } from "../hooks/UserHook";

const AuthContext = createContext<AuthContextType | null>(null);

type ResponseType =
    | {
        success: true;
        form: "auth";
        two_auth:boolean
    }
    | {
        success: true;
        form: "reg";
    }
    | {
        success: false;
        form: "auth" | "reg";
        error: string;
        field: "login" | "pass" | "confirm" | "email" | "all";
    } | {
        success:null
    }

export interface AuthContextType {
    register: (data: { mail: string; pass: string; nick: string }) => Promise<void>;
    auth: (data: { pass: string, login:string }) => Promise<void>;
    loadingAuth: boolean;
    response: ResponseType;
    setResponse:Dispatch<React.SetStateAction<ResponseType>>
}

export const AuthProvider = ({ children }: { children : ReactNode }) => {
    const { showNotification } = useNote();
    const { refetchUser } = useUser()
    const [ loadingAuth, setLoadingAuth ] = useState(false);
    const [ response, setResponse ] = useState<ResponseType>({success:null})

    const API_URL = import.meta.env.VITE_API_URL

    const register = async ({ mail, pass, nick }:{mail:string, pass:string, nick:string }) => {
        setLoadingAuth(true);
        try {
            const res = await axios.post(`${API_URL}register`, { mail, pass, nick }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });

            if (res.data.response) {
                showNotification('info', 'Письмо с подтверждением отправлено!');
                setResponse({success:true, form:"reg"})
            } else {
                showNotification('error', res.data.error || 'Ошибка регистрации');
                setResponse({success:false, form:"reg", error:"", field:"all"})
            }
        } catch (error) {
            console.error("Ошибка сервера:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 409) {
                    showNotification('error', error.response.data.error || 'Ник или почта уже заняты');
                } else {
                    showNotification('error', 'Ошибка сервера, попробуйте позже');
                }
            }
            setResponse({success:false, form:"reg", error:"", field:"all"})
        } finally {
            setLoadingAuth(false);
        }
    };

    const auth = async({ login, pass }: { login:string, pass:string }) => {
        if (login.trim() === "") {
            setResponse({success:false, error:"Поле не может быть пустым", field:"login", form:"auth"})
            return
        }        
        if (pass.trim() === "") {
            setResponse({success:false, error:"Поле не может быть пустым", field:"pass", form:"auth"})
            return
        }
        setLoadingAuth(true);
        try {
            const res = await axios.post(
                `${API_URL}auth`,
                { login, pass },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    withCredentials: true
                }
            )
            if (res.data.success) {
                console.log(res.data.success)
                if (res.data.two_auth) setResponse({success:true, form:"auth", two_auth:true})
                else {
                    setResponse({success:true, form:"auth", two_auth:false})
                    refetchUser()
                    setResponse({success:null})
                }
            } else {
                showNotification('error', res.data.error);;
                setResponse({success:false, form:"auth", error:"Неверные данные для входа", field:"all"})
            }  
            console.log(res.data)
        } catch (error) {
            console.error(" Ошибка авторизации:", error);
            if (axios.isAxiosError(error)) {
                showNotification("error", error.response?.data?.message || "Неверные данные для входа");
                setResponse({success:false, field:"all", error:error.response?.data?.message || "Неверные данные для входа", form:"auth"})
            }
        } finally {
            setLoadingAuth(false);
        }
    };
    return (
        <AuthContext.Provider value={{ loadingAuth, auth, register, response, setResponse}}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;