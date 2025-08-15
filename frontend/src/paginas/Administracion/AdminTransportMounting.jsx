import React from 'react';
import TarifasTransporte from './TarifasTransporte.jsx';
import TarifasMontaje from './TarifasMontaje.jsx';
import { AdminShell, AdminCard } from '@compartido/componentes/AdminUI';

const AdminTransportMounting = () => {
	return (
		<AdminShell title="Transporte & Montaje" subtitle="Tarifario de transporte y tarifas de montaje">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<AdminCard title="Tarifario Transporte" description="Tramos por distancia y categoría de largo">
					<TarifasTransporte />
				</AdminCard>
				<AdminCard title="Tarifas de Montaje" description="$/tn, $/día, $/km">
					<TarifasMontaje />
				</AdminCard>
			</div>
		</AdminShell>
	);
};

export default AdminTransportMounting;