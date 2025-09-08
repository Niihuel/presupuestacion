"use client";
import { Eye, Pencil, Trash2 } from "lucide-react";

type ActionItem = {
	label: string;
	onClick: () => void | Promise<void>;
	variant?: string;
};

type Props = {
	onView?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	actions?: ActionItem[];
};

export function RowActions({ onView, onEdit, onDelete, actions }: Props) {
	if (actions && actions.length > 0) {
		return (
			<div className="flex items-center gap-2">
				{actions.map((action, index) => (
					<button 
						key={index}
						className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded text-xs" 
						onClick={action.onClick}
						title={action.label}
					>
						{action.label === "Ver detalles" && <Eye size={16} />}
						{action.label === "Editar" && <Pencil size={16} />}
						{action.label === "Eliminar" && <Trash2 size={16} />}
						{!["Ver detalles", "Editar", "Eliminar"].includes(action.label) && action.label}
					</button>
				))}
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			{onView && (
				<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded" onClick={onView} title="Ver">
					<Eye size={16} />
				</button>
			)}
			{onEdit && (
				<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded" onClick={onEdit} title="Editar">
					<Pencil size={16} />
				</button>
			)}
			{onDelete && (
				<button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-900 rounded" onClick={onDelete} title="Eliminar">
					<Trash2 size={16} />
				</button>
			)}
		</div>
	);
}


