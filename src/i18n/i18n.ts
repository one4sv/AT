import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import ruCommon from "./locales/ru/common.json";
import ruSign from "./locales/ru/sign.json";
import ruInfo from "./locales/ru/info.json";
import ruSettings from "./locales/ru/settings.json"
import ruAcc from "./locales/ru/acc.json"

import enCommon from "./locales/en/common.json";
import enSign from "./locales/en/sign.json";
import enInfo from "./locales/en/info.json";
import enSettings from "./locales/en/settings.json"
import enAcc from "./locales/en/acc.json"
i18n
    .use(initReactI18next)
    .init({
        lng: "ru",
        fallbackLng: "en",

        ns: ["common", "auth", "footer", "info", "about"],
        defaultNS: "common",

        interpolation: {
            escapeValue: false,
        },

        resources: {
            ru: {
                common: ruCommon,
                sign: ruSign,
                info: ruInfo,
                settings:ruSettings,
                acc:ruAcc,
            },

            en: {
                common: enCommon,
                sign: enSign,
                info: enInfo,
                settings:enSettings,
                acc:enAcc,
            },
        },
    });

export default i18n;