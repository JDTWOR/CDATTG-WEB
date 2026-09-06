import { describe, expect, it } from 'vitest';
import {
  extensionDeArchivo,
  validarComprobante,
  esImagenComprobante,
  validarComprobantesSeleccionados,
} from './carnetPerdidaArchivos';

function archivo(nombre: string, type: string, size = 100): File {
  return new File(['x'.repeat(size)], nombre, { type });
}

describe('extensionDeArchivo', () => {
  it('extrae la extensión en minúsculas', () => {
    expect(extensionDeArchivo('pago.PDF')).toBe('pdf');
    expect(extensionDeArchivo('pago.jpg')).toBe('jpg');
    expect(extensionDeArchivo('sin-extension')).toBe('');
  });
});

describe('validarComprobante', () => {
  it('acepta PDF, JPG, PNG y WEBP', () => {
    expect(validarComprobante(archivo('pago.pdf', 'application/pdf'))).toBe('');
    expect(validarComprobante(archivo('foto.jpg', 'image/jpeg'))).toBe('');
    expect(validarComprobante(archivo('foto.png', 'image/png'))).toBe('');
    expect(validarComprobante(archivo('foto.webp', 'image/webp'))).toBe('');
  });

  it('rechaza tipos no permitidos', () => {
    const error = validarComprobante(archivo('datos.txt', 'text/plain'));
    expect(error).toContain('PDF, JPG, PNG o WEBP');
    const error2 = validarComprobante(archivo('pago.rar', 'application/x-rar'));
    expect(error2).toContain('PDF, JPG, PNG o WEBP');
  });

  it('rechaza archivos de más de 2 MB', () => {
    const grande = archivo('pago.pdf', 'application/pdf', 2 * 1024 * 1024 + 1);
    const error = validarComprobante(grande);
    expect(error).toContain('2 MB');
  });

  it('devuelve vacío si no hay archivo', () => {
    expect(validarComprobante(null)).toBe('');
  });
});

describe('validarComprobantesSeleccionados', () => {
  it('pasa si los dos comprobantes son válidos', () => {
    expect(
      validarComprobantesSeleccionados(archivo('pago.pdf', 'application/pdf'), archivo('demanda.jpg', 'image/jpeg')),
    ).toBe('');
  });

  it('avisa cuando falta uno', () => {
    expect(validarComprobantesSeleccionados(archivo('pago.pdf', 'application/pdf'), null)).toContain('dos comprobantes');
  });

  it('avisa si alguno no es válido', () => {
    expect(validarComprobantesSeleccionados(archivo('pago.pdf', 'application/pdf'), archivo('d.txt', 'text/plain'))).toContain(
      'PDF, JPG, PNG o WEBP',
    );
  });
});

describe('esImagenComprobante', () => {
  it('dice si es imagen por MIME o extensión', () => {
    expect(esImagenComprobante(archivo('foto.jpg', 'image/jpeg'))).toBe(true);
    expect(esImagenComprobante(archivo('foto.webp', 'image/webp'))).toBe(true);
    expect(esImagenComprobante(archivo('no-ext', 'application/pdf'))).toBe(false);
    expect(esImagenComprobante(null)).toBe(false);
  });
});