import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Service to generate a PDF synthesis of the patient's record.
 * @param {HTMLElement} element - The hidden DOM element containing the report layout.
 * @param {string} fileName - The name of the resulting PDF file.
 */
export async function generateSynthesisPDF(element, fileName = 'Synthese_Patient.pdf') {
    try {
        // Ensure the element is visible for html2canvas (though it can be hidden via styles)
        // Set specific scale for better quality
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        const imgX = (pdfWidth - imgWidth * ratio) / 2;
        const imgY = 10; // Margin top

        pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
        pdf.save(fileName);

        return { success: true };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return { success: false, error: error.message };
    }
}
