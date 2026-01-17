import { useEffect, useRef } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";
import { useMessages } from "../hooks/MessagesHook";

export default function Blackout() {
  const { blackout, setBlackout } = useBlackout();
  const { redirect, setRedirect, chosenMess, setIsChose, setChosenMess } = useMessages()
  const blackoutRef = useRef<HTMLDivElement>(null);
  const moduleRef = useRef<HTMLDivElement>(null);

  const Component = blackout.module ? ModuleMap[blackout.module] : null;

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (
        blackoutRef.current &&
        moduleRef.current &&
        !moduleRef.current.contains(event.target as Node)
      ) {
        setBlackout({ seted: false, module: undefined });
        if (blackout.module !== "RedirectMesses") setRedirect(undefined)
        else {
          setIsChose(false)
          setChosenMess([])
          setRedirect(redirect?.filter(m => chosenMess.some(cm => cm.id === m.id)))
        }
      }
    
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [blackout.module, setBlackout, setRedirect]);

  return blackout.seted && Component ? (
    <div className="blackout" ref={blackoutRef}>
      <div ref={moduleRef}>
        <Component />
      </div>
    </div>
  ) : null;
}
