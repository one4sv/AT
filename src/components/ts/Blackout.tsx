import { useEffect, useRef } from "react";
import { useBlackout } from "../hooks/BlackoutHook";
import ModuleMap from "../modules/ModuleMap";

export default function Blackout() {
  const { blackout, setBlackout } = useBlackout();

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
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [setBlackout]);

  return blackout.seted && Component ? (
    <div className="blackout" ref={blackoutRef}>
      <div ref={moduleRef}>
        <Component />
      </div>
    </div>
  ) : null;
}
