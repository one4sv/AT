import i18n from "../../i18n/i18n";
import ruGoals from "../../i18n/locales/ru/goals.json";
import enGoals from "../../i18n/locales/en/goals.json";

// Installed by lazy goal pages/modals, not bundled into the app entry.
i18n.addResourceBundle("ru", "common", { goals:ruGoals }, true, true);
i18n.addResourceBundle("en", "common", { goals:enGoals }, true, true);
