import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportReportHtmlToPdf(element: HTMLElement, filename = "report.pdf") {
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale = better quality
      useCORS: true, // Allow cross-origin images
      backgroundColor: "#fff"
    });
    const imgData = canvas.toDataURL("image/png");

    // A4 size in points: 210mm x 297mm = 595 x 842
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit A4
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let position = 0;
    let remainingHeight = imgHeight;

    // Add pages if content is longer than one page
    while (remainingHeight > 0) {
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;
      if (remainingHeight > 0) {
        pdf.addPage();
        position = -pageHeight;
      }
    }

    pdf.save(filename);
  } catch (err) {
    console.error("[exportReportHtmlToPdf] Error:", err);
    throw err;
  }
} 