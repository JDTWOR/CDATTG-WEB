/**
 * @module services/registerApi
 * @description Alta pública de usuario y contraseña.
 * @author Cristian Deysdayr Jiménez
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export type RegisterPayload = {
  tipo_documento: number;
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre: string;
  primer_apellido: string;
  segundo_apellido: string;
  fecha_nacimiento: string;
  genero: number;
  telefono: string;
  celular: string;
  email: string;
  pais_id: number;
  departamento_id: number;
  municipio_id: number;
  direccion: string;
  parametro_id: number;
  password: string;
  password_confirm: string;
};

/**
 * Crea persona y usuario VISITANTE.
 */
export async function registrarUsuario(body: RegisterPayload): Promise<void> {
  await axios.post(`${API_BASE_URL}/auth/register`, body);
}
