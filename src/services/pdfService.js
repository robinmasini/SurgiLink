import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Service to generate a PDF synthesis of the patient's record.
 * @param {HTMLElement} element - The hidden DOM element containing the report layout.
 * @param {string} fileName - The name of the resulting PDF file.
 */
export async function generateSynthesisPDF(element, fileName = 'Synthese_Patient.pdf') {
    try {
        const pages = element.querySelectorAll('.pdf-page');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Helper to add a single element to PDF
        const addElementToPdf = async (el, isFirstPage) => {
            const canvas = await html2canvas(el, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculate ratio to fit width
            const ratio = pdfWidth / imgWidth;
            const imgTargetWidth = pdfWidth;
            const imgTargetHeight = imgHeight * ratio;

            if (!isFirstPage) {
                pdf.addPage();
            }

            pdf.addImage(imgData, 'PNG', 0, 0, imgTargetWidth, imgTargetHeight);
        };

        if (pages.length > 0) {
            // Multi-page rendering
            for (let i = 0; i < pages.length; i++) {
                await addElementToPdf(pages[i], i === 0);
            }
        } else {
            // Fallback for single legacy element
            await addElementToPdf(element, true);
        }

        pdf.save(fileName);
        return { success: true };
    } catch (error) {
        console.error('Error generating PDF:', error);
        return { success: false, error: error.message };
    }
}
