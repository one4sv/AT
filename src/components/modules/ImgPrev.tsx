import { useBlackout } from "../hooks/BlackoutHook"

export default function ImgPrev () {
    const { blackout, setBlackout } = useBlackout()
    return (
        <div className="imgPrevDiv" onClick={() => setBlackout({seted:false})}>
            {blackout.img && 
                <img src={blackout.img} alt="" />
            }
        </div>
    )
}