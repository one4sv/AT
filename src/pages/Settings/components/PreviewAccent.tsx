import { CheckCircleIcon, CodeIcon, PushPin, SpeakerSimpleX } from "@phosphor-icons/react";
import { CheckCheck } from "lucide-react";
import AT from "../../../../public/favicon.png"
import { colorsName } from "./colorsName";
import { useSettings } from "../../../components/hooks/SettingsHook";

export default function PreviewAccent() {
    const { accent, grad } = useSettings()
    
    return (
        <div className="previewAccent">
            <div className="accentSpan">Предпросмотр: {colorsName(accent, grad)}</div>
            <div className="previewAccentSM">
                <div className="habit themeHabit-default active">
                    <div className="habitIcon"><CodeIcon size={24} className="habitIconSvg"/></div>
                    <div className="habitInfo">
                        <div className="habitName">
                            Роняю прод
                        </div>
                        <div className="habitPer">
                            Каждый день
                            <CheckCircleIcon className="habitHLStatus" weight="fill" />
                        </div>
                    </div>
                </div>
                <div className="contactsUser active">
                    <div className="contactsUserPic">
                        <img
                            className="contactsUserAvatar"
                            src={AT}
                            alt="beta_tester"
                        />
                    </div>

                    <div className="contactsUserInfo">
                        <div className="contactsUserStr">
                            <span className="nameSpan">
                                Чат тестировщиков
                                <PushPin weight="fill" />
                                <SpeakerSimpleX weight="fill" />
                            </span>

                            <CheckCheck className="isReadCL" height={18} />
                        </div>

                        <div className="lastMess">
                            <div>
                                <span>Вы:</span>
                                <span className="lmc">
                                    У нас прод упал?
                                </span>
                            </div>

                            <span className="messageGetTime">
                                21:40
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            <div className="previewMessages">
                <div className="messageWrapper">
                    <div className="message ur">
                        <div className="senderName">
                            beta_tester
                        </div>

                        <div className="answerMess">
                            <div className="answerName">
                                one4sv
                            </div>
                            <div className="answerText">
                                У нас прод упал?
                            </div>
                        </div>
                        <div className="messageText">
                            Ну ты же запулил непротестированные функции.
                        </div>
                        <div className="messageStatusBarDiv">
                            <div className="messageBar">
                                <span className="messTime">21:40</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="messageWrapper">
                    <div className="message my">
                        <div className="messageText">
                            У меня на localhost всё работало
                        </div>

                        <div className="messageStatusBarDiv">
                            <div className="messageBar">
                                <span className="messTime">21:48</span>
                                <span className="editedMess">изменено</span>
                            </div>

                            <div className="messageReadSign read">
                                <CheckCheck />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}