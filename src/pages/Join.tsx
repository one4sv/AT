import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUser } from "../components/hooks/UserHook";
import { useNote } from "../components/hooks/NoteHook";
import { api } from "../components/ts/api";
import Loader from "../components/ts/Loader";
import '../scss/Join.scss';
import { Users } from "@phosphor-icons/react";

interface JoinGroup {
    id: string;
    name: string;
    desc: string | null;
    avatar_url: string | null;
    member_count: number;
}

export default function Join() {
    const { token } = useParams<{ token: string }>();
    const { user, loadingUser } = useUser();
    const { showNotification } = useNote();
    const navigate = useNavigate();

    const [group, setGroup] = useState<JoinGroup>({ id: "", name: "", desc: null, avatar_url: null, member_count: 0 });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const fetchGroup = async () => {
            try {
                const res = await api.get(`${API_URL}group/invite/${token}`);
                if (res.data.success) {
                    setGroup(res.data.group);
                } else {
                    showNotification("error", res.data.error || "Приглашение недействительно");
                    navigate("/");
                }
            } catch {
                showNotification("error", "Ошибка загрузки");
                navigate("/");
            } finally {
                setLoading(false);
            }
        };
        fetchGroup();
    }, [API_URL, navigate, showNotification, token]);

    const handleJoin = async () => {
        if (!user && !loadingUser) {
            navigate("/sign", { state: { from: `/join/${token}` } });
            return;
        }

        setJoining(true);
        try {
            const res = await api.post(`${API_URL}group/join`, { token });
            if (res.data.success) {
                showNotification("success", res.data.already_member ? "Вы уже в беседе" : "Вы вступили в беседу!");
                navigate(`/chat/g/${res.data.chat_id}`);
            } else {
                showNotification("error", res.data.error);
            }
        } catch {
            showNotification("error", "Не удалось вступить");
        }
        setJoining(false);
    };

    if (loading) return <Loader/>;

    return (
        <div className="joinDiv">
            <div className="joinMain">
                <div className="joinWord">Вас пригласили в беседу</div>
                <div className="groupInfoWrapper">
                    <div
                        className="accPic"
                    >
                        {group.avatar_url ? (
                            <img src={group.avatar_url} alt="avatar preview" className="avatarImg"/>
                        ) : (
                            <Users size={128} />
                        )}
                    </div>
                    <div className="accInfoNames">
                        <div className="accMainInfoStr">
                            <input
                                className="accInput nameInput"
                                value={group?.name}
                                readOnly
                            />
                        </div>
                        <div className="accInput nickInput">{group.member_count} участника</div>
                    </div>
                </div>
                <div className="accExtraInfoWrapper">
                    <label htmlFor="bioTA">Описание</label>
                    <textarea
                        className="bioTA extraInfoInput"
                        id="bioTA"
                        value={(group.desc) ?? ""}
                        readOnly
                    ></textarea>
                </div>
                <div className="joinAccept">
                    <button className="joinAcceptButt" onClick={handleJoin} disabled={joining}>
                        {joining ? "Принимаем..." : "Принять приглашение"}
                    </button>
                </div>
            </div>
        </div>
    );
}