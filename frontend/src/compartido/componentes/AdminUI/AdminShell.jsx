import React from 'react';
import { cn } from '@compartido/utilidades/cn';

export const AdminShell = ({ title, subtitle, actions, children, className = '' }) => {
	return (
		<div className={cn('space-y-6', className)}>
			<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">{title}</h1>
						{subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
					</div>
					{actions && <div className="flex items-center gap-2">{actions}</div>}
				</div>
			</div>
			{children}
		</div>
	);
};

export const AdminCard = ({ title, description, headerExtra, children, className = '' }) => (
	<div className={cn('bg-white rounded-xl shadow-sm border border-gray-200', className)}>
		{(title || description || headerExtra) && (
			<div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between">
				<div>
					{title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
					{description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
				</div>
				{headerExtra}
			</div>
		)}
		<div className="p-4 sm:p-6">{children}</div>
	</div>
);

export const AdminToolbar = ({ children, className = '' }) => (
	<div className={cn('bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4', className)}>
		<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
			{children}
		</div>
	</div>
);

export const AdminTable = ({ children, className = '' }) => (
	<div className={cn('overflow-x-auto rounded-lg border border-gray-200', className)}>
		<table className="min-w-full divide-y divide-gray-200">{children}</table>
	</div>
);

export const AdminModal = ({ title, description, isOpen, onClose, children, footer, side = false }) => {
	if (!isOpen) return null;
	return (
		<div className="fixed inset-0 bg-black/50 z-50 flex">
			<div className="ml-auto h-full w-full max-w-2xl bg-white shadow-xl rounded-none sm:rounded-l-2xl overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
				<div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-start justify-between">
					<div>
						<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
						{description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
					</div>
					<button onClick={onClose} className="inline-flex items-center px-2 py-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md" aria-label="Cerrar">✕</button>
				</div>
				<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">{children}</div>
				{footer && <div className="px-4 sm:px-6 py-3 border-t border-gray-100 bg-gray-50">{footer}</div>}
			</div>
		</div>
	);
};

export const AdminEmpty = ({ icon = null, title = 'Sin datos', description = 'Aún no hay información para mostrar', action = null }) => (
	<div className="text-center py-12">
		<div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
			{icon || <span>☁</span>}
		</div>
		<h4 className="text-gray-900 font-semibold">{title}</h4>
		<p className="text-gray-600 text-sm mt-1">{description}</p>
		{action && <div className="mt-4">{action}</div>}
	</div>
);

export const AdminToast = ({ type = 'success', title, description }) => (
	<div className={cn('rounded-md p-3 text-sm', type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-yellow-50 text-yellow-800 border border-yellow-200')}>
		<div className="font-medium">{title}</div>
		{description && <div className="mt-1">{description}</div>}
	</div>
);

export default AdminShell;