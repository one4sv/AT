import SectionArt from "../SectionArt";
import "../../../scss/backgroundScenes.scss";

export type StockScene = "art" | "aurora" | "nebula" | "sunset";

export function BackgroundScene({ variant }: { variant: StockScene }) {
    return (
        <div className={`atScene atScene--${variant}`} aria-hidden="true">
            {variant === "art" && <>
                <div className="atSceneArt atSceneArt--center"><SectionArt theme="personalization" mini/></div>
                <div className="atSceneArt atSceneArt--left"><SectionArt theme="habits" mini/></div>
                <div className="atSceneArt atSceneArt--right"><SectionArt theme="chats" mini/></div>
                <div className="atSceneArt atSceneArt--far"><SectionArt theme="notifications" mini/></div>
            </>}
            {variant === "aurora" && <>
                <div className="atAurora atAurora--first"/>
                <div className="atAurora atAurora--second"/>
                <div className="atAurora atAurora--third"/>
                <div className="atAuroraStars"/>
            </>}
            {variant === "nebula" && <div className="atNebulaStars"/>}
            {variant === "sunset" && <>
                <div className="atSun"/>
                <div className="atHorizon atHorizon--far"/>
                <div className="atHorizon atHorizon--near"/>
            </>}
        </div>
    );
}
