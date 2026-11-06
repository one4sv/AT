import { useSettings } from "../../hooks/SettingsHook";
import type { BackgroundEffects, ContourPattern } from "../../context/SettingsContext";
import BackIconsScene from "./BackIconsScene";
import { getBackgroundFilter } from "./backgroundFilter";
import { BackgroundScene, type StockScene, isStockScene } from "./BackgroundScene";
import "../../../scss/landingBackground.scss";
import WallpaperMark from "./WallpaperMark";

export function Background({ previewBg, previewUrl, previewEffects, previewContourPattern, previewContourSize, previewArtPattern, previewArtSize }: { previewBg?: string; previewUrl?: string; previewEffects?: BackgroundEffects; previewContourPattern?: ContourPattern; previewContourSize?: number; previewArtPattern?: ContourPattern; previewArtSize?: number } = {}) {
  const { bg, bgUrl, bgEffects, bgEffectsReady, contourPattern, contourSize, artPattern, artSize, wallpaperStyle } = useSettings();
  const effectsState = previewEffects ?? bgEffects;
  const selectedPattern = previewContourPattern ?? contourPattern;
  const selectedContourSize = previewContourSize ?? contourSize;
  const selectedArtPattern = previewArtPattern ?? artPattern;
  const selectedArtSize = previewArtSize ?? artSize;
  const selectedBg = previewBg ?? bg;
  const selectedUrl = previewUrl ?? bgUrl;

  if (!bgEffectsReady) return null;

  const speed = Math.min(3, Math.max(0, effectsState.speed ?? 1));
  const running = effectsState.movement && speed > 0;
  const effects = {
    filter: getBackgroundFilter(effectsState),
    "--scene-duration": `${18 / Math.max(speed, .25)}s`
  } as React.CSSProperties;

  // Keep the clipping frame still. Filtering or transforming the frame itself
  // cuts off blurred pixels and can expose its parent while it moves.
  const frameStyle = {
    "--background-bleed": `${Math.ceil(effectsState.blur * 2 + 24)}px`
  } as React.CSSProperties;

  let canvas: React.ReactNode = null;

  if (selectedBg === "landing") {
    canvas = <div className="backgroundCanvas landingBackground" style={effects}/>;
  } else if (selectedBg === "default") {
    canvas = <div className="backgroundCanvas" style={effects}><BackIconsScene pattern={selectedPattern} size={selectedContourSize}/></div>;
  } else if (isStockScene(selectedBg)) {
    canvas = <div className="backgroundCanvas" style={effects}>
      <BackgroundScene variant={selectedBg as StockScene} motion={running}
        artPattern={selectedArtPattern} artSize={selectedArtSize}/>
    </div>;
  } else if (selectedBg === "accentGlow") {
    canvas = <div className="backgroundCanvas wallpaperAccentGlow" style={effects}/>;
  } else if (selectedBg === "color" || selectedBg === "logo") {
    const fill = wallpaperStyle.fillMode === "gradient"
      ? `linear-gradient(135deg, ${wallpaperStyle.fillColor}, ${wallpaperStyle.fillGrad})`
      : wallpaperStyle.fillColor;
    canvas = <div className="backgroundCanvas wallpaperSolidCanvas" style={{ ...effects, background: fill }}>
      {(selectedBg === "logo" || (selectedBg === "color" && wallpaperStyle.logoEnabled)) && <WallpaperMark style={wallpaperStyle}/>}
    </div>;
  } else if (selectedBg === "custom") {
    canvas = <div className="backgroundCanvas bgImg"
      style={{ ...effects, backgroundImage: `url("${selectedUrl}")` }}/>;
  }

  if (!canvas) return null;

  return <div className="background" style={frameStyle} aria-hidden="true">{canvas}</div>;
}
