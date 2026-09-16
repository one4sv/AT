import { CaretRightIcon, GhostIcon, NewspaperIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router";

export default function SpotsList () {
    const navigate = useNavigate()
    return (
        <div className="habitsList SMlist nothing">
            <div className={`SMmainButt ${location.pathname === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
                <span className="SMmainButtName">
                    <NewspaperIcon weight="fill" size={30}/> Лента <CaretRightIcon/>
                </span>
                <div className="SMmainButtDesc">Просматривайте посты из спотов и от друзей, рекомендации, ближайшие активности и планы друзей</div>
            </div>
            <div className="hbListNothingAction">
                <GhostIcon size={50} strokeWidth={1.5} />
                Упс! А здесь ничего нет!
                <a>В разработке!</a>
            </div>
        </div>
    )
}