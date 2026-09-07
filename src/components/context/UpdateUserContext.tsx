import { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useUser } from "../hooks/UserHook";
import { useNote } from "../hooks/NoteHook";
import { api } from "../ts/api";
const UpdateUserContext = createContext<UpdateUserContextType | null>(null);

export interface UpdateUserContextType {
    newName:string
    setNewName:React.Dispatch<React.SetStateAction<string>>
    newNick:string
    setNewNick:React.Dispatch<React.SetStateAction<string>>
    newBio:string
    setNewBio:React.Dispatch<React.SetStateAction<string>>
    // setNewNum:React.Dispatch<React.SetStateAction<string>>
    newMail:string
    setNewMail:React.Dispatch<React.SetStateAction<string>>    
    newBirth:string
    setNewBirth:React.Dispatch<React.SetStateAction<string>>
    // setNewPass:React.Dispatch<React.SetStateAction<string>>
    newPick:File | undefined
    setNewPick:React.Dispatch<React.SetStateAction<File | undefined>>
    handleSave:()=>void
}

export const UpdateUserProvider = ({children}:{children:ReactNode}) => {
    const {user, refetchUser} = useUser()
    const { showNotification } = useNote()

    const [ newName, setNewName ] = useState<string>("")
    const [ newNick, setNewNick ] = useState<string>("")
    const [ newBio, setNewBio ] = useState<string>("")
    const [ newMail, setNewMail ] = useState<string>("")
    const [ newBirth, setNewBirth ] = useState<string>("")
    const [ newPick, setNewPick ] = useState<File | undefined>()

    useEffect(() => {
        if (!user) return;
        setNewName(user.username ?? "");
        setNewNick(user.nick ?? "");
        setNewBio(user.bio ?? "");
        setNewMail(user.mail ?? "");
        setNewBirth(user.date_of_birth ?? "");
    }, [user]);

    const handleSave = async() => {
        if (!user) return;

        // если выбран новый файл — сначала загрузим его
        if (newPick) {
            try {
                const fd = new FormData();
                fd.append("avatar", newPick);
                const upRes = await api.post(`uploadavatar`, fd, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
                if (upRes.data?.success) {
                    // обновим локально — refetchUser ниже синхронизирует
                    await refetchUser();
                } else {
                    showNotification("error", upRes.data?.error || "Не удалось загрузить аватар");
                    return;
                }
            } catch {
                showNotification("error", "Не удалось загрузить аватар");
                return;
            }
        }

        const payload: {row: string, value: string}[] = [];
        if (newName !== "" && newName !== user.username) payload.push({row:"username", value:newName});
        if (newNick !== "" && newNick !== user.nick) payload.push({row:"nick", value:newNick});
        if (newBio !== user.bio) payload.push({row:"bio", value:newBio});
        if (newMail !== "" && newMail !== user.mail) payload.push({row:"mail", value:newMail});
        if (newBirth !== "" && newBirth !== user.date_of_birth) payload.push({row:"date_of_birth", value:newBirth});

        if (payload.length < 1) return

        try {
            const res = await api.post(`updateuser`, payload);
            if (res.data.success) {
                await refetchUser();
                showNotification("success", "Данные обновлены");
            } else {
                showNotification("error", res.data.error || "Не удалось обновить данные");
            }
        } catch {
            showNotification("error", "Не удалось обновить данные")
        }
    }
    return(
        <UpdateUserContext.Provider value={{newName, setNewName, newNick, setNewNick, newBio, setNewBio, newMail, setNewMail, newPick, setNewPick, handleSave, newBirth, setNewBirth }}>
            {children}
        </UpdateUserContext.Provider>
    )
}

export default UpdateUserContext;
