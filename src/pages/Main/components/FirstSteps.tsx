import { CaretDownIcon, CheckCircleIcon } from "@phosphor-icons/react";
import "../scss/FirstSteps.scss";
import useLocalStorage from "../../../components/hooks/utils/useLocalStorage";
import { useEffect } from "react";
import { useUser } from "../../../components/hooks/UserHook";
import { useAcc } from "../../../components/hooks/AccHook";
import { useHabits } from "../../../components/hooks/HabitsHook";
import { useContacts } from "../../../components/hooks/ContactsHook";

export default function FirstSteps() {
    const { user } = useUser()
    const { refetchPosts, posts } = useAcc()
    const { habits } = useHabits()
    const { list } = useContacts()

    const [opened, setOpened] = useLocalStorage(
        `$first_steps_opened`,
        true
    );
    const [fsprofile, setFsProfile] = useLocalStorage(
        `$first_steps_profile`,
        false
    );
    const [fspost, setFsPost] = useLocalStorage(
        `$first_steps_post`,
        false
    );
    const [fsmess, setFsMess] = useLocalStorage(
        `$first_steps_mess`,
        false
    );
    const [fshabit, setFsHabit] = useLocalStorage(
        `$first_steps_habit`,
        false
    );
    const [fsgroup, setFsGroup] = useLocalStorage(
        `$first_steps_group`,
        false
    );

    useEffect(() => {
        if (fsprofile === true) return
        if (user.username || user.bio || user.sex || user.date_of_birth || user.avatar_url) setFsProfile(true)
    }, [fsprofile, setFsProfile, user.avatar_url, user.bio, user.date_of_birth, user.sex, user.username])

    useEffect(() => {
        if (!user.nick) return;
        refetchPosts(user.nick);
    }, [user.nick, refetchPosts]);

    useEffect(() => {
        if (!posts) return
        setFsPost(posts.length > 0);
    }, [posts, setFsPost]);

    useEffect(() => {
        if (fsmess === true) return
        setFsMess(list.filter(l => l.is_group === false).length > 0);
    }, [fsmess, list, setFsMess]);

    useEffect(() => {
        if (!habits || fshabit === true) return 
        setFsHabit(habits.length > 0);
    }, [fshabit, habits, setFsHabit]);

    useEffect(() => {
        if (fsgroup === true) return
        setFsGroup(list.filter(l => l.is_group === true).length > 0);
    }, [fsgroup, list, setFsGroup]);

    const completed = [
        fsprofile,
        fspost,
        fsmess,
        fshabit,
        fsgroup,
    ].filter(Boolean).length;

    return (
        <div className="firstStepsDiv">
            <div
                className="firstStepsTitle"
                onClick={() => setOpened(!opened)}
            >
                Первые шаги
                <div className="firstStepsProgress">
                    <div
                        className="firstStepsProgressFill"
                        style={{ width: `${(completed / 5) * 100}%` }}
                    />

                    {[...Array(5)].map((_, i) => (
                        <div
                                key={i}
                            className={`firstStepsMark ${i < completed ? "done" : ""}`}
                            />
                    ))}
                </div>
                <div className={`firstStepSvg ${opened ? "opened" : ""}`}>
                    <CaretDownIcon />
                </div>
            </div>

            {opened && (
                <div className="firstStepsWrapper">
                    <div className={`firstStep ${fsprofile && "completed"}`}>
                        <div className="fstext">Заполнить профиль <span>(имя, bio, дата рождения, пол, аватарка)</span></div> {fsprofile && <CheckCircleIcon weight="fill" size={20}/>}
                    </div>
                    <div className={`firstStep ${fspost && "completed"}`}>
                        <div className="fstext">Написать первый пост</div> {fspost && <CheckCircleIcon weight="fill" size={20}/>}
                    </div>
                    <div className={`firstStep ${fsmess && "completed"}`}>
                        <div className="fstext">Найти первого собеседника</div> {fsmess && <CheckCircleIcon weight="fill" size={20}/>}
                    </div>                    
                    <div className={`firstStep ${fshabit && "completed"}`}>
                        <div className="fstext">Создать первую активность</div> {fshabit && <CheckCircleIcon weight="fill" size={20}/>}
                    </div>                    
                    <div className={`firstStep ${fsgroup && "completed"}`}>
                        <div className="fstext">Вступить в беседу</div> {fsgroup && <CheckCircleIcon weight="fill" size={20}/>}
                    </div>
                </div>
            )}
        </div>
    );
}