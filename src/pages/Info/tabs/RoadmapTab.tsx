import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CaretDownIcon } from "@phosphor-icons/react";
import SectionArt from "../../../components/ts/SectionArt";
import { roadmapHistory, roadmapCurrent, roadmapFuture, type RoadmapRelease } from "../roadmapData";
import "../scss/roadmap.scss";

export default function RoadmapTab() {
    const { t, i18n } = useTranslation("info");
    const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "ru";
    const [ showPast, setShowPast ] = useState(false);
    const [ showFuture, setShowFuture ] = useState(true);

    const releaseList = (releases: RoadmapRelease[]) => (
        <div className="roadmapReleases">
            {releases.map(release => (
                <div className="roadmapRelease" key={release.version}>
                    <div className="roadmapReleaseHeading">
                        <span className="roadmapVersion">{release.version}</span>
                        <span>{release.title[language]}</span>
                    </div>
                    <ul>
                        {release.features.map((feature, index) => (
                            <li key={index}>{feature[language]}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );

    return (
        <div className="infoText roadmapPage">
            <SectionArt theme="growth"/>
            <h2 className="accent">{t("roadmap.title")}</h2>
            <p>{t("roadmap.intro")}</p>

            <div className="roadmapTimeline">
                <section className="roadmapBranch roadmapBranchPast">
                    <button
                        type="button"
                        className="roadmapToggle"
                        aria-expanded={showPast}
                        onClick={() => setShowPast(prev => !prev)}
                    >
                        <span>{t("roadmap.past")} <span className="roadmapCount">({roadmapHistory.length})</span></span>
                        <CaretDownIcon size={20} className={showPast ? "expanded" : ""}/>
                    </button>
                    {showPast && releaseList(roadmapHistory)}
                </section>

                <section className="roadmapBranch roadmapBranchCurrent">
                    <div className="roadmapCurrentContent">
                        <span className="roadmapStatus">{t("roadmap.current")}</span>
                        <h3>{roadmapCurrent.version} — {roadmapCurrent.title[language]}</h3>
                        <ul>
                            {roadmapCurrent.features.map((feature, index) => (
                                <li key={index}>{feature[language]}</li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="roadmapBranch roadmapBranchFuture">
                    <button
                        type="button"
                        className="roadmapToggle"
                        aria-expanded={showFuture}
                        onClick={() => setShowFuture(prev => !prev)}
                    >
                        <span>{t("roadmap.future")}</span>
                        <CaretDownIcon size={20} className={showFuture ? "expanded" : ""}/>
                    </button>
                    {showFuture && releaseList(roadmapFuture)}
                </section>
            </div>

            <p className="roadmapNote">{t("roadmap.note")}</p>
        </div>
    );
}
