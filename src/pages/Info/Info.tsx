import { useEffect, useRef, useState } from "react"
import { usePageTitle } from "../../components/hooks/PageContextHook"
import "./scss/info.scss"
import type { Setting } from "../Settings/Settings"
import { AddressBookIcon, ArrowLeftIcon, DetectiveIcon, HandshakeIcon, InfoIcon, QuestionIcon } from "@phosphor-icons/react"
import { useNavigate, useParams } from "react-router-dom"
import AboutTab from "./tabs/AboutTab"
import TermsTab from "./tabs/TermsTab"
import PolicyTab from "./tabs/PolicyTab"
import ContactsTab from "./tabs/ContactsTab"
import FaqTab from "./tabs/FaqTab"
import { useTranslation } from "react-i18next"
import useCompactLayout from "../../components/hooks/utils/useCompactLayout";
import Toggler from "../../components/ts/Toggler"
import { AnimatePresence, motion } from "motion/react"
import { useBlackout } from "../../components/hooks/BlackoutHook"

import SectionArt from "../../components/ts/SectionArt";

import BetaNotice from "../../components/ts/BetaNotice";
import BetaTab from "./tabs/BetaTab";

export default function Info() {
    const isMobile = useCompactLayout();
    const { setTitle } = usePageTitle()
    const { t } = useTranslation("info");
    const { tab } = useParams();
    const { setBlackout } = useBlackout()
    const navigate = useNavigate();
    
    const [ activeTab, setActiveTab ] = useState<Setting | null>(null);
    const [ table, setTable ] = useState(true)
    const [ activeContent, setActiveContent ] = useState("info-section-0");

    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const sections: Setting[] = [
        { name: t("beta.title"), tab: "beta", desc: t("beta.notice"), icon: InfoIcon },
        {
            name: t("info.about.name"),
            tab: "about",
            desc: t("info.about.desc"),
            icon: InfoIcon,
        },
        {
            name: t("info.terms.name"),
            tab: "terms",
            desc: t("info.terms.desc"),
            icon: HandshakeIcon,
        },
        {
            name: t("info.policy.name"),
            tab: "policy",
            desc: t("info.policy.desc"),
            icon: DetectiveIcon,
        },
        {
            name: t("info.contacts.name"),
            tab: "contacts",
            desc: t("info.contacts.desc"),
            icon: AddressBookIcon,
        },
        {
            name: t("info.faq.name"),
            tab: "faq",
            desc: t("info.faq.desc"),
            icon: QuestionIcon,
        },
    ];

    useEffect(() => {
        setTitle(activeTab !== null && tab ? activeTab.name : t("info.title"));
    }, [t, setTitle, activeTab, tab]);

        useEffect(() => {
            if (tab) {
                if (tab === "acc") setActiveTab(sections.find(s => s.tab === "about") ?? null);
                else setActiveTab(sections.find(s => s.tab === tab) ?? null);
            }
        }, [tab, t]);

    const tabs = {
        beta: <BetaTab />,
        about: <AboutTab />,
        terms: <TermsTab />,
        policy: <PolicyTab />,
        contacts: <ContactsTab />,
        faq: <FaqTab />,
    };
    const [contents, setContents] = useState<{ id: string; title: string }[]>([]);

    useEffect(() => {
        const container = document.querySelector(".settingTab");
        if (!container || !activeTab) {
            setContents([]);
            setActiveContent("info-section-0");
            return;
        }

        const headings = container.querySelectorAll("h1, h2, h3");

        const items = Array.from(headings).map((heading, index) => {
            const id = `info-section-${index}`;
            heading.id = id;

            return {
                id,
                title: heading.textContent?.trim() ?? "",
            };
        });

        setContents(items);
        setActiveContent(items[0]?.id ?? "info-section-0");
    }, [activeTab, t]);

    useEffect(() => {
        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }

        scrollTimeout.current = setTimeout(() => {
            document.querySelector(".settingsSlider")?.scrollTo({
                top: 0,
                behavior: "instant",
            });

            document.querySelector(".settingTab")?.scrollTo({
                top: 0,
                behavior: "instant",
            });

            setActiveContent(contents[0]?.id ?? "info-section-0");
        }, 300);

        return () => {
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
        };
    }, [tab]);

    useEffect(() => {
        const container = document.querySelector(".settingTab");
        if (!container) return;

        const updateActiveContent = () => {
            const headings = Array.from(
                container.querySelectorAll<HTMLElement>("h1, h2, h3")
            );

            if (!headings.length) return;

            const containerTop = container.getBoundingClientRect().top;
            let current = headings[0];

            for (const heading of headings) {
                if (heading.getBoundingClientRect().top <= containerTop + 40) {
                    current = heading;
                } else {
                    break;
                }
            }

            setActiveContent(current.id);
        };

        container.addEventListener("scroll", updateActiveContent, {
            passive: true,
        });

        updateActiveContent();

        return () => {
            container.removeEventListener("scroll", updateActiveContent);
        };
    }, [contents, tab]);

    return (
        <div className="settingsDiv">
            <div className="settingsSliderWrapper">
                <div
                    className="settingsSlider"
                    style={{
                        transform: tab ? "translateX(-50%)" : "translateX(0)",
                    }}
                >
                    <div className="settingsPage">
                        {!isMobile ? (
                            <div className="settingTop">
                                <div
                                    className="infoBack"
                                    onClick={() => {
                                        navigate(-1);
                                    }}
                                >
                                    <ArrowLeftIcon size={24} />
                                    <h2>{t("navigation.back")}</h2>
                                </div>
                            </div>
                        ) : ""}
                        <div className="settingsButtsWrapper">
                            <BetaNotice/>
                            {sections.filter(s => s.tab !== "beta").map((s) => (
                                <div
                                    key={s.tab}
                                    className="settingButt"
                                    onClick={() => {
                                        navigate(`/info/${s.tab}`);
                                        setActiveTab(s)
                                    }}
                                >
                                    <span className="settingName">
                                        <s.icon size={24} weight="fill" />
                                        {s.name}
                                    </span>

                                    <div className="settingDesc">
                                        {s.desc}
                                    </div>
                                    <SectionArt section={s.tab} mini/>
                                </div>
                            ))}
                        </div>
                        {isMobile ? (
                            <div className="settingBackWrapper">
                                <div
                                    className="infoBack"
                                    onClick={() => {
                                        navigate(-1);
                                    }}
                                >
                                    <ArrowLeftIcon size={24} />
                                    <h2>{t("navigation.back")}</h2>
                                </div>
                            </div>
                        ) : ""}
                    </div>
                    <div className="settingsPage">
                        {activeTab && (
                            <>
                                {!isMobile ? (
                                    <div className="settingTop">
                                        <div
                                            className="settingBack"
                                            onClick={() => {
                                                navigate(-1);
                                            }}
                                        >
                                            <ArrowLeftIcon size={24} />
                                        </div>
                                        <div className="infoTableButt" onClick={() => setTable(!table)}>
                                            {t("navigation.contents")}
                                            <Toggler state={table} setState={setTable}/>
                                        </div>
                                    </div>
                                ) : ""}
                                <div className="settingTab">
                                    {activeTab && tabs[activeTab.tab as keyof typeof tabs]}
                                </div>
                                {isMobile ? (
                                    <div className="settingBackWrapper">
                                        <div
                                            className="settingBack"
                                            onClick={() => {
                                                navigate(-1);
                                            }}
                                        >
                                            <ArrowLeftIcon size={24} />
                                        </div>
                                        <div className="infoTableButt" onClick={() => setBlackout({seted:true, module:"Table", table:{ contents: contents, activeContent:activeContent}})}>
                                            {t("navigation.contents")}
                                        </div>
                                    </div>
                                ) : "" }
                            </>
                        )}
                    </div>
                </div>
            </div>
                <AnimatePresence>
                    {tab && table && !isMobile && (
                        <motion.div
                            className="infoTableDiv open"
                            initial={{ opacity: 0, scale: 0.94, x: 12, filter: "blur(6px)" }}
                            animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, scale: 0.98, x: 6, filter: "blur(6px)" }}
                            transition={{
                                duration: 0.5,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                        >
                            <div className="infoTable">
                                {contents.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className={`infoTableItem ${activeContent === item.id ? "active" : ""}`}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 8 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => {
                                            const heading = document.getElementById(item.id);
                                            const container = document.querySelector(".settingTab");

                                            if (!heading || !container) return;

                                            container.scrollTo({
                                                top: container.scrollTop + heading.getBoundingClientRect().top - container.getBoundingClientRect().top - 10,
                                                behavior: "smooth",
                                            });

                                            heading.classList.remove("table-highlight");
                                            void heading.offsetWidth;
                                            heading.classList.add("table-highlight");

                                            setTimeout(() => {
                                                heading.classList.remove("table-highlight");
                                            }, 2000);
                                        }}
                                    >
                                        {item.title}
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
        </div>
    )
}
