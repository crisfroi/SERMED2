import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface Props {
  solicitud: {
    numero_solicitud?: string | null;
    nombre_establecimiento: string;
    categoria: string;
    sector: string;
    provincia: string;
    distrito: string;
    distrito_sanitario?: string | null;
  };
}

export default function EstablishmentApprovalLetter({ solicitud }: Props) {
  const today = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    const payload = {
      tipo: "ResolucionEstablecimiento",
      numero: solicitud.numero_solicitud || null,
      nombre: solicitud.nombre_establecimiento,
      categoria: solicitud.categoria,
      sector: solicitud.sector,
      ubicacion: `${solicitud.distrito}, ${solicitud.provincia}`,
      generado: new Date().toISOString(),
    };
    const text = JSON.stringify(payload);
    QRCode.toDataURL(text, { width: 256, margin: 1, errorCorrectionLevel: 'M' })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [solicitud]);

  const downloadPDF = async () => {
    const element = document.getElementById("facility-approval-letter");
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = (pdf as any).getImageProperties(imgData);
    const imgWidth = pageWidth - 20;
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, Math.min(imgHeight, pageHeight - 20));
    pdf.save(`Resolucion-${solicitud.numero_solicitud || solicitud.nombre_establecimiento}.pdf`);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={downloadPDF}>
          <Download className="w-4 h-4 mr-2" /> Descargar PDF
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <div id="facility-approval-letter" className="bg-white" style={{ fontSize: 11, lineHeight: 1.4 }}>
            <div className="mb-4">
              <div className="flex justify-between items-start">
                <div className="flex-shrink-0 -mt-2">
                  <img src="https://cdn.builder.io/api/v1/image/assets%2F696aeb7245c24fa8957a85fb78836206%2F9f0f84e2fe5c4ac7bf20d675db3ea3cc?format=webp&width=800" alt="Guinea Ecuatorial Salud" className="h-16 w-auto" />
                </div>
                <div className="flex-1 text-right">
                  <h1 className="text-lg font-bold mb-2 text-center">REPÚBLICA DE GUINEA ECUATORIAL</h1>
                  <h2 className="text-base font-semibold text-center">MINISTERIO DE SANIDAD Y BIENESTAR SOCIAL</h2>
                  <h3 className="text-sm font-medium text-center">DIRECCIÓN GENERAL DE RECURSOS HUMANOS</h3>
                </div>
              </div>
              <div className="border-b-2 border-black mt-4 mb-3"></div>
            </div>

            <div className="text-right mb-4">
              <p>{solicitud.distrito || "Malabo"}, {today}</p>
            </div>

            <div className="mb-3">
              <p className="font-semibold">EXPEDIENTE: {solicitud.numero_solicitud || "—"}</p>
              <p className="font-semibold">ASUNTO: Aprobación de Alta de Establecimiento Sanitario</p>
            </div>

            <div className="mb-4 space-y-3 text-justify">
              <p className="font-semibold text-center mb-4">RESOLUCIÓN MINISTERIAL DE ALTA DE ESTABLECIMIENTO SANITARIO</p>

              <p>
                En virtud de las atribuciones conferidas por la normativa sanitaria vigente en la República de Guinea Ecuatorial, y tras el análisis del expediente, se resuelve lo siguiente respecto al establecimiento:
              </p>

              <div className="bg-gray-50 p-4" style={{ borderLeft: "4px solid #14b8a6" }}>
                <p><strong>Nombre:</strong> {solicitud.nombre_establecimiento}</p>
                <p><strong>Categoría:</strong> {solicitud.categoria}</p>
                <p><strong>Sector:</strong> {solicitud.sector}</p>
                <p><strong>Ubicación:</strong> {solicitud.distrito}, {solicitud.provincia}{solicitud.distrito_sanitario ? ` • Distrito Sanitario: ${solicitud.distrito_sanitario}` : ''}</p>
              </div>

              <p><strong>RESUELVO:</strong></p>
              <p><strong>PRIMERO:</strong> APROBAR la solicitud de alta del establecimiento sanitario indicado, autorizando su funcionamiento conforme a su categoría y servicios previstos.</p>
              <p><strong>SEGUNDO:</strong> INSCRIBIR el establecimiento en el Registro Nacional de Centros de Salud, con los datos que obran en el expediente.</p>
              <p><strong>TERCERO:</strong> NOTIFICAR a las autoridades sanitarias competentes y al solicitante la presente resolución.</p>
              <p>Esta resolución será efectiva a partir de la fecha de su firma.</p>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-8">
              <div className="text-center">
                <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
                <p className="font-semibold">DIRECTOR GENERAL</p>
                <p className="text-sm">Recursos Humanos Sanitarios</p>
              </div>
              <div className="text-center">
                <div className="border-t border-black w-48 mx-auto mb-2 mt-16"></div>
                <p className="font-semibold">MINISTRO DE SANIDAD</p>
                <p className="font-semibold">Y BIENESTAR SOCIAL</p>
                <p className="text-sm">República de Guinea Ecuatorial</p>
              </div>
            </div>

            <div className="mt-8 text-xs text-gray-600 text-center border-t pt-4">
              <p>Ministerio de Sanidad y Bienestar Social - República de Guinea Ecuatorial</p>
              <p>Registro Nacional de Centros de Salud</p>
              <p>Generado el {today}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
