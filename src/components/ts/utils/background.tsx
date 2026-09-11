import { useSettings } from "../../hooks/SettingsHook";
import { useBackIconsPattern } from "../../hooks/utils/useBackIconsPattern";

export function Background() {
  const { bg, bgUrl } = useSettings();
  const backIconsPattern = useBackIconsPattern();

  if (bg === "default") {
    return (
      <div className="background">
        {backIconsPattern}
      </div>
    );
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
