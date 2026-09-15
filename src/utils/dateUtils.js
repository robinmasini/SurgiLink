/**
 * Date utility functions for patient management
 */

/**
 * Calculate age from birth date
 * @param {string|Date} birthDate - Birth date
 * @returns {number|null} Age in years, or null if no birth date
 */
export const calculateAge = (birthDate) => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);

    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    // Adjust if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

/**
 * Calculate days until/after surgery date
 * @param {string|Date} surgeryDate - Surgery date
 * @returns {string} Formatted string like "J-7" or "J+3" or "J-0"
 */
export const calculateDaysUntilSurgery = (surgeryDate) => {
    if (!surgeryDate) return 'J-0';

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const surgery = new Date(surgeryDate);
    surgery.setHours(0, 0, 0, 0);

    const diffTime = surgery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'J-0';
    if (diffDays > 0) return `J-${diffDays}`;
    return `J+${Math.abs(diffDays)}`;
};

/**
 * Format date in French locale
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDateFR = (date, options = { day: 'numeric', month: 'long', year: 'numeric' }) => {
    if (!date) return 'Non définie';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Date invalide';
        return d.toLocaleDateString('fr-FR', options);
    } catch (e) {
        return 'Date invalide';
    }
};

/**
 * Format date and time in French locale
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeFR = (date) => {
    if (!date) return 'Non définie';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Date invalide';
        return d.toLocaleString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).replace(' à ', ' • ');
    } catch (e) {
        return 'Date invalide';
    }
};

/**
 * Check if a patient is in the active treatment window (between J-18 and e-Satis / J+4)
 * @param {object|string|Date} patientOrDate - Patient object or surgery date
 * @param {string} [status] - Optional status string
 * @returns {boolean} True if patient is between J-18 and e-Satis
 */
export const isBetweenJ18AndEsatis = (patientOrDate, status) => {
    let dateVal = patientOrDate;
    let statusVal = status;

    if (patientOrDate && typeof patientOrDate === 'object') {
        dateVal = patientOrDate.date;
        statusVal = patientOrDate.status;
    }

    if (statusVal === 'archived') return false;
    if (!dateVal) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const surgery = new Date(dateVal);
    if (isNaN(surgery.getTime())) return false;
    surgery.setHours(0, 0, 0, 0);

    const diffTime = surgery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // J-18 is +18 days away, e-Satis (J+4) is -4 days away
    return diffDays >= -4 && diffDays <= 18;
};

/**
 * Robustly parse surgery date across formats
 * @param {string|Date} dateVal 
 * @returns {Date|null}
 */
export const parseSurgeryDate = (dateVal) => {
    if (!dateVal) return null;
    if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
    
    const str = String(dateVal).trim();
    if (!str) return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        const parts = str.split('T')[0].split('-').map(n => parseInt(n, 10));
        if (parts.length === 3 && parts[0] && parts[1] && parts[2]) {
            return new Date(parts[0], parts[1] - 1, parts[2]);
        }
    }

    const parts = str.split(/[\/\.-]/);
    if (parts.length === 3) {
        if (parts[0].length === 4) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(y) && !isNaN(m) && !isNaN(d)) return new Date(y, m, d);
        } else {
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m, d);
        }
    }

    const fallback = new Date(str);
    return isNaN(fallback.getTime()) ? null : fallback;
};

/**
 * Check if a milestone is due / accessible based on surgery date
 * @param {string} milestoneId - Bienvenue, J7, J1_PreOp, J1, J4_Satisfaction, ESATIS
 * @param {string|Date} surgeryDate - Surgery date
 * @returns {boolean} True if milestone is due/unlocked
 */
export const isMilestoneDue = (milestoneId, surgeryDate) => {
    if (milestoneId === 'Bienvenue' || milestoneId === 'fiche') return true;

    const surgDateObj = parseSurgeryDate(surgeryDate);
    if (!surgDateObj) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const surgZero = new Date(surgDateObj);
    surgZero.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((surgZero - today) / (1000 * 60 * 60 * 24));

    const offsets = {
        Bienvenue: 18,
        J7: 7,
        J1_PreOp: 1,
        J1: -1,
        J4_Satisfaction: -4,
        ESATIS: -4
    };

    const offset = offsets[milestoneId];
    if (offset === undefined) return false;

    return diffDays <= offset;
};


/**
 * Extract low ratings (< 8/10 or negative recommendation) for a patient from response list or map
 * @param {string|number} patientId - Patient ID
 * @param {string} patientName - Patient Name
 * @param {Object} responses - Map of patient responses (by ID or name)
 * @returns {Array} List of low rating items { itemId, label, note, text }
 */
export const getLowJ4DetailsForPatient = (patientId, patientName, responses) => {
    if (!responses) return [];

    const pResps = responses[patientId] || responses[String(patientId)] || responses[(patientName || '').trim().toLowerCase()] || [];
    if (!Array.isArray(pResps) || pResps.length === 0) return [];

    const details = [];
    const itemLabels = {
        accueil_qualite: "Accueil & Courtoisie",
        soins_qualite: "Qualité des soins",
        medecins_ecoute: "Écoute des médecins",
        confort_chambre: "Confort chambre",
        confort_repas: "Qualité repas",
        recommandation: "Recommandation"
    };

    pResps.forEach(r => {
        const screen = (r.screen || '').toLowerCase();
        const isJ4 = screen === 'j4_satisfaction' || screen === 'j4' || screen === 'j+4';
        if (!isJ4) return;

        // Skip internal metadata items like _screen_completed
        if (!r.item_id || r.item_id === '_screen_completed' || r.item_id.startsWith('_')) return;

        const val = r.response?.value;
        if (val === undefined || val === null || val === '') return;

        // Skip boolean values (e.g. true/false) which JS Number() converts to 1/0
        if (typeof val === 'boolean') return;

        if (typeof val === 'number') {
            if (val > 0 && val < 8) {
                details.push({
                    itemId: r.item_id,
                    label: itemLabels[r.item_id] || r.item_id,
                    note: val,
                    text: `${val}/10`
                });
            }
        } else if (typeof val === 'string') {
            const match = val.match(/^(\d+)(?:\/10)?$/);
            if (match) {
                const parsed = parseInt(match[1], 10);
                if (parsed > 0 && parsed < 8) {
                    details.push({
                        itemId: r.item_id,
                        label: itemLabels[r.item_id] || r.item_id,
                        note: parsed,
                        text: `${parsed}/10`
                    });
                }
            } else if (val === 'Plutôt non' || val === 'Non') {
                details.push({
                    itemId: r.item_id,
                    label: itemLabels[r.item_id] || r.item_id,
                    note: 0,
                    text: val
                });
            }
        }
    });

    // Deduplicate by itemId to avoid duplicate note pills
    const uniqueMap = new Map();
    details.forEach(d => uniqueMap.set(d.itemId, d));
    return Array.from(uniqueMap.values());
};

/**
 * Filter patients who submitted a J+4 satisfaction rating under 8/10
 * @param {Array} patients - List of patient objects
 * @param {Object} responses - Map of patient responses
 * @returns {Array} List of patients with low J+4 ratings
 */
export const getPatientsWithLowJ4Rating = (patients, responses) => {
    if (!patients || !Array.isArray(patients) || !responses) return [];

    return patients.filter(p => {
        if (p.status === 'archived') return false;
        const details = getLowJ4DetailsForPatient(p.id, p.name, responses);
        return details.length > 0;
    });
};


