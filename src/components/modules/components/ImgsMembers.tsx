import { CaretLeft, CaretRight, User } from "@phosphor-icons/react";
import type { MemberPermType } from "../PermissionsSettings";
import "../../../scss/ImgsMembers.scss"
import { useEffect, useMemo, useState } from "react";

export default function ImgsMembers({members}:{members:MemberPermType[]}) {
    const [index, setIndex] = useState(members.length || 0);

    useEffect(() => {
        if  (members) setIndex(members.length)
    }, [members])

    const [animate, setAnimate] = useState(true);
    const extendedMembers = useMemo(
        () => [...members, ...members, ...members],
        [members]
    );

    const next = () => {
        setIndex(i => {
            setAnimate(true);
            return i + 1;
        });
    };
    
    const prev = () => {
        setIndex(i => {
            setAnimate(true);
            return i - 1;
        });
    };
    
    return (
        <div className="imgsMembers">
            {members.length > 1 &&
                <div className="imgMembersCaret" onClick={(e) =>{
                    e.preventDefault()
                    prev()
                }}>
                    <CaretLeft/>
                </div>
            }
            <div className="imgsSlider" style={{
                transform: `translateX(-${index * 100}%)`,
                transition: animate ? "transform 0.4s ease" : "none",
            }} onTransitionEnd={() => {
                if (index >= members.length * 2) {
                    setAnimate(false);
                    setIndex(members.length);
                } else if (index < members.length) {
                    setAnimate(false);
                    setIndex(members.length * 2 - 1);
                }
            }}>
                {extendedMembers.map((m, i) => (
                    <div className="memberProf" key={`${m.id}-${i}`}>
                        <div className="memberProfImg">
                            {m.avatar_url
                                ? <img src={m.avatar_url} alt="" />
                                : <User/>
                            }
                        </div>
                        <span className="memberProfName">{m.name}</span>
                        <span className="memberProfRole">{m.role_name}</span>
                    </div>
                ))}
            </div>
            {members.length > 1 &&
                <div className="imgMembersCaret right" onClick={(e) =>{
                    e.preventDefault()
                    next()
                }}>
                    <CaretRight/>
                </div>
            }
        </div>
    )
}