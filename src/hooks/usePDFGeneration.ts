// @ts-nocheck
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFGenerationOptions {
  filename: string;
  format?: 'a4' | 'a3' | 'letter' | 'id-card';
  orientation?: 'portrait' | 'landscape';
  scale?: number;
  quality?: 'draft' | 'normal' | 'high';
  margins?: { top: number; right: number; bottom: number; left: number };
}

interface IDCardOptions extends PDFGenerationOptions {
  format?: 'id-card';
}

export const usePDFGeneration = () => {
  /**
   * Obtiene las dimensiones estándar para diferentes formatos de PDF
   */
  const getPageDimensions = (format: string, orientation: string = 'portrait') => {
    const dimensions: Record<string, { width: number; height: number }> = {
      'a4-portrait': { width: 210, height: 297 },
      'a4-landscape': { width: 297, height: 210 },
      'a3-portrait': { width: 297, height: 420 },
      'a3-landscape': { width: 420, height: 297 },
      'letter-portrait': { width: 215.9, height: 279.4 },
      'letter-landscape': { width: 279.4, height: 215.9 },
      'id-card': { width: 85.6, height: 53.98 }, // Tarjeta de identificación estándar
    };
    
    const key = format === 'id-card' ? 'id-card' : `${format}-${orientation}`;
    return dimensions[key] || dimensions['a4-portrait'];
  };

  /**
   * Genera un PDF a partir de un elemento DOM con mejor manejo de layout
   */
  const generatePDFFromElement = async (
    element: HTMLElement,
    options: PDFGenerationOptions
  ): Promise<Blob | null> => {
    try {
      const {
        filename,
        format = 'a4',
        orientation = 'portrait',
        scale = 2,
        quality = 'high',
        margins = { top: 10, right: 10, bottom: 10, left: 10 }
      } = options;

      // Configurar escala según calidad
      const scaleMap = { draft: 1, normal: 2, high: 3 };
      const finalScale = scaleMap[quality] || scaleMap.high;

      // Obtener dimensiones
      const pageDims = getPageDimensions(format, orientation);

      // Clonar elemento para evitar modificaciones
      const clonedElement = element.cloneNode(true) as HTMLElement;
      
      // Asegurar que el elemento tiene dimensiones correctas
      if (format === 'id-card') {
        clonedElement.style.width = `${pageDims.width}mm`;
        clonedElement.style.height = `${pageDims.height}mm`;
      } else {
        const contentWidth = pageDims.width - margins.left - margins.right;
        clonedElement.style.width = `${contentWidth}mm`;
        clonedElement.style.margin = '0';
        clonedElement.style.padding = '0';
      }

      // Crear canvas con html2canvas
      const canvas = await html2canvas(clonedElement, {
        scale: finalScale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowHeight: clonedElement.scrollHeight,
        windowWidth: clonedElement.scrollWidth
      });

      // Crear PDF según formato
      if (format === 'id-card') {
        const pdf = new jsPDF('l', 'mm', [pageDims.width, pageDims.height]);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, pageDims.width, pageDims.height);
        return pdf.output('blob');
      } else {
        // Calcular dimensiones de la imagen en el PDF
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageDims.width - margins.left - margins.right;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Crear PDF
        const pdf = new jsPDF(
          orientation === 'landscape' ? 'l' : 'p',
          'mm',
          format === 'letter' ? 'letter' : format === 'a3' ? 'a3' : 'a4'
        );

        let yPosition = margins.top;

        // Agregar imagen en páginas si es muy larga
        if (imgHeight > pageDims.height - margins.top - margins.bottom) {
          const pageHeight = pageDims.height - margins.top - margins.bottom;
          let remainingHeight = imgHeight;
          let currentY = 0;

          while (remainingHeight > 0) {
            const heightToPrint = Math.min(remainingHeight, pageHeight);
            const cropHeight = (heightToPrint * canvas.height) / imgHeight;

            // Crear canvas temporal para el recorte
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = Math.ceil(cropHeight);
            
            const ctx = tempCanvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(
                canvas,
                0,
                Math.floor((currentY * canvas.height) / imgHeight),
                canvas.width,
                Math.ceil(cropHeight),
                0,
                0,
                tempCanvas.width,
                tempCanvas.height
              );
            }

            const pageImgData = tempCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', margins.left, margins.top, imgWidth, heightToPrint);

            remainingHeight -= heightToPrint;
            currentY += heightToPrint;

            if (remainingHeight > 0) {
              pdf.addPage();
            }
          }
        } else {
          pdf.addImage(imgData, 'PNG', margins.left, yPosition, imgWidth, imgHeight);
        }

        return pdf.output('blob');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      return null;
    }
  };

  /**
   * Descarga un PDF directamente al navegador
   */
  const downloadPDF = async (
    element: HTMLElement,
    options: PDFGenerationOptions
  ): Promise<boolean> => {
    try {
      const blob = await generatePDFFromElement(element, options);
      if (!blob) return false;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${options.filename}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      return false;
    }
  };

  /**
   * Obtiene un PDF como Blob para procesar o subir
   */
  const getPDFBlob = async (
    element: HTMLElement,
    options: Omit<PDFGenerationOptions, 'filename'>
  ): Promise<Blob | null> => {
    try {
      const blob = await generatePDFFromElement(element, {
        ...options,
        filename: 'document'
      });
      return blob;
    } catch (error) {
      console.error('Error getting PDF blob:', error);
      return null;
    }
  };

  /**
   * Obtiene preview en base64 de un PDF
   */
  const getPDFPreview = async (
    element: HTMLElement,
    options: Omit<PDFGenerationOptions, 'filename'>,
    previewScale: number = 0.3
  ): Promise<string | null> => {
    try {
      const blob = await generatePDFFromElement(element, {
        ...options,
        filename: 'preview',
        scale: Math.round(previewScale * (options.scale || 2))
      });

      if (!blob) return null;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error getting PDF preview:', error);
      return null;
    }
  };

  return {
    generatePDFFromElement,
    downloadPDF,
    getPDFBlob,
    getPDFPreview,
    getPageDimensions
  };
};
