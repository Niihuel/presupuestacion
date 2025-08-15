import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '@compartido/servicios';
import { Search, Check, ChevronLeft, ChevronRight, User } from 'lucide-react';

const CustomerSelectorTable = ({ value = '', onChange, className = '' }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['customers-selector', { search, page, limit }],
    queryFn: () => customerService.getCustomers({ search, page, limit }),
    keepPreviousData: true,
    staleTime: 2 * 60 * 1000
  });

  const body = data?.data || data;
  const rows = Array.isArray(body?.customers)
    ? body.customers
    : Array.isArray(body)
      ? body
      : [];

  const pagination = body?.pagination || {};
  const totalPages = pagination.totalPages || pagination.pages || 1;

  const handleSelect = (row) => {
    if (onChange) onChange(row);
  };

  return (
    <div className={className}>
      <div className="mb-2 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-3 py-2">Cliente</th>
              <th className="text-left px-3 py-2">Empresa</th>
              <th className="text-left px-3 py-2">Email</th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-gray-500">Cargando...</td>
              </tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  <User className="w-5 h-5 inline-block mr-2 text-gray-400" />
                  Sin resultados
                </td>
              </tr>
            )}
            {!isLoading && rows.map((c) => (
              <tr
                key={c.id}
                className={`hover:bg-blue-50 cursor-pointer ${String(value) === String(c.id) ? 'bg-blue-50' : ''}`}
                onClick={() => handleSelect(c)}
              >
                <td className="px-3 py-2">{c.name || '-'}</td>
                <td className="px-3 py-2">{c.company || c.company_name || '-'}</td>
                <td className="px-3 py-2">{c.email || '-'}</td>
                <td className="px-2 py-2 text-right">{String(value) === String(c.id) && <Check className="w-4 h-4 text-blue-600" />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-600">Página {page} de {totalPages}</span>
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default CustomerSelectorTable;


