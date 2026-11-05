import TA from "../../../components/ts/TA";
import { useTranslation } from "react-i18next";
import { CircleIcon, Camera, ChatTeardropText, FloppyDiskBack, PencilSimple, Users, X } from "@phosphor-icons/react";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Group } from "../../../components/context/GroupContext";
import { useBlackout } from "../../../components/hooks/BlackoutHook";
import { useGroup } from "../../../components/hooks/GroupHook";
import { useNote } from "../../../components/hooks/NoteHook";
import { useContacts } from "../../../components/hooks/ContactsHook";
import { api } from "../../../components/ts/api";
export default function GroupInfo({
    group,
    collapsed
}: {
    group: Group;
    collapsed: number;
}) {
    const { t } = useTranslation("common");
    const { setBlackout } = useBlackout();
    const {
        refetchGroup,
        members,
        newAva,
        setNewAva,
        myPerms
    } = useGroup();
    const { showNotification } = useNote();
    const {
        refetchContactsWTLoading,
        onlineMap
    } = useContacts();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.desc ?? "");
    const inputRef = useRef<HTMLInputElement>(null);
    const nameRef = useRef<HTMLInputElement>(null);
    const innerRef = useRef<HTMLDivElement>(null);
    const bioRef = useRef<HTMLTextAreaElement>(null);
    const [infoHeight, setInfoHeight] = useState<number | null>(null);

    useLayoutEffect(
        () => {
            const inner = innerRef.current;
            if (!inner) return;
            const measure = () => {
                const height = inner.getBoundingClientRect().height;
                setInfoHeight(prev => prev === height ? prev : height);
            };
            measure();
            const observer = new ResizeObserver(measure);
            observer.observe(inner);
            return () => observer.disconnect();
        },
        []
    );

    useLayoutEffect(
        () => {
            const element = bioRef.current;
            if (!element) return;
            element.style.height = "25px";
            element.style.height = element.scrollHeight + 1 + "px";
        },
        [editing, description, group.desc]
    );
    const canEdit = myPerms?.change_name || myPerms?.change_desc || myPerms?.change_avatar;
    const onlineCount = members.filter(member => onlineMap[member.id]).length;

    useEffect(
        () => {
            setNewAva(undefined);
            return () => setNewAva(undefined);
        },
        [group.id, setNewAva]
    );

    useEffect(
        () => {
            if (!newAva) {
                setPreviewUrl(null);
                return;
            }
            const url = URL.createObjectURL(newAva);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        },
        [newAva]
    );

    useEffect(() => {
        if (editing) nameRef.current?.focus();
    }, [editing]);
    const startEditing = () => {
        setName(group.name);
        setDescription(group.desc ?? "");
        setEditing(true);
    };
    const cancelEditing = () => {
        setEditing(false);
        setNewAva(undefined);
    };
    const save = async (event: FormEvent) => {
        event.preventDefault();
        if (saving) return;
        if (myPerms?.change_name && !name.trim()) {
            showNotification("error", t("groupUi.enterName"));
            nameRef.current?.focus();
            return;
        }
        const updates: {
            row: string;
            value: string;
        }[] = [];
        if (myPerms?.change_name && name.trim() !== group.name) updates.push({
            row: "username",
            value: name.trim()
        });
        if (myPerms?.change_desc && description !== (group.desc ?? "")) updates.push({
            row: "desc",
            value: description
        });
        setSaving(true);
        try {
            if (newAva && myPerms?.change_avatar) {
                const data = new FormData();
                data.append("avatar", newAva);
                data.append("group", String(group.id));
                const response = await api.post("uploadavatar", data);
                if (!response.data?.success) throw new Error(response.data?.error || t("groupUi.avatarFailed"));
                // The avatar is already saved; don't upload it again if the next request fails.
                setNewAva(undefined);
                await refetchGroup(String(group.id));
            }
            if (updates.length) {
                const response = await api.post(
                    "updategroup",
                    {
                        group: group.id,
                        updates
                    }
                );
                if (!response.data?.success) throw new Error(response.data?.error || t("groupUi.saveFailed"));
            }
            await refetchGroup(String(group.id));
            await refetchContactsWTLoading();
            setEditing(false);
            showNotification("success", t("groupUi.saved"));
        } catch (error) {
            const message = axios.isAxiosError(error) ? error.response?.data?.error || t("groupUi.saveFailedRetry") : error instanceof Error ? error.message : "Не удалось сохранить изменения";
            showNotification("error", message);
        } finally {
            setSaving(false);
        }
    };
    const avatar = previewUrl || group.avatar_url;

    return (
        <form
            className="accInfo"
            onSubmit={save}
            aria-busy={saving}
            inert={collapsed === 1}
            style={{
                height: infoHeight === null ? undefined : `${infoHeight * (1 - collapsed)}px`,
                opacity: 1 - collapsed,
                marginTop: `calc(var(--acc-info-margin-top, 0px) * ${1 - collapsed})`,
                pointerEvents: collapsed === 1 ? "none" : undefined
            }}
        >
            <div className="accInfoInner" ref={innerRef}>
                <div className="accInfoMain">
                    <button
                        type="button"
                        className="accPic groupAvatar"
                        disabled={saving || (editing ? !myPerms?.change_avatar : !avatar)}
                        aria-label={editing ? t("groupUi.editAvatar") : t("groupUi.openAvatar")}
                        onClick={() => {
                            if (editing) inputRef.current?.click(); else if (avatar) setBlackout(
                                {
                                    seted: true,
                                    module: "ImgPrev",
                                    img: avatar
                                }
                            );
                        }}
                    >
                        {avatar ? <img src={avatar} alt="" className="avatarImg" /> : editing ? <Camera /> : <Users />}
                    </button>
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={event => {
                            const file = event.target.files?.[0];
                            if (file) setBlackout(
                                {
                                    seted: true,
                                    module: "PickHandler",
                                    pick: file
                                }
                            );
                            event.target.value = "";
                        }}
                    />
                    <div className="accInfoNames">
                        <div className="accMainInfoStr">
                            <input
                                ref={nameRef}
                                className={`accInput nameInput ${!editing || !myPerms?.change_name ? "dis" : ""}`}
                                aria-label={t("groupUi.name")}
                                value={editing ? name : group.name}
                                readOnly={!editing || !myPerms?.change_name}
                                onChange={event => setName(event.target.value)}
                                disabled={saving}
                            />
                        </div>
                        <div className="accNickStr groupMemberCount">{t("groupUi.members", { count: members.length })}
                        </div>
                    </div>
                    <div className="accInfoWrapper">
                        <div className={`accOnlineStauts ${onlineCount ? "online" : "offline"}`}>
                            <CircleIcon size={16} weight="fill" aria-hidden="true" />
                            {onlineCount ? t("groupUi.online", { count: onlineCount }) : t("groupUi.group")}
                        </div>
                    </div>
                </div>
                <div className="accInfoWrapper">
                    {(group.desc || editing) && <div className="accExtraInfoWrapper">
                        <label htmlFor="group-description">{t("groupUi.description")}</label>
                        <TA
                            taRef={bioRef}
                            id="group-description"
                            className={`extraInfoInput ${!editing || !myPerms?.change_desc ? "dis" : ""}`}
                            value={editing ? description : group.desc ?? ""}
                            readOnly={!editing || !myPerms?.change_desc}
                            onChange={event => setDescription(event.target.value)}
                            disabled={saving}
                        />
                    </div>}
                    <div className="accExtraInfoWrapper">
                        <div className="settingInnerList">
                            {editing ? <>
                                <button type="submit" className="settingInnerButt" disabled={saving}>
                                    <FloppyDiskBack size={20} weight="fill" />
                                    {saving ? t("groupUi.saving") : t("groupUi.save")}
                                </button>
                                <button type="button" className="settingInnerButt" onClick={cancelEditing} disabled={saving}>
                                    <X size={20} />{t("groupUi.cancel")}
                                </button>
                            </> : <>
                                {canEdit && <button type="button" className="settingInnerButt" onClick={startEditing}>
                                    <PencilSimple size={20} weight="fill" />{t("groupUi.edit")}
                                </button>}
                                <button type="button" className="settingInnerButt" onClick={() => navigate(`/chat/g/${group.id}`)}>
                                    <ChatTeardropText size={20} weight="fill" />{t("groupUi.message")}
                                </button>
                            </>}
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
