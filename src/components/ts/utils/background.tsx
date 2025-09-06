import type { JSX } from "react";
import { backPattern } from "./backPattern";
import { useSettings } from "../../hooks/SettingsHook";

export function Background() {
  const { bg, bgUrl } = useSettings();

  const minSize = 40;
  const maxSize = 120;

  const icons: JSX.Element[] = [];

  const rowHeight = minSize; // фиксированный вертикальный шаг
  let y = 0;

  while (y < window.innerHeight) {
    let x = 0;

    while (x < window.innerWidth) {
      const Icon = backPattern[Math.floor(Math.random() * backPattern.length)];
      const size = minSize + Math.random() * (maxSize - minSize);
      const opacity = 0.1 + Math.random() * 0.1;
      const rotation = Math.random() * 360;

      icons.push(
        <div
          key={`${x}-${y}-${icons.length}`}
          style={{
            position: "absolute",
            top: y,
            left: x,
            width: size,
            height: size,
            fontSize: size * 0.8,
            opacity,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <Icon weight="thin"/>
        </div>
      );

      x += size;
    }

    y += rowHeight;
  }

  // Выбор фона в зависимости от bg
  if (bg === "default") {
    return <div className="background">{icons}</div>;
  } else if (bg === "color") {
    return null
  } else if (bg === "custom") {
    return (
      <div
        className="background bgImg"
        style={{ backgroundImage: `url(${bgUrl})` }}
      ></div>
    )
  }
}
