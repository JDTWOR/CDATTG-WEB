/**
 * Pruebo el giro y el nombre del video del carnet.
 *
 * @author Cristian Deysdayr Jiménez
 */
import { describe, expect, it } from 'vitest';
import { anguloGiroCarnet, caraVisibleEnGiro, mimeVideoCarnet, nombreVideoCarnet, tamanoDibujo } from '../carnetVideoGiro';

describe('giro del carnet', () => {
  it('empieza de cara y termina de reverso', () => {
    expect(anguloGiroCarnet(0)).toBe(0);
    expect(anguloGiroCarnet(700)).toBe(0);
    expect(anguloGiroCarnet(2100)).toBe(180);
    expect(anguloGiroCarnet(3200)).toBe(180);
  });

  it('a la mitad del giro ya no se ve la cara', () => {
    const mitad = anguloGiroCarnet(1400);
    expect(mitad).toBeGreaterThan(80);
    expect(caraVisibleEnGiro(45)).toBe(true);
    expect(caraVisibleEnGiro(90)).toBe(false);
  });
});

describe('nombreVideoCarnet', () => {
  it('limpia el nombre y usa webm', () => {
    expect(nombreVideoCarnet('Ana Rojas', '1120', 'video/webm')).toBe('carnet-ana-rojas-1120.webm');
  });

  it('usa mp4 si el navegador lo pide', () => {
    expect(nombreVideoCarnet('???', '', 'video/mp4')).toBe('carnet-digital.mp4');
  });

  it('sin grabadora no hay tipo de video', () => {
    expect(mimeVideoCarnet() === '' || mimeVideoCarnet().startsWith('video/')).toBe(true);
  });

  it('no estira el carnet', () => {
    const t = tamanoDibujo(400, 800, 400, 800, 1);
    expect(t.dw).toBe(400);
    expect(t.dh).toBe(800);
    const fino = tamanoDibujo(400, 800, 400, 800, 0.5);
    expect(fino.dw).toBe(200);
    expect(fino.dh).toBe(800);
  });
});
