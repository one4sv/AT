import { useSettings } from "../../hooks/SettingsHook";
import BackIconsScene from "./BackIconsScene";
import { getBackgroundFilter } from "./backgroundFilter";
import { BackgroundScene, type StockScene, isStockScene, supportsBackgroundMotion } from "./BackgroundScene";
import "../../../scss/landingBackground.scss";

export function Background({ previewBg, previewUrl }: { previewBg?: string; previewUrl?: string } = {}) {
  const { bg, bgUrl, bgEffects, bgEffectsReady } = useSettings();
  const selectedBg = previewBg ?? bg;
  const selectedUrl = previewUrl ?? bgUrl;

  if (!bgEffectsReady || selectedBg === "color") return null;

  const speed = Math.min(3, Math.max(0, bgEffects.speed ?? 1));
  const running = bgEffects.movement && speed > 0;
  const effects = {
    filter: getBackgroundFilter(bgEffects),
    animation: running && supportsBackgroundMotion(selectedBg) && !isStockScene(selectedBg)
      ? `atBackgroundDrift ${24 / speed}s ease-in-out infinite alternate` : undefined,
    "--scene-duration": `${18 / Math.max(speed, .25)}s`
  } as React.CSSProperties;

  // Keep the clipping frame still. Filtering or transforming the frame itself
  // cuts off blurred pixels and can expose its parent while it moves.
  const frameStyle = {
    "--background-bleed": `${Math.ceil(bgEffects.blur * 2 + 24)}px`
  } as React.CSSProperties;

  let canvas: React.ReactNode = null;

  if (selectedBg === "landing") {
    canvas = <div className="backgroundCanvas landingBackground" style={effects}/>;
  } else if (selectedBg === "default") {
    canvas = <div className="backgroundCanvas" style={effects}><BackIconsScene/></div>;
  } else if (isStockScene(selectedBg)) {
    canvas = <div className="backgroundCanvas" style={effects}>
      <BackgroundScene variant={selectedBg as StockScene} motion={running}/>
    </div>;
  } else if (selectedBg === "custom") {
    canvas = <div className="backgroundCanvas bgImg"
      style={{ ...effects, backgroundImage: `url("${selectedUrl}")` }}/>;
  }

  if (!canvas) return null;

  return <div className="background" style={frameStyle} aria-hidden="true">{canvas}</div>;
}
