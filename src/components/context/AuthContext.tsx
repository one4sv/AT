import { createContext, useState } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthContextType {
    register: (data: { mail: string; pass: string; nick: string }) => Promise<void>;
    auth: (data: { pass: string, login:string }) => Promise<void>;
    isTwoAuth:boolean
    success: boolean;
    loadingAuth: boolean;
}

export const AuthProvider = ({ children }: { children : ReactNode }) => {
    const { showNotification } = useNote();
    const [success, setSuccess] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(false);
    const [isTwoAuth, setIsTwoAuth] = useState(false);
    const API_URL = import.meta.env.VITE_API_URL

    const register = async ({ mail, pass, nick }:{mail:string, pass:string, nick:string }) => {
        setLoadingAuth(true);
        try {
            const res = await axios.post(`${API_URL}register`, { mail, pass, nick }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });
            console.log("Ответ от сервера:", res.data);

            if (res.data.success) {
                setSuccess(true);
                showNotification('success', 'Письмо с подтверждением отправлено!');
            } else {
                setSuccess(false);
                showNotification('error', res.data.error || 'Ошибка регистрации');
            }
        } catch (error) {
            console.error("Ошибка сервера:", error);
            setSuccess(false);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 409) {
                    showNotification('error', error.response.data.error || 'Ник или почта уже заняты');
                } else {
                    showNotification('error', 'Ошибка сервера, попробуйте позже');
                }
            }
        } finally {
            setLoadingAuth(false);
        }
    };

    const auth = async({ login, pass }: { login:string, pass:string }) => {
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
                setSuccess(true);
                setIsTwoAuth(res.data.two_auth)
            } else {
                showNotification('error', res.data.error);;
                setSuccess(false);
            }  
        } catch (error) {
            console.error(" Ошибка авторизации:", error);
            setSuccess(false);
            if (axios.isAxiosError(error)) {
                showNotification("error", error.response?.data?.message || "Ошибка авторизации");
            }
        } finally {
            setLoadingAuth(false);
        }
    };
    return (
        <AuthContext.Provider value={{ loadingAuth, auth, register, success, isTwoAuth}}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;