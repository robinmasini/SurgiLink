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
    return new Date(date).toLocaleDateString('fr-FR', options);
};

/**
 * Format date and time in French locale
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTimeFR = (date) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).replace(' à ', ' • ');
};
