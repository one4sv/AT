import { useSettings } from "../../hooks/SettingsHook";
import { useBackIconsPattern } from "../../hooks/utils/useBackIconsPattern";
import { BackgroundScene, type StockScene } from "./BackgroundScene";
import "../../../scss/landingBackground.scss";

export function Background() {
  const { bg, bgUrl, bgEffects } = useSettings();
  const backIconsPattern = useBackIconsPattern();

  const filter = ({
    none: "",
    grayscale: "grayscale(1)",
    sepia: "sepia(1)",
    invert: "invert(1)",
    contrast: "contrast(1.4)",
    saturate: "saturate(1.8)"
  } as const)[bgEffects.filter] ?? "";

  const effects = {
    filter: `blur(${bgEffects.blur}px) ${filter}`,
    animation: bgEffects.movement ? "atBackgroundDrift 24s ease-in-out infinite alternate" : undefined
  };

  if (bg === "landing") {
    return <div className="background landingBackground" style={effects} aria-hidden="true" />;
  }

  if (bg === "default") {
    return <div className="background" style={effects} aria-hidden="true">{backIconsPattern}</div>;
  }

  if (bg === "color") {
    return null;
  }

  if (["art", "aurora", "nebula", "sunset"].includes(bg)) {
    return <div className="background" style={effects} aria-hidden="true">
      <BackgroundScene variant={bg as StockScene}/>
    </div>;
  }

  if (bg === "custom") {
    return <div className="background bgImg" style={{ ...effects, backgroundImage: `url("${bgUrl}")` }} aria-hidden="true"/>;
  }

  return null;
}
