import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CaretDownIcon } from "@phosphor-icons/react";
import SectionArt from "../../../components/ts/SectionArt";
import { roadmapHistory, roadmapCurrent, roadmapFuture, type RoadmapRelease } from "../roadmapData";
import { useEffect } from "react";
import "../scss/roadmap.scss";

export default function RoadmapTab() {
    const { t, i18n } = useTranslation("info");
    const language = i18n.resolvedLanguage?.startsWith("en") ? "en" : "ru";
    const [ showPast, setShowPast ] = useState(false);
    const [ showFuture, setShowFuture ] = useState(true);

    useEffect(() => {
        const openHistory = () => setShowPast(true);
        window.addEventListener("roadmap-open-history", openHistory);
        return () => window.removeEventListener("roadmap-open-history", openHistory);
    }, []);

    const releaseList = (releases: RoadmapRelease[]) => (
        <div className="roadmapReleases">
            {releases.map(release => (
                <div className={`roadmapRelease ${/^0\.\d+$/.test(release.version) ? "roadmapReleaseMajor" : ""}`} key={release.version}>
                    {/^0\.\d+$/.test(release.version) ? (
                        <h3 className="roadmapReleaseHeading">
                            <span className="roadmapVersion">{release.version}</span>
                            {release.title && <span>{release.title}</span>}
                        </h3>
                    ) : (
                        <div className="roadmapReleaseHeading">
                            <span className="roadmapVersion">{release.version}</span>
                            {release.title && <span>{release.title}</span>}
                        </div>
                    )}
                    {release.date && <time className="roadmapDate" dateTime={release.date}>
                        {new Date(`${release.date}T12:00:00`).toLocaleDateString(language === "en" ? "en-GB" : "ru-RU", {
                            day: "numeric", month: "long", year: "numeric"
                        })}
                    </time>}
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

                <section className="roadmapBranch roadmapBranchCurrent">
                    <div className="roadmapCurrentContent">
                        <span className="roadmapStatus">{t("roadmap.current")}</span>
                        <h3><span className="roadmapVersion">{roadmapCurrent.version}</span>
                            {roadmapCurrent.title && <> — {roadmapCurrent.title}</>}
                        </h3>
                        {roadmapCurrent.date && <time className="roadmapDate" dateTime={roadmapCurrent.date}>
                            {new Date(`${roadmapCurrent.date}T12:00:00`).toLocaleDateString(language === "en" ? "en-GB" : "ru-RU", {
                                day: "numeric", month: "long", year: "numeric"
                            })}
                        </time>}
                        <ul>
                            {roadmapCurrent.features.map((feature, index) => (
                                <li key={index}>{feature[language]}</li>
                            ))}
                        </ul>
                        {roadmapCurrent.notice && (
                            <p className="roadmapNotice">
                                <span aria-hidden="true">!</span>
                                {roadmapCurrent.notice[language]}
                            </p>
                        )}
                    </div>
                </section>

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
                    <div hidden={!showPast} className="roadmapPastContent">
                        {releaseList([...roadmapHistory].reverse())}
                        <div className="roadmapBeginning">
                            <h3>{t("roadmap.beginning")}</h3>
                            <time dateTime="2025-07-14">14.07.2025</time>
                        </div>
                    </div>
                </section>
            </div>

            <p className="roadmapNote">{t("roadmap.note")}</p>
        </div>
    );
}
