import i18n from "../../../../i18n/i18n";
import ru from "../../../../i18n/locales/ru/goals.json";
import en from "../../../../i18n/locales/en/goals.json";

// Goals are loaded with the /habit overview or a Blackout module, not the app entry.
i18n.addResourceBundle("ru","goals",ru,true,true);
i18n.addResourceBundle("en","goals",en,true,true);
