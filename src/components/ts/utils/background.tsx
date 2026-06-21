import type { JSX } from "react";
import { backPattern } from "./backPattern";
import { useSettings } from "../../hooks/SettingsHook";

import { useMemo } from "react";

export function Background() {
  const { bg, bgUrl } = useSettings();

  const icons = useMemo(() => {
    const minSize = 40;
    const maxSize = 120;

    const items: JSX.Element[] = [];

    const rowHeight = minSize;
    let y = 0;

    while (y < window.innerHeight) {
      let x = 0;

      while (x < window.innerWidth) {
        const Icon =
          backPattern[Math.floor(Math.random() * backPattern.length)];
        const size = minSize + Math.random() * (maxSize - minSize);
        const opacity = 0.1 + Math.random() * 0.1;
        const rotation = Math.random() * 360;

        items.push(
          <div
            key={`${x}-${y}-${items.length}`}
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
            <Icon weight="thin" />
          </div>
        );

        x += size;
      }

      y += rowHeight;
    }

    return items;
  }, []); // только один раз при монтировании

  if (bg === "default") {
    return <div className="background">{icons}</div>;
  }

  if (bg === "color") {
    return null;
  }

  if (bg === "custom") {
    return (
      <div
        className="background bgImg"
        style={{ backgroundImage: `url(${bgUrl})` }}
      />
    );
  }
}
