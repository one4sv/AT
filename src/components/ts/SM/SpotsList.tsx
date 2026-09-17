import { GhostIcon } from "@phosphor-icons/react";

export default function SpotsList () {
    return (
        <div className="habitsList SMlist nothing">
            <div className="hbListNothingAction">
                <GhostIcon size={50} strokeWidth={1.5} />
                Упс! А здесь ничего нет!
                <a>В разработке!</a>
            </div>
        </div>
    )
}