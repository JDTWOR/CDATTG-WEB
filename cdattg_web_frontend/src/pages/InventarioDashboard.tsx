import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, ExclamationTriangleIcon, ShoppingCartIcon, ClockIcon } from '@heroicons/react/24/outline';
import { apiService } from '../services/api';
import type { InventarioDashboardResponse } from '../types';

export const InventarioDashboard = () => {
  const [data, setData] = useState<InventarioDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await apiService.getInventarioDashboard();
        setData(res);
      } catch (err: unknown) {
        setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cargar el dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-gray-500 dark:text-gray-400">Cargando...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-700 dark:text-red-300">
        {error || 'No se pudo cargar el dashboard'}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total productos',
      value: data.total_productos,
      icon: CubeIcon,
      color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
      path: '/inventario/productos',
    },
    {
      title: 'Stock bajo',
      value: data.stock_bajo,
      icon: ExclamationTriangleIcon,
      color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      path: '/inventario/productos',
    },
    {
      title: 'Stock crítico',
      value: data.stock_critico,
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      path: '/inventario/productos',
    },
    {
      title: 'Órdenes en espera',
      value: data.ordenes_en_espera,
      icon: ClockIcon,
      color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
      path: '/inventario/ordenes/pendientes',
    },
    {
      title: 'Órdenes hoy',
      value: data.ordenes_hoy,
      icon: ShoppingCartIcon,
      color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      path: '/inventario/ordenes',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Inventario</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Resumen del módulo de inventario</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.path}
              className="card p-6 hover:ring-2 hover:ring-primary-500 transition-all"
            >
              <div className={`inline-flex p-3 rounded-lg ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-400">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </Link>
          );
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Acciones rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/inventario/productos" className="btn-primary">
            Ver productos
          </Link>
          <Link to="/inventario/ordenes" className="btn-secondary">
            Ver órdenes
          </Link>
          <Link to="/inventario/ordenes/pendientes" className="btn-secondary">
            Pendientes de aprobación
          </Link>
          <Link to="/inventario/devoluciones" className="btn-secondary">
            Registrar devolución
          </Link>
        </div>
      </div>
    </div>
  );
};
