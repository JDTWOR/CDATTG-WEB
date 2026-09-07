/**
 * Tipos del submódulo de notificaciones (campana y buzón).
 *
 * @author Cristian Deysdayr Jiménez
 */

export type NotificacionItem = {
  id: number;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida_en: string | null;
  creada_en: string;
  created_at: string;
};

export type NotificacionesResponse = {
  items: NotificacionItem[];
  total: number;
};