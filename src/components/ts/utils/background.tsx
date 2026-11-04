import { useSettings } from "../../hooks/SettingsHook";
import BackIconsScene from "./BackIconsScene";
import { getBackgroundFilter } from "./backgroundFilter";
import { BackgroundScene, type StockScene, isStockScene, supportsBackgroundMotion } from "./BackgroundScene";
import "../../../scss/landingBackground.scss";

export function Background() {
  const { bg, bgUrl, bgEffects } = useSettings();

  const speed = Math.min(3, Math.max(.5, bgEffects.speed ?? 1));
  const effects = {
    filter: getBackgroundFilter(bgEffects),
    animation: bgEffects.movement && supportsBackgroundMotion(bg) && !isStockScene(bg)
      ? `atBackgroundDrift ${24 / speed}s ease-in-out infinite alternate` : undefined,
    "--scene-duration": `${18 / speed}s`
  } as React.CSSProperties;

  if (bg === "landing") {
    return <div className="background landingBackground" style={effects} aria-hidden="true" />;
  }

  if (bg === "default") {
    return <div className="background" style={effects} aria-hidden="true"><BackIconsScene/></div>;
  }

  if (bg === "color") {
    return null;
  }

  if (isStockScene(bg)) {
    return <div className="background" style={effects} aria-hidden="true">
      <BackgroundScene variant={bg as StockScene} motion={bgEffects.movement}/>
    </div>;
  }

  if (bg === "custom") {
    return <div className="background bgImg" style={{ ...effects, backgroundImage: `url("${bgUrl}")` }} aria-hidden="true"/>;
  }

  return null;
}
