import i18n from 'i18next';
import fs from 'fs';

const translationFR = JSON.parse(fs.readFileSync('/Users/robinmasini/Desktop/SurgiLink/src/locales/fr.json', 'utf8'));

// Test with default separators (keySeparator: '.', nsSeparator: ':')
i18n.init({
    lng: 'fr',
    fallbackLng: 'fr',
    resources: {
        fr: {
            translation: translationFR
        }
    }
}, (err, t) => {
    console.log("--- WITH ACTUAL FR.JSON (DEFAULT SETTINGS) ---");
    console.log("t('1. Jeûne avant l’anesthésie') =>", t('1. Jeûne avant l’anesthésie'));
    console.log("t('PARTIE 1 : Préparation médicale à l\\'intervention') =>", t("PARTIE 1 : Préparation médicale à l'intervention"));
    console.log("t('Confirmez-vous l\\'absence de symptômes anormaux (fièvre, toux, rhume, infection...) ?') =>", t("Confirmez-vous l'absence de symptômes anormaux (fièvre, toux, rhume, infection...) ?"));
});
