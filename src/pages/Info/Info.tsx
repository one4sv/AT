import { useEffect, useState } from "react"
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

export default function Info() {
    const { setTitle } = usePageTitle()

    const { tab } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState<setting | null>(null);

    const sections: setting[] = [
        {
            name: "О проекте",
            tab: "about",
            desc: "Информация о сервисе и бета тесте",
            icon: InfoIcon ,
        },
        {
            name: "Пользовательское соглашение",
            tab: "terms",
            desc: "Правила использования сервиса",
            icon: HandshakeIcon,
        },
        {
            name: "Политика конфиденциальности",
            tab: "policy",
            desc: "Обработка и хранение данных",
            icon: DetectiveIcon,
        },
        {
            name: "Контакты",
            tab: "contacts",
            desc: "Связь с разработчиком",
            icon: AddressBookIcon,
        },
        {
            name: "FAQ",
            tab: "faq",
            desc: "Часто задаваемые вопросы и ответы на них",
            icon: QuestionIcon,
        },
    ];

    useEffect(() => {
        setTitle("Информация");
    }, []);

    useEffect(() => {
        if (!tab) {
            setActiveTab(null);
            return;
        }

        const currentTab = sections.find((s) => s.tab === tab);

        if (currentTab) {
            setActiveTab(currentTab);
        }
    }, [tab]);

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
                            {sections.map((s) => (
                                <div
                                    key={s.tab}
                                    className="infoButt"
                                    onClick={() => {
                                        setActiveTab(s);
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
                        {activeTab && (
                            <>
                                <div
                                    className="infoBack"
                                    onClick={() => {
                                        navigate(-1);
                                        setActiveTab(null);
                                    }}
                                >
                                    <CaretLeftIcon size={24} />
                                    <h2>{activeTab.name}</h2>
                                </div>

                                {tabs[activeTab.tab as keyof typeof tabs]}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}