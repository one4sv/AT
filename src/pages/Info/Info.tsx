import { useEffect } from "react"
import { usePageTitle } from "../../components/hooks/PageContextHook"
import "./scss/info.scss"
import type { setting } from "../Settings/Settings"
import { AddressBookIcon, CaretLeftIcon, DetectiveIcon, HandshakeIcon, InfoIcon, QuestionIcon } from "@phosphor-icons/react"
import { useNavigate, useParams } from "react-router-dom"
import AboutTab from "./tabs/AboutTab"
import TermsTab from "./tabs/TermsTab"
import PolicyTab from "./tabs/PolicyTab"
import ContactsTab from "./tabs/ContactsTab"
import FaqTab from "./tabs/FaqTab"
import { useTranslation } from "react-i18next"

export default function Info() {
    const { setTitle } = usePageTitle()
    const { t } = useTranslation("info");
    const { tab } = useParams();
    const navigate = useNavigate();

    const sections: setting[] = [
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

    const currentTab = sections.find((s) => s.tab === tab);

    useEffect(() => {
        setTitle(t("info.title"));
    }, [t, setTitle]);

    const tabs = {
        about: <AboutTab />,
        terms: <TermsTab />,
        policy: <PolicyTab />,
        contacts: <ContactsTab />,
        faq: <FaqTab />,
    };

    return (
        <div className="InfoDiv">
            <div className="infoSliderWrapper">
                <div
                    className="infoSlider"
                    style={{
                        transform: tab ? "translateX(-50%)" : "translateX(0)",
                    }}
                >
                    <div className="infoPage">
                        <div className="infoButtsWrapper">
                            <div
                                className="infoBack"
                                onClick={() => {
                                    navigate(-1);
                                }}
                            >
                                <CaretLeftIcon size={24} />
                                <h2>{t("info.title")}</h2>
                            </div>
                            {sections.map((s) => (
                                <div
                                    key={s.tab}
                                    className="infoButt"
                                    onClick={() => {
                                        navigate(`/info/${s.tab}`);
                                    }}
                                >
                                    <span className="infoName">
                                        <s.icon size={24} weight="fill" />
                                        {s.name}
                                    </span>

                                    <div className="infoDesc">
                                        {s.desc}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="infoPage">
                        {currentTab && (
                            <>
                                <div
                                    className="infoBack"
                                    onClick={() => {
                                        navigate(-1);
                                    }}
                                >
                                    <CaretLeftIcon size={24} />
                                    <h2>{currentTab?.name}</h2>
                                </div>

                                {currentTab && tabs[currentTab.tab as keyof typeof tabs]}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}