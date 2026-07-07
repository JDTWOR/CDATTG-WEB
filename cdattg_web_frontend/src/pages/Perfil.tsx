import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  EnvelopeIcon,
  IdentificationIcon,
  MapPinIcon,
  PhoneIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ChevronDownIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { axiosErrorMessage } from '../utils/httpError';
import { formatRoleLabel } from '../utils/roles';
import { PersonaModal } from '../components/PersonaModal';
import type { PersonaRequest, PersonaResponse, PersonaSelfUpdateRequest, UserResponse } from '../types';

const PERM_EDITAR_MI_PERSONA = 'EDITAR MI PERSONA';

function personaRequestToSelfUpdate(data: PersonaRequest): PersonaSelfUpdateRequest {
  return {
    tipo_documento: data.tipo_documento,
    primer_nombre: data.primer_nombre,
    segundo_nombre: data.segundo_nombre,
    primer_apellido: data.primer_apellido,
    segundo_apellido: data.segundo_apellido,
    fecha_nacimiento: data.fecha_nacimiento,
    genero: data.genero,
    telefono: data.telefono,
    celular: data.celular,
    email: data.email,
    pais_id: data.pais_id,
    departamento_id: data.departamento_id,
    municipio_id: data.municipio_id,
    direccion: data.direccion,
    parametro_id: data.parametro_id,
    nivel_escolaridad_id: data.nivel_escolaridad_id,
  };
}

function resolveFullName(persona: PersonaResponse | null, user: UserResponse | null): string {
  if (persona?.full_name) return persona.full_name;
  if (user?.full_name) return user.full_name;
  return [persona?.primer_nombre, persona?.segundo_nombre, persona?.primer_apellido, persona?.segundo_apellido]
    .filter(Boolean)
    .join(' ');
}

function resolveEmail(persona: PersonaResponse | null, user: UserResponse | null): string {
  return persona?.email || user?.email || '';
}

function usePerfilPersona(user: UserResponse | null) {
  const [persona, setPersona] = useState<PersonaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user?.persona_id) {
        setLoading(false);
        return;
      }
      try {
        setError('');
        const p = await apiService.getPersonaById(user.persona_id);
        setPersona(p);
      } catch (e: unknown) {
        setError(axiosErrorMessage(e, 'No se pudo cargar la información de la persona.'));
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [user]);

  return { persona, setPersona, loading, error };
}

type InfoRowProps = Readonly<{
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}>;

function InfoRow({ icon, label, value, href }: InfoRowProps) {
  const display = value || '—';
  const valueClass =
    'text-sm font-medium text-gray-900 dark:text-white break-all sm:break-normal';

  return (
    <div className="flex gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
        {href && display !== '—' ? (
          <a href={href} className={`${valueClass} text-primary-600 dark:text-primary-400 hover:underline`}>
            {display}
          </a>
        ) : (
          <p className={valueClass}>{display}</p>
        )}
      </div>
    </div>
  );
}

function permisosResumen(count: number): string {
  if (count === 0) return 'Sin permisos directos adicionales';
  const etiqueta = count === 1 ? 'permiso asignado' : 'permisos asignados';
  return `${count} ${etiqueta}`;
}

function ProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-36 rounded-2xl bg-gray-200 dark:bg-gray-700" />
      <div className="h-48 rounded-2xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

function AlertBanner({ message }: Readonly<{ message: string }>) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
    >
      {message}
    </div>
  );
}

type PerfilPageHeaderProps = Readonly<{
  showEdit: boolean;
  onEdit: () => void;
}>;

function PerfilPageHeader({ showEdit, onEdit }: PerfilPageHeaderProps) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Mi perfil</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 sm:text-base">
          Tus datos, roles y permisos en el sistema.
        </p>
      </div>
      {showEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="btn-primary inline-flex shrink-0 items-center justify-center gap-2 self-start"
        >
          <PencilSquareIcon className="h-5 w-5" />
          Editar datos
        </button>
      ) : null}
    </header>
  );
}

type PerfilHeroSectionProps = Readonly<{
  loading: boolean;
  fullName: string;
  email: string;
  initial: string;
  user: UserResponse | null;
  roles: string[];
}>;

function PerfilHeroSection({ loading, fullName, email, initial, user, roles }: PerfilHeroSectionProps) {
  const displayName = loading && !fullName ? 'Cargando…' : fullName || 'Usuario sin nombre';
  const statusActive = Boolean(user?.status);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 px-4 pb-8 pt-6 sm:px-6">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-end sm:gap-5 sm:text-left">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/30 bg-white/20 text-3xl font-bold text-white shadow-lg sm:h-24 sm:w-24">
            {initial}
          </div>
          <div className="mt-4 min-w-0 sm:mt-0 sm:pb-1">
            <h2 className="text-xl font-bold leading-tight text-white sm:text-2xl">{displayName}</h2>
            {email ? <p className="mt-1 break-all text-sm text-primary-100">{email}</p> : null}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  statusActive
                    ? 'bg-emerald-500/25 text-emerald-50 ring-1 ring-emerald-300/50'
                    : 'bg-red-500/25 text-red-50 ring-1 ring-red-300/50'
                }`}
              >
                {statusActive ? 'Usuario activo' : 'Usuario inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {roles.length > 0 ? (
        <div className="border-t border-gray-100 px-4 py-4 dark:border-gray-700 sm:px-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <ShieldCheckIcon className="h-4 w-4" />
            Roles
          </p>
          <ul className="flex flex-wrap justify-center gap-2 sm:justify-start">
            {roles.map((rol) => (
              <li
                key={rol}
                className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800 dark:bg-primary-900/50 dark:text-primary-200"
              >
                {formatRoleLabel(rol)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

type PerfilContactoSectionProps = Readonly<{
  loading: boolean;
  persona: PersonaResponse | null;
  email: string;
}>;

function PerfilContactoSection({ loading, persona, email }: PerfilContactoSectionProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-gray-800 sm:p-6">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
        <UserCircleIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        Datos de contacto
      </h2>
      {loading && !persona ? (
        <p className="py-4 text-sm text-gray-500 dark:text-gray-400">Cargando datos…</p>
      ) : null}
      {!loading && !persona ? (
        <p className="py-4 text-sm text-gray-500 dark:text-gray-400">
          No hay persona vinculada a este usuario.
        </p>
      ) : null}
      {persona ? (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          <InfoRow
            icon={<IdentificationIcon className="h-5 w-5" />}
            label="Documento"
            value={persona.numero_documento}
          />
          <InfoRow
            icon={<EnvelopeIcon className="h-5 w-5" />}
            label="Correo"
            value={email}
            href={email ? `mailto:${email}` : undefined}
          />
          <InfoRow
            icon={<DevicePhoneMobileIcon className="h-5 w-5" />}
            label="Celular"
            value={persona.celular || ''}
            href={persona.celular ? `tel:${persona.celular.replace(/\s/g, '')}` : undefined}
          />
          <InfoRow
            icon={<PhoneIcon className="h-5 w-5" />}
            label="Teléfono"
            value={persona.telefono || ''}
            href={persona.telefono ? `tel:${persona.telefono.replace(/\s/g, '')}` : undefined}
          />
          <InfoRow
            icon={<MapPinIcon className="h-5 w-5" />}
            label="Dirección"
            value={persona.direccion || ''}
          />
        </div>
      ) : null}
    </section>
  );
}

type PerfilPermisosSectionProps = Readonly<{
  permissions: string[];
}>;

function PerfilPermisosSection({ permissions }: PerfilPermisosSectionProps) {
  const permCount = permissions.length;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800 sm:p-0">
      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 touch-manipulation sm:px-6 [&::-webkit-details-marker]:hidden">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              Permisos efectivos
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
              {permisosResumen(permCount)}
            </p>
          </div>
          <ChevronDownIcon className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" />
        </summary>
        <div className="border-t border-gray-100 px-4 pb-4 dark:border-gray-700 sm:px-6 sm:pb-6">
          {permCount === 0 ? (
            <p className="pt-3 text-sm text-gray-500 dark:text-gray-400">
              Los permisos de tu cuenta provienen únicamente de tus roles.
            </p>
          ) : (
            <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto overscroll-contain rounded-xl bg-gray-50 p-2 dark:bg-gray-900/50 sm:max-h-72">
              {permissions.map((perm) => (
                <li
                  key={perm}
                  className="rounded-lg px-3 py-2 text-xs leading-snug text-gray-700 dark:text-gray-300 sm:text-sm"
                >
                  {perm}
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </section>
  );
}

type PerfilContentProps = Readonly<{
  loading: boolean;
  fullName: string;
  email: string;
  initial: string;
  user: UserResponse | null;
  roles: string[];
  permissions: string[];
  persona: PersonaResponse | null;
}>;

function PerfilContent({
  loading,
  fullName,
  email,
  initial,
  user,
  roles,
  permissions,
  persona,
}: PerfilContentProps) {
  return (
    <>
      <PerfilHeroSection
        loading={loading}
        fullName={fullName}
        email={email}
        initial={initial}
        user={user}
        roles={roles}
      />
      <PerfilContactoSection loading={loading} persona={persona} email={email} />
      <PerfilPermisosSection permissions={permissions} />
    </>
  );
}

export const Perfil = () => {
  const { user, roles, permissions, hasPermission } = useAuth();
  const { persona, setPersona, loading, error } = usePerfilPersona(user);
  const [editOpen, setEditOpen] = useState(false);
  const [saveError, setSaveError] = useState('');

  const puedeEditarPerfil = hasPermission(PERM_EDITAR_MI_PERSONA) && Boolean(user?.persona_id);
  const fullName = resolveFullName(persona, user);
  const email = resolveEmail(persona, user);
  const initial = (fullName || email || '?').charAt(0).toUpperCase();
  const showSkeleton = loading && !fullName && !error;
  const showContent = !loading || Boolean(fullName);

  const handleSavePerfil = useCallback(
    async (data: PersonaRequest) => {
      try {
        setSaveError('');
        const updated = await apiService.updateMiPersona(personaRequestToSelfUpdate(data));
        setPersona(updated);
        setEditOpen(false);
        if (updated.email && user && updated.email !== user.email) {
          const refreshed = await apiService.getCurrentUser();
          localStorage.setItem('user', JSON.stringify(refreshed));
        }
      } catch (e: unknown) {
        const msg = axiosErrorMessage(e, 'No se pudo guardar los cambios.');
        setSaveError(msg);
        alert(msg);
      }
    },
    [setPersona, user],
  );

  const openEdit = useCallback(() => {
    setSaveError('');
    setEditOpen(true);
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-8 sm:space-y-6">
      <PerfilPageHeader showEdit={puedeEditarPerfil && Boolean(persona)} onEdit={openEdit} />

      {saveError ? <AlertBanner message={saveError} /> : null}
      {error ? <AlertBanner message={error} /> : null}
      {showSkeleton ? <ProfileSkeleton /> : null}

      {showContent ? (
        <PerfilContent
          loading={loading}
          fullName={fullName}
          email={email}
          initial={initial}
          user={user}
          roles={roles}
          permissions={permissions}
          persona={persona}
        />
      ) : null}

      {editOpen && persona ? (
        <PersonaModal
          persona={persona}
          selfService
          onClose={() => setEditOpen(false)}
          onSave={(data) => {
            void handleSavePerfil(data);
          }}
        />
      ) : null}
    </div>
  );
};
