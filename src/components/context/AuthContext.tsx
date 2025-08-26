import { createContext, useState } from "react";
import { type ReactNode } from "react";
import axios from "axios";
import { useNote } from "../hooks/NoteHook";
const AuthContext = createContext<AuthContextType | null>(null);

export interface AuthContextType {
    register: (data: { mail: string; pass: string; nick: string }) => Promise<void>;
    auth: (data: { pass: string, login:string }) => Promise<void>;
    success: boolean;
    loadingAuth: boolean;
}

export const AuthProvider = ({ children }: { children : ReactNode }) => {
    const { showNotification } = useNote();
    const [success, setSuccess] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(false);

    const register = async ({ mail, pass, nick }:{mail:string, pass:string, nick:string }) => {
        setLoadingAuth(true);
        try {
            const res = await axios.post('http://localhost:3001/register', { mail, pass, nick }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            });
            console.log("Ответ от сервера:", res.data);
            if (res.data.success) {
                setSuccess(true);
                setLoadingAuth(false);
                console.log("Регистрация успешна:", res.data);
            } else {
                setSuccess(false);
                setLoadingAuth(false);
                console.warn("Регистрация не пройдена:", res.data.error);
            }
        } catch (error) {
            console.error("Ошибка сервера:", error);
            showNotification('error', 'Ошибка сервера');
            setSuccess(false);
            setLoadingAuth(false);
        }
    };

    const auth = async({ login, pass }: { login:string, pass:string }) => {
        setLoadingAuth(true);
        try {
            const res = await axios.post(
                'http://localhost:3001/auth',
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
                setLoadingAuth(false);
            } else {
                showNotification('error', res.data.error);
                setLoadingAuth(false);
                setSuccess(false);
            }  
        } catch (error) {
            console.error(" Ошибка авторизации:", error);
            showNotification('error', 'Ошибка сервера');
            setSuccess(false);
            setLoadingAuth(false);
        }
    };
    return (
        <AuthContext.Provider value={{ loadingAuth, auth, register, success}}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;