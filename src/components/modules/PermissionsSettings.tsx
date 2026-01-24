import "../../scss/modules/PermissionsDiv.scss"
import { useCallback, useEffect, useState } from "react"
import type { Member, Perms } from "../context/GroupContext"
import { useGroup } from "../hooks/GroupHook"
import { api } from "../ts/api"
import { CaretRight, User, Image, UserPlus, UserMinus, Prohibit, Trash, PushPin, TextAlignCenter, TextAa , UserGear, ShareFat } from "@phosphor-icons/react"
import Toggler from "../ts/toggler"
import { useUser } from "../hooks/UserHook"
import PermissionsName from "./components/PermissionsName"
import Loader from "../ts/Loader"
import { ArrowLeft } from "lucide-react"
import SvgRain from "./components/SvgRain"
import ImgsMembers from "./components/ImgsMembers"
import AutoDesc from "../ts/utils/AutoDesc"
import SelectList from "../ts/SelectList"
import { useBlackout } from "../hooks/BlackoutHook"

export interface RoleType {
    role_id:string,
    role_name:string,
    permissions: Perms,
    is_editable:boolean,
    desc:string | null,
    is_default:boolean,
    rank:number
}

export interface MemberPermType extends Member {
    permissions:Perms
}

const PERM_LABELS: Record<keyof Perms, string> = {
    change_avatar: "Изменять аватарку беседы",
    change_name: "Изменять название беседы",
    change_desc: "Изменять описание беседы",
    manage_roles: "Управлять ролями",
    can_invite_users: "Приглашать участников",
    kick_users: "Исключать участников",
    ban_users: "Банить участников",
    delete_others: "Удалять чужие сообщения",
    pin_messages: "Закреплять сообщения",
    redirect_messages: "Пересылать сообщения",
};

const PERM_ICONS: Record<keyof Perms, React.ComponentType<{ size?: number }>> = {
    change_avatar: Image,
    change_name: TextAa ,
    change_desc: TextAlignCenter,
    manage_roles: UserGear,
    can_invite_users: UserPlus,
    kick_users: UserMinus,
    ban_users: Prohibit,
    delete_others: Trash,
    pin_messages: PushPin,
    redirect_messages: ShareFat,
};

const ALL_PERM_KEYS = Object.keys(PERM_LABELS) as (keyof Perms)[];

export default function PermissionsSettings() {
    const { group } = useGroup()
    const { user } = useUser()
    const { setBlackout } = useBlackout()
    const API_URL = import.meta.env.VITE_API_URL;

    const [ roles, setRoles ] = useState<RoleType[]>([])
    const [ members, setMembers ] = useState<MemberPermType[]>([])
    const [ loadingPermissions, setLoadingPermissions ] = useState(false)
    const [ showList, setShowList ] = useState<{roles:boolean, members:boolean}>({roles:true, members:true})
    const [ showRole, setShowRole ] = useState<RoleType | undefined>(undefined)
    const [ showMember, setShowMember ] = useState<MemberPermType | undefined>()
    const [ slided, setSlided ] = useState(false)

    const refetchMembers = useCallback( async() => {
        if (!group) return
        setLoadingPermissions(true)
        try {
            const res = await api.get(`${API_URL}getpermissions/${group.id}`)
            if (res.data.success) {
                const members = res.data.members as MemberPermType[];
                const roles = res.data.roles as RoleType[];

                const priority = (roleName: string) => {
                    if (roleName === "owner") return 0;
                    if (roleName === "admin") return 1;
                    return 2;
                };

                const rolesSorted = [...roles].sort((a, b) => {
                    const pA = priority(a.role_name);
                    const pB = priority(b.role_name);
                    if (pA !== pB) return pA - pB;

                    const countA = members.filter(m => m.role_id === a.role_id).length;
                    const countB = members.filter(m => m.role_id === b.role_id).length;

                    return countB - countA;
                });

                setMembers(members);
                setRoles(rolesSorted);
            }
        } catch (error) {
            console.log(error)
        }
        finally {
            setLoadingPermissions(false)
        }
    }, [API_URL, group])

    const slide = (role?:RoleType, member?:MemberPermType) => {
        if (!member && !role) return
        setSlided(true)
        if (role) setShowRole(role)
        else setShowMember(member)
    }

    useEffect(() => {
        if (!group) return
        else refetchMembers()
    }, [group, refetchMembers]);

    const imMember = members.find(m => m.id === user.id);
    const myRank = imMember ? roles.find(r => r.role_id === imMember.role_id)?.rank : undefined;
    const targetRank = showMember ? roles.find(r => r.role_id === showMember.role_id)?.rank : undefined;

    const isEditable = showRole
        ? showRole.is_editable
        : myRank !== undefined && targetRank !== undefined
            ? targetRank < myRank
            : false;

    return (
        <div className="permissionsDiv">
            {loadingPermissions ? <Loader /> : (
            <div
                className="slidesContainer"
                style={{ transform: slided ? "translateX(-25%)" : "translateX(25%)"}}
            >
                <div className="permissionsSlide">
                    <div className="permissionsWrapper">
                        <PermissionsName showList={showList} setShowList={setShowList} roles={roles.length}/>
                        <div className="permissionsList" style={{height:!showList.roles ? "0vh" : "fit-content"}}>
                            {roles.map((r) => (
                                <div className="roleWrapper" key={r.role_id}>
                                    <div className="role" onClick={() => slide(r)}>
                                        <div className="roleName">
                                            <span className={`roleName1str ${members.find(m => m.id === user.id)?.role_id === r.role_id ? "isMy" : ""}`}>{r.role_name}</span>
                                            <span className="roleName2str">
                                                {members.find(m => m.id === user.id)?.role_id === r.role_id ? "Ваша роль; " : ""}
                                                приоритет {r.rank};
                                            </span>
                                        </div>
                                        <div className="roleLength">
                                            {members.filter(m => m.role_id === r.role_id).length} участник
                                            <CaretRight className="caret"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {roles.length < 10 && (
                                <div className="roleWrapper">
                                    <div className="role">
                                        <div className="roleName">
                                            <span className="roleName1str addRole">Добавить роль</span>
                                        </div>
                                        <div className="roleLength">
                                            <CaretRight className="caret"/>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="roleWrapper">
                                <div className="role">
                                    <div className="roleName">
                                        <span className="roleName1str addRole">Роль по умолчанию</span>
                                    </div>
                                    <div className="roleLength">
                                        <SelectList className="permSL defRole"
                                            arr={roles.filter(r => r.is_editable).map(r => ({ label:r.role_name, value:r.role_id}))}
                                            selected={roles.find(r => r.is_default)?.role_id}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="permissionsWrapper">
                        <PermissionsName showList={showList} setShowList={setShowList} members={members.length}/>
                        <div className="permissionsList" style={{height:!showList.members ? "0vh" : "fit-content"}}>
                            {members.map((m) => (
                                <div className="roleWrapper" key={m.id}>
                                    <div className="role" onClick={() => slide(undefined, m)}>
                                        <div className="memberItem">
                                            <div className="memberImg">
                                                {m.avatar_url ? <img src={m.avatar_url}/> : <User/>}
                                            </div>
                                            <div className="roleName">
                                                <span className="roleName1str">{m.name || m.nick}</span>
                                                <span className="roleName2str">
                                                    {m.id === user.id
                                                        ? "вы"
                                                        : m.name
                                                            ? `@${m.nick}`
                                                            : ""
                                                    }
                                                </span>
                                            </div>
                                            <span className="roleSpan">{roles.find(r => r.role_id === m.role_id)?.role_name}</span>
                                        </div>
                                        <div className="roleLength">
                                            <CaretRight className="caret"/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="permissionsSlide">
                    <div className="permissionsBg">
                        <ImgsMembers members={members.filter(m => (showRole && m.role_id === showRole.role_id) || (showMember && m.id === showMember.id))}/>
                        <SvgRain/>
                    </div>
                    <div className="infoWrapper">
                        {showRole ? (
                            <div className="permSettingsDiv">
                                <label htmlFor="" className="permLabel">Название</label>
                                <div className={`keyWrapper ${!isEditable ? "noteditable" : ""} roleInp`}>
                                    <input type="text" name="permInp" id="permInp" className="permInp" readOnly={!isEditable} defaultValue={showRole.role_name}/>
                                </div>
                                <label htmlFor="" className="permLabel">Приоритет (максимум 100)</label>
                                <div className={`keyWrapper ${!isEditable ? "noteditable" : ""} roleInp`}>
                                    <input type="number" name="permInp" min={1} max={99} id="permInp" className="permInp" readOnly={!isEditable} defaultValue={showRole.rank}/>
                                </div>
                            </div>
                        )  : (
                            <div className="permSettingsDiv">
                                <label htmlFor="" className="permLabel">Роль</label>
                                <div className={`keyWrapper ${!isEditable ? "noteditable" : ""} roleInp`}>
                                    <SelectList className="permSL" arr={roles.map(r => ({ label:r.role_name, value:r.role_id}))} selected={showMember?.role_id}/>
                                </div>
                            </div>
                        )}
                        <label htmlFor="" className="permLabel">
                            {showRole && `${Object.values(showRole.permissions).filter(Boolean).length}`}
                            {showMember && `${Object.values(showMember.permissions).filter(Boolean).length}`}
                            /10 разрешений
                        </label>
                        {ALL_PERM_KEYS.map((key, i) => {
                            const Icon = PERM_ICONS[key];
                            const permissions = showRole ? showRole.permissions : showMember?.permissions;
                            if (!permissions) return null;
                            return (
                                <div key={i}>
                                    <div className={`keyWrapper ${!isEditable ? "noteditable" : ""}`}>
                                        <div className="permDiv">
                                            <Icon size={20} />
                                            <span className="permStr">{PERM_LABELS[key]}</span>
                                        </div>
                                        <Toggler state={permissions[key]} disable={!isEditable} />
                                    </div>
                                </div>
                            );
                        })}
                        {showRole && (
                            <>
                                <label htmlFor="" className="permLabel">Описание</label>
                                <AutoDesc className="roleDesc" readOnly={!isEditable} desc={showRole.desc || ""}/>
                            </>
                        )}
                    </div>
                </div>
            </div>)}
            {!loadingPermissions && (
                <div className="permissionsButts">
                    <div className="permsButtsDiv">
                        <button className="permButt permCancel" onClick={() => setBlackout({seted:true})}>
                            Отмена
                        </button>
                        <button className="permButt permSave">
                            Сохранить
                        </button>
                    </div>
                    {slided && (
                        <div className="permButt permBack" onClick={() => {
                            setSlided(false)
                            if (showMember) setShowMember(undefined)
                            else setShowRole(undefined)
                        }}>
                            <div className="permBackSvg">
                                <ArrowLeft/>
                            </div>
                            Назад
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}