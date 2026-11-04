import { useSettings } from "../../hooks/SettingsHook";
import BackIconsScene from "./BackIconsScene";
import { getBackgroundFilter } from "./backgroundFilter";
import { BackgroundScene, type StockScene, isStockScene, supportsBackgroundMotion } from "./BackgroundScene";
import "../../../scss/landingBackground.scss";

export function Background({ previewBg, previewUrl }: { previewBg?: string; previewUrl?: string } = {}) {
  const { bg, bgUrl, bgEffects, bgEffectsReady } = useSettings();
  const selectedBg = previewBg ?? bg;
  const selectedUrl = previewUrl ?? bgUrl;

  if (!bgEffectsReady) return null;

  const speed = Math.min(3, Math.max(0, bgEffects.speed ?? 1));
  const running = bgEffects.movement && speed > 0;
  const effects = {
    filter: getBackgroundFilter(bgEffects),
    animation: running && supportsBackgroundMotion(selectedBg) && !isStockScene(selectedBg)
      ? `atBackgroundDrift ${24 / speed}s ease-in-out infinite alternate` : undefined,
    "--scene-duration": `${18 / Math.max(speed, .25)}s`
  } as React.CSSProperties;

  if (selectedBg === "landing") {
    return <div className="background landingBackground" style={effects} aria-hidden="true" />;
  }

  if (selectedBg === "default") {
    return <div className="background" style={effects} aria-hidden="true"><BackIconsScene/></div>;
  }

  if (selectedBg === "color") {
    return null;
  }

  if (isStockScene(selectedBg)) {
    return <div className="background" style={effects} aria-hidden="true">
      <BackgroundScene variant={selectedBg as StockScene} motion={running}/>
    </div>;
  }

  if (selectedBg === "custom") {
    return <div className="background bgImg" style={{ ...effects, backgroundImage: `url("${selectedUrl}")` }} aria-hidden="true"/>;
  }

  return null;
}
