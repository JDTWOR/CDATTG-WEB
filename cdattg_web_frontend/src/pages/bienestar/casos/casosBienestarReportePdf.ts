import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CasoBienestarItem, InasistenciaDetalleItem } from '../../../types';
import { formatDiaSemana, formatFechaHoraCompleta, formatFechaVista, formatRangoFechasVista } from '../../../utils/formatFecha';
import { etiquetaPeriodoCasosBienestar } from './casosBienestarUtils';

type JsPdfConAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

export type ReportePdfAprendizParams = Readonly<{
  aprendiz: CasoBienestarItem;
  inasistencias: InasistenciaDetalleItem[];
  inasistenciasJustificadas: InasistenciaDetalleItem[];
  dias: number;
  minFallas: number;
  periodo: { fecha_inicio: string; fecha_fin: string } | null;
}>;

function diaSemanaCorto(fecha: string): string {
  return formatDiaSemana(fecha);
}

function porcentajeAsistencia(aprendiz: CasoBienestarItem): number {
  if (aprendiz.total_sesiones <= 0) return 0;
  const cubiertas = aprendiz.asistencias_efectivas + (aprendiz.inasistencias_justificadas ?? 0);
  return Math.round((cubiertas / aprendiz.total_sesiones) * 100);
}

function tablaDetalleInasistencias(
  doc: JsPdfConAutoTable,
  titulo: string,
  items: InasistenciaDetalleItem[],
  margen: number,
  y: number,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(titulo, margen, y);
  y += 4;

  if (items.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Sin registros en el período consultado.', margen, y + 4);
    doc.setTextColor(0, 0, 0);
    return y + 10;
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [['Fecha', 'Día', 'Instructor', 'Observaciones']],
    headStyles: { fillColor: [55, 65, 81], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 28 },
      2: { cellWidth: 45 },
      3: { cellWidth: 'auto' },
    },
    body: items.map((item) => [
      formatFechaVista(item.fecha),
      diaSemanaCorto(item.fecha),
      item.instructor_nombre?.trim() || 'Sin registrar',
      item.observaciones?.trim() || '-',
    ]),
  });

  return doc.lastAutoTable.finalY + 8;
}

function sanitizarNombreArchivo(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
}

export function nombreArchivoReporteAprendiz(aprendiz: CasoBienestarItem): string {
  const doc = sanitizarNombreArchivo(aprendiz.numero_documento);
  const ficha = sanitizarNombreArchivo(aprendiz.ficha_numero);
  const fecha = new Date().toISOString().slice(0, 10);
  return `seguimiento_bienestar_ficha_${ficha}_${doc}_${fecha}.pdf`;
}

export function generarReportePdfAprendiz({
  aprendiz,
  inasistencias,
  inasistenciasJustificadas,
  dias,
  minFallas,
  periodo,
}: ReportePdfAprendizParams): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' }) as JsPdfConAutoTable;
  const margen = 14;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  const rango = formatRangoFechasVista(periodo?.fecha_inicio, periodo?.fecha_fin, ' a ');
  const pct = porcentajeAsistencia(aprendiz);
  const generado = formatFechaHoraCompleta();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Reporte de seguimiento — Bienestar al Aprendiz', margen, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Sistema de información CDATTG · Alerta por inasistencias reiteradas', margen, y);
  y += 8;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Identificación del aprendiz', margen, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  const datosAprendiz = [
    ['Nombre completo', aprendiz.persona_nombre],
    ['N.º de documento', aprendiz.numero_documento],
    ['Ficha de caracterización', aprendiz.ficha_numero],
    ['Sede', aprendiz.sede_nombre || '-'],
    ['Programa de formación', aprendiz.programa_nombre?.trim() || '-'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [60, 60, 60] },
      1: { cellWidth: ancho - 45 },
    },
    body: datosAprendiz,
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Parámetros del análisis', margen, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 1.2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45, textColor: [60, 60, 60] },
      1: { cellWidth: ancho - 45 },
    },
    body: [
      ['Ventana de análisis', rango ?? etiquetaPeriodoCasosBienestar(dias, periodo?.fecha_inicio, periodo?.fecha_fin)],
      ['Umbral de alerta', `${minFallas} o más inasistencias sin justificar`],
      ['Fecha de generación', generado],
    ],
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de asistencia en el período', margen, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [['Indicador', 'Valor']],
    headStyles: { fillColor: [245, 158, 11], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'right' },
    },
    body: [
      ['Sesiones evaluadas', String(aprendiz.total_sesiones)],
      ['Asistencias registradas', String(aprendiz.asistencias_efectivas)],
      ['Inasistencias sin justificar', String(aprendiz.inasistencias)],
      ['Inasistencias justificadas', String(aprendiz.inasistencias_justificadas ?? 0)],
      ['Porcentaje de cumplimiento', `${pct}%`],
    ],
  });

  y = doc.lastAutoTable.finalY + 8;

  y = tablaDetalleInasistencias(
    doc,
    'Detalle de inasistencias sin justificar',
    inasistencias,
    margen,
    y,
  );
  tablaDetalleInasistencias(
    doc,
    'Detalle de inasistencias justificadas',
    inasistenciasJustificadas,
    margen,
    y,
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(
      'Metodología: sesiones en días con formación programada. Excluye festivos y PARO. Las inasistencias justificadas tienen el tipo de observación «Inasistencia justificada» y no cuentan para el umbral de alerta.',
      margen,
      doc.internal.pageSize.getHeight() - 10,
      { maxWidth: ancho },
    );
    doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() - margen, doc.internal.pageSize.getHeight() - 5, {
      align: 'right',
    });
  }

  doc.save(nombreArchivoReporteAprendiz(aprendiz));
}
