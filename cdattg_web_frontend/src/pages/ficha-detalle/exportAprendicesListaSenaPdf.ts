import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoSenaSvg from '../../../logo-sena-verde-complementario-svg-2022.svg';
import logoColombiaUrl from '../../assets/oficio-sena/logo-colombia.png';
import pieSenaUrl from '../../assets/oficio-sena/pie-sena-comunica.png';
import {
  CENTRO_NOMBRE,
  CODIGO_FORMATO,
  PIE_DIRECCION,
} from '../bienestar/alertas-consecutivas/oficioSenaAlertasTexto';
import { hoyISOColombia } from '../../utils/formatFecha';
import type { AprendizResponse, FichaCaracterizacionResponse } from '../../types';

const VERDE_SENA: [number, number, number] = [57, 169, 0];
const GRIS_TEXTO: [number, number, number] = [40, 40, 40];
const PAGE: [number, number] = [215.9, 330.2];
const MARGEN = 30;
const PIE_RESERVA = 42;

type JsPdfConAutoTable = jsPDF & {
  lastAutoTable: { finalY: number };
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo cargar el membrete institucional.'));
    img.src = src;
  });
}

function imageToPngDataUrl(img: HTMLImageElement, longEdgePx: number): string {
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  const width = ratio >= 1 ? longEdgePx : Math.max(1, Math.round(longEdgePx * ratio));
  const height = ratio >= 1 ? Math.max(1, Math.round(longEdgePx / ratio)) : longEdgePx;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo rasterizar el logo institucional.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL('image/png');
}

function fitLogo(img: HTMLImageElement, maxW: number, maxH: number): { w: number; h: number } {
  const ratio = img.naturalWidth / Math.max(1, img.naturalHeight);
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) {
    h = maxH;
    w = h * ratio;
  }
  return { w, h };
}

function addLogo(
  doc: jsPDF,
  img: HTMLImageElement,
  x: number,
  y: number,
  maxW: number,
  maxH: number,
): { w: number; h: number } {
  const size = fitLogo(img, maxW, maxH);
  const px = Math.round(Math.max(size.w, size.h) * 12);
  doc.addImage(imageToPngDataUrl(img, px), 'PNG', x, y, size.w, size.h, undefined, 'NONE');
  return size;
}

function sanitizarNombreArchivo(valor: string): string {
  return valor.replaceAll(/[^\w.-]+/g, '_').replaceAll(/_+/g, '_').slice(0, 80);
}

export function nombreArchivoListaAprendices(fichaNumero: string): string {
  return `lista_aprendices_ficha_${sanitizarNombreArchivo(fichaNumero)}.pdf`;
}

export function aprendicesActivosOrdenados(aprendices: AprendizResponse[]): AprendizResponse[] {
  return aprendices
    .filter((a) => a.estado)
    .slice()
    .sort((a, b) => (a.persona_nombre || '').localeCompare(b.persona_nombre || '', 'es'));
}

type MembreteAssets = Readonly<{
  logoColombia: HTMLImageElement;
  logoSena: HTMLImageElement;
  pieSena: HTMLImageElement;
}>;

function dibujarMembrete(doc: jsPDF, assets: MembreteAssets): number {
  const pageW = doc.internal.pageSize.getWidth();
  const headerTop = 8;
  const colombia = addLogo(doc, assets.logoColombia, MARGEN, headerTop + 4, 52, 16);
  const sena = fitLogo(assets.logoSena, 26, 26);
  addLogo(doc, assets.logoSena, pageW - MARGEN - sena.w, headerTop, 26, 26);
  const headerBottom = Math.max(headerTop + 4 + colombia.h, headerTop + sena.h) + 4;
  doc.setDrawColor(...VERDE_SENA);
  doc.setLineWidth(0.45);
  doc.line(MARGEN, headerBottom, pageW - MARGEN, headerBottom);
  return headerBottom;
}

function dibujarPie(doc: jsPDF, assets: MembreteAssets): void {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const lineaPieY = pageH - PIE_RESERVA;
  doc.setDrawColor(...VERDE_SENA);
  doc.setLineWidth(0.35);
  doc.line(MARGEN, lineaPieY, pageW - MARGEN, lineaPieY);
  addLogo(doc, assets.pieSena, (pageW - 42) / 2, lineaPieY + 2, 42, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...VERDE_SENA);
  doc.text(CENTRO_NOMBRE, pageW / 2, pageH - 10, { align: 'center' });
  doc.text(PIE_DIRECCION, pageW / 2, pageH - 5.5, { align: 'center' });
  doc.setFontSize(7);
  doc.text(CODIGO_FORMATO, pageW - 8, pageH / 2, { align: 'center', angle: 90 });
}

export async function exportarListaAprendicesSenaPdf(
  ficha: FichaCaracterizacionResponse,
  aprendices: AprendizResponse[],
): Promise<void> {
  const assets: MembreteAssets = {
    logoColombia: await loadImage(logoColombiaUrl),
    logoSena: await loadImage(logoSenaSvg),
    pieSena: await loadImage(pieSenaUrl),
  };

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: PAGE }) as JsPdfConAutoTable;
  const pageW = doc.internal.pageSize.getWidth();
  const ancho = pageW - MARGEN * 2;
  const activos = aprendicesActivosOrdenados(aprendices);
  const programa = ficha.programa_formacion_nombre || ficha.nombre || '—';
  const fecha = hoyISOColombia();

  const headerBottom = dibujarMembrete(doc, assets);
  let y = headerBottom + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...GRIS_TEXTO);
  doc.text('LISTA DE APRENDICES', pageW / 2, y, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Ficha de caracterizaci뿯½n: ${ficha.ficha}`, MARGEN, y);
  y += 5;
  doc.text(`Programa: ${programa}`, MARGEN, y);
  y += 5;
  doc.text(`Jornada: ${ficha.jornada_nombre || '—'}`, MARGEN, y);
  y += 5;
  doc.text(`Instructor l뿯½der: ${ficha.instructor_nombre || '—'}`, MARGEN, y);
  y += 5;
  doc.text(`Sede: ${ficha.sede_nombre || '—'}`, MARGEN, y);
  y += 5;
  doc.text(`Fecha de generaci뿯½n: ${fecha}   Total aprendices: ${activos.length}`, MARGEN, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    margin: { top: 48, left: MARGEN, right: MARGEN, bottom: PIE_RESERVA + 4 },
    head: [['No.', 'Nombre completo', 'Documento', 'Estado']],
    headStyles: {
      fillColor: VERDE_SENA,
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak', textColor: GRIS_TEXTO },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 38 },
      3: { cellWidth: 32, halign: 'center' },
    },
    body: activos.map((a, idx) => [
      String(idx + 1),
      a.persona_nombre || '—',
      a.persona_documento || '—',
      a.oculto_en_asistencia ? 'Oculto en asistencia' : 'Activo',
    ]),
    didDrawPage: () => {
      dibujarMembrete(doc, assets);
      dibujarPie(doc, assets);
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 0) {
        data.cell.styles.halign = 'center';
      }
    },
  });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  const notaY = Math.min(doc.lastAutoTable.finalY + 6, doc.internal.pageSize.getHeight() - PIE_RESERVA - 6);
  doc.text(`Documento generado con formato institucional ${CODIGO_FORMATO}.`, MARGEN, notaY, {
    maxWidth: ancho,
  });

  doc.save(nombreArchivoListaAprendices(ficha.ficha));
}
