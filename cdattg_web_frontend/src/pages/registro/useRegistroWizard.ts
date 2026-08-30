/**
 * Aquí guardo en qué paso va el registro, el borrador (sin la contraseña) y si el campo está bien.
 * Lo usa RegistroFormulario. El borrador está en registroBorrador (localStorage).
 * @author Cristian Deysdayr Jiménez
 */
import { useEffect, useState } from 'react';
import type { RegisterPayload } from '../../services/registerApi';
import { alternarCaracterizacion, idNinguna, parametroIdDesdeChecks } from './caracterizacionSeleccion';
import { borrarBorrador, guardarBorrador, leerBorrador } from './registroBorrador';
import { registroVacio, TOTAL_PASOS, type RegistroErrores } from './registroForm';
import { mensajeCampoRegistro, mensajePasoInvalido, mensajeRegistroInvalido, CAMPOS_POR_PASO } from './registroValidate';
import type { ParametroItem } from '../../types';

/** Arranco con lo guardado, o vacío. La clave nunca vuelve del borrador. */
function estadoInicial() {
  const d = leerBorrador();
  return {
    form: { ...registroVacio, ...d?.form, password: '', password_confirm: '' },
    paso: d?.paso ?? 0,
    ids: d?.ids ?? [],
  };
}

/**
 * Orquesta el flujo por pasos del registro.
 * @returns Formulario, paso, errores y acciones (avanzar, atrás, enviar)
 */
export function useRegistroWizard() {
  // useState(estadoInicial) para no leer localStorage en cada render.
  const [ini] = useState(estadoInicial);
  const [form, setForm] = useState<RegisterPayload>(ini.form);
  const [paso, setPaso] = useState(ini.paso);
  const [ids, setIds] = useState<number[]>(ini.ids);
  const [errores, setErrores] = useState<RegistroErrores>({});
  const [error, setError] = useState('');

  useEffect(() => {
    // Si no escribió nada y sigue en el paso 0, no ensucio localStorage.
    const hayDatos = form.numero_documento || form.email || paso > 0;
    if (hayDatos) guardarBorrador(form, paso, ids);
  }, [form, paso, ids]);

  const setCampo = (k: keyof RegisterPayload, v: string | number) => {
    const next = { ...form, [k]: v };
    setForm(next);
    // Si ese campo ya tenía error, lo vuelvo a validar al escribir.
    setErrores((e) => (e[k] ? { ...e, [k]: mensajeCampoRegistro(next, k) } : e));
  };

  const tocar = (k: keyof RegisterPayload) => {
    setErrores((e) => ({ ...e, [k]: mensajeCampoRegistro(form, k) }));
  };

  const onToggle = (id: number, cars: ParametroItem[]) => {
    const next = alternarCaracterizacion(ids, id, idNinguna(cars));
    setIds(next);
    setCampo('parametro_id', parametroIdDesdeChecks(next));
  };

  const avanzar = (): boolean => {
    const delPaso = CAMPOS_POR_PASO[paso] ?? [];
    const marcados: RegistroErrores = {};
    delPaso.forEach((k) => {
      const m = mensajeCampoRegistro(form, k);
      if (m) marcados[k] = m;
    });
    setErrores((e) => ({ ...e, ...marcados }));
    const msg = mensajePasoInvalido(paso, form);
    if (msg) { setError(msg); return false; }
    setError('');
    setPaso((n) => Math.min(n + 1, TOTAL_PASOS - 1));
    return true;
  };

  const atras = () => { setError(''); setPaso((n) => Math.max(n - 1, 0)); };

  const puedeEnviar = (): string => {
    const msg = mensajeRegistroInvalido(form);
    if (msg) setError(msg);
    else setError('');
    return msg;
  };

  return {
    form, setForm, setCampo, paso, ids, errores, tocar, error, setError,
    onToggle, avanzar, atras, puedeEnviar, limpiarBorrador: borrarBorrador,
  };
}
