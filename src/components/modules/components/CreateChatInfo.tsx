import TA from "../../ts/TA";
import { useTranslation } from "react-i18next";
import { Camera } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";

interface CreateChatInfoProps {
    pick: File | null,
    setPick: React.Dispatch<React.SetStateAction<File | null>>,
    name: string,
    setName: React.Dispatch<React.SetStateAction<string>>,
    desc: string,
    setDesc: React.Dispatch<React.SetStateAction<string>>,
}

export default function CreateChatInfo({pick, setPick, name, setName, desc, setDesc}: CreateChatInfoProps) {
    const { t } = useTranslation("common");
    const inputFileRef =  useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!pick) {
            setPreviewUrl(null);
            return;
        }
        const url = URL.createObjectURL(pick);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [pick]);
    
    return (
        <div className="createChatInfo">
            <div className="creteChatStr">
                <input type="file" accept="image/*" hidden ref={inputFileRef} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setPick(file);
                }}/>
                <div className="creteChatPickPre" onClick={() => inputFileRef.current?.click()}>
                    {pick && previewUrl ? (
                        <img src={previewUrl} className="createChatPick" alt="Chat Avatar Preview"/>
                    ) : <Camera />}
                </div>
                <div className="createChatWrapper">
                    <label htmlFor="createChatname">{t("chatUi.name")}</label>
                    <input type="text" id="createChatname" className='createChatname' value={name} onChange={(e) => setName(e.target.value)} maxLength={40} minLength={3}/>
                    <span>{name.length}/40</span>
                </div>
            </div>
            <div className="creteChatStr">
                <div className="createChatWrapper">
                    <label htmlFor="createChatDesc">{t("chatUi.description")}</label>
                    <TA id="createChatDesc" className='createChatDesc' value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={150}/>
                    <span>{desc.length}/150</span>
                </div>
            </div>
        </div>
    )
}