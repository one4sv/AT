import { useSettings } from "../../hooks/SettingsHook";
import { useBackIconsPattern } from "../../hooks/utils/useBackIconsPattern";
import "../../../scss/landingBackground.scss";

export function Background() {
  const { bg, bgUrl } = useSettings();
  const backIconsPattern = useBackIconsPattern();

  if (bg === "landing") {
    return <div className="background landingBackground" aria-hidden="true" />;
  }

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
