import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import { urlFotoAcceso } from '../services/vigilanciaAccesoFoto';
import { archivoEsJpg } from './perfil/comprimirJpg';
import { prepararFotoPerfil } from './perfil/prepararFotoPerfil';
import { axiosErrorMessage } from '../utils/httpError';
import { mostrarToastApp } from '../utils/appToast';
import { TerminosUsoModal } from '../components/TerminosUsoModal';
import type { PersonaResponse } from '../types';

const RH_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const DOC_INPUT_ID = 'vig-registro-doc-input';

function focusDocInput() {
  globalThis.setTimeout(() => {
    document.getElementById(DOC_INPUT_ID)?.focus();
  }, 50);
}

export function VigilanciaRegistroPersonas() {
  const [docInput, setDocInput] = useState('');
  const [persona, setPersona] = useState<PersonaResponse | null>(null);
  const [error, setError] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fotoSrc, setFotoSrc] = useState<string | null>(null);
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null);
  const [fotoAbierta, setFotoAbierta] = useState(false);
  const [camaraAbierta, setCamaraAbierta] = useState(false);
  const [procesandoFoto, setProcesandoFoto] = useState(false);

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [camaraLista, setCamaraLista] = useState(false);
  const [errorCamara, setErrorCamara] = useState('');

  // Form fields
  const [tipoDocumento, setTipoDocumento] = useState<number | undefined>(undefined);
  const [primerNombre, setPrimerNombre] = useState('');
  const [segundoNombre, setSegundoNombre] = useState('');
  const [primerApellido, setPrimerApellido] = useState('');
  const [segundoApellido, setSegundoApellido] = useState('');
  const [celular, setCelular] = useState('');
  const [rh, setRh] = useState('');
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [terminosAbiertos, setTerminosAbiertos] = useState(false);

  const buscar = useCallback(async () => {
    const doc = docInput.trim();
    if (!doc) return;
    setBuscando(true);
    setError('');
    setPersona(null);
    setFotoSrc(null);
    setFotoBlob(null);
    try {
      const p = await apiService.vigilanciaPersonaLookup(doc);
      setPersona(p);
      setTipoDocumento(p.tipo_documento ?? undefined);
      setPrimerNombre(p.primer_nombre || '');
      setSegundoNombre(p.segundo_nombre || '');
      setPrimerApellido(p.primer_apellido || '');
      setSegundoApellido(p.segundo_apellido || '');
      setCelular(p.celular || '');
      setRh(p.rh || '');
      if (p.tiene_foto) {
        const token = localStorage.getItem('token') ?? '';
        const res = await fetch(urlFotoAcceso(p.numero_documento), { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const blob = await res.blob();
          setFotoSrc(URL.createObjectURL(blob));
        }
      }
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Persona no encontrada'));
    } finally {
      setBuscando(false);
    }
  }, [docInput]);

  // Camera effect
  useEffect(() => {
    if (!camaraAbierta) return;
    let stream: MediaStream | undefined;
    setCamaraLista(false);
    setErrorCamara('');
    void navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setCamaraLista(true);
      })
      .catch(() => setErrorCamara('No se pudo abrir la cámara. Puede cargar un JPG del dispositivo.'));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [camaraAbierta]);

  const capturarFoto = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return;
    setProcesandoFoto(true);
    setErrorCamara('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', 0.92));
      if (!blob) return;
      // Misma preparación del perfil: le quito el fondo y lo dejo sobre blanco.
      const lista = await prepararFotoPerfil(blob);
      setFotoBlob(lista);
      setFotoSrc(URL.createObjectURL(lista));
      setCamaraAbierta(false);
    } catch {
      setErrorCamara('No se pudo procesar la foto.');
    } finally {
      setProcesandoFoto(false);
    }
  };

  const cargarArchivo = (archivo: File | undefined) => {
    if (!archivo) return;
    if (!archivoEsJpg(archivo)) {
      setErrorCamara('Solo se permite un archivo JPG.');
      return;
    }
    // Igual que el perfil: proceso con aviso y cierro solo al terminar.
    setProcesandoFoto(true);
    setErrorCamara('');
    void prepararFotoPerfil(archivo)
      .then((lista) => {
        setFotoBlob(lista);
        setFotoSrc(URL.createObjectURL(lista));
        setCamaraAbierta(false);
      })
      .catch(() => setErrorCamara('No se pudo procesar la foto.'))
      .finally(() => setProcesandoFoto(false));
  };

  const guardar = async () => {
    if (!persona) return;
    if (!primerNombre.trim() || !primerApellido.trim()) {
      setError('Primer nombre y primer apellido son requeridos');
      return;
    }
    if (!aceptaTerminos) {
      setError('Debe aceptar los términos de uso y confidencialidad para guardar.');
      return;
    }
    setGuardando(true);
    setError('');
    try {
      await apiService.vigilanciaActualizarDatosBasicos(persona.id, {
        tipo_documento: tipoDocumento,
        primer_nombre: primerNombre.trim(),
        segundo_nombre: segundoNombre.trim(),
        primer_apellido: primerApellido.trim(),
        segundo_apellido: segundoApellido.trim(),
        celular: celular.trim(),
        rh,
        acepta_terminos: true,
      });
      if (fotoBlob) {
        // Ya viene lista de prepararFotoPerfil: JPG 240x300 sin fondo sobre blanco.
        await apiService.vigilanciaSubirFoto(persona.id, fotoBlob);
      }
      mostrarToastApp({
        icon: 'success',
        titulo: 'Persona actualizada',
        texto: 'Los datos de la persona se guardaron correctamente.',
        timer: 3000,
      });
      focusDocInput();
    } catch (e: unknown) {
      setError(axiosErrorMessage(e, 'Error al guardar'));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de personas</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Busca una persona por número de documento y completa sus datos básicos.
      </p>

      {/* Buscador */}
      <div className="flex gap-2">
        <input
          id={DOC_INPUT_ID}
          type="text"
          value={docInput}
          onChange={(e) => setDocInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void buscar(); }}
          placeholder="Número de documento"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="button"
          onClick={() => void buscar()}
          disabled={buscando || !docInput.trim()}
          className="btn-sena flex items-center gap-2"
        >
          <MagnifyingGlassIcon className="h-5 w-5" />
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {persona && (
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          {/* Documento (solo lectura) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Número de documento
            </label>
            <input
              type="text"
              value={persona.numero_documento}
              readOnly
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
            />
          </div>

          {/* Foto */}
          <div className="flex items-center gap-4">
            {fotoSrc ? (
              <button
                type="button"
                onClick={() => setFotoAbierta(true)}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-full"
              >
                <img src={fotoSrc} alt="Foto" className="h-full w-full object-cover" />
              </button>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <CameraIcon className="h-10 w-10 text-gray-400" />
              </div>
            )}
            <div>
              <button
                type="button"
                onClick={() => setCamaraAbierta(true)}
                className="btn-secondary text-sm"
              >
                Tomar / cargar foto
              </button>
              <p className="mt-1 text-xs text-gray-500">Solo JPG, máximo 2 MB</p>
            </div>
          </div>

          {/* Tipo documento */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tipo de documento
            </label>
            <select
              value={tipoDocumento ?? ''}
              onChange={(e) => setTipoDocumento(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Seleccione…</option>
              <option value={1}>Cédula de ciudadanía</option>
              <option value={2}>Tarjeta de identidad</option>
              <option value={3}>Cédula de extranjería</option>
              <option value={4}>Permiso especial</option>
              <option value={5}>PEP</option>
              <option value={6}>Sin documento</option>
            </select>
          </div>

          {/* Nombres */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primer nombre *
              </label>
              <input
                type="text"
                value={primerNombre}
                onChange={(e) => setPrimerNombre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Segundo nombre
              </label>
              <input
                type="text"
                value={segundoNombre}
                onChange={(e) => setSegundoNombre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Primer apellido *
              </label>
              <input
                type="text"
                value={primerApellido}
                onChange={(e) => setPrimerApellido(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Segundo apellido
              </label>
              <input
                type="text"
                value={segundoApellido}
                onChange={(e) => setSegundoApellido(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
          </div>

          {/* Celular y RH */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Celular
              </label>
              <input
                type="text"
                value={celular}
                onChange={(e) => setCelular(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rh
              </label>
              <select
                value={rh}
                onChange={(e) => setRh(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">Seleccione…</option>
                {RH_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aviso de obligatorios y aceptación de términos */}
          <div className="border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
              Los campos marcados con <span className="text-red-600">*</span> son obligatorios.
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-900">
              <input
                type="checkbox"
                checked={aceptaTerminos}
                onChange={(e) => setAceptaTerminos(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-green-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={() => setTerminosAbiertos(true)}
                  className="font-semibold text-green-700 underline hover:text-green-800 dark:text-green-400"
                >
                  términos de uso y confidencialidad
                </button>
              </span>
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => { setPersona(null); setFotoSrc(null); setFotoBlob(null); setDocInput(''); setError(''); }}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="btn-sena"
            >
              {guardando ? 'Guardando…' : 'Guardar datos'}
            </button>
          </div>
        </div>
      )}

      {/* Diálogo de cámara */}
      {camaraAbierta && (
        <dialog open className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section className="w-full max-w-md rounded-2xl bg-white p-4 dark:bg-gray-800">
            <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              Tomar foto
            </h2>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
              La foto debe ser de medio cuerpo, con camisa presentable. Solo se acepta JPG.
            </p>
            <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,.jpg,.jpeg"
              className="sr-only"
              onChange={(e) => cargarArchivo(e.target.files?.[0])}
            />
            {errorCamara ? <p className="mt-2 text-sm text-red-600">{errorCamara}</p> : null}
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCamaraAbierta(false)}
                disabled={procesandoFoto}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-sena"
                onClick={() => fileRef.current?.click()}
                disabled={procesandoFoto}
              >
                Cargar foto
              </button>
              <button
                type="button"
                className="btn-sena"
                onClick={() => void capturarFoto()}
                disabled={procesandoFoto || !camaraLista}
              >
                {procesandoFoto ? 'Procesando…' : 'Tomar foto'}
              </button>
            </div>
          </section>
        </dialog>
      )}

      {/* Lightbox foto */}
      {fotoAbierta && fotoSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setFotoAbierta(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setFotoAbierta(false); }}
          tabIndex={-1}
        >
          <div className="relative">
            <img
              src={fotoSrc}
              alt="Foto ampliada"
              className="max-h-[80vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
            />
            <button
              type="button"
              className="absolute -right-3 -top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-3xl font-bold text-white hover:bg-black/80"
              onClick={() => setFotoAbierta(false)}
            >
              &times;
            </button>
          </div>
        </div>
      ) : null}

      {/* Modal de términos de uso */}
      <TerminosUsoModal abierto={terminosAbiertos} onCerrar={() => setTerminosAbiertos(false)} />
    </div>
  );
}
