import React from 'react';
import TiposCamiones from './TiposCamiones.jsx';
import { AdminShell, AdminCard } from '@compartido/componentes/AdminUI';

const AdminTrucks = () => {
	return (
		<AdminShell title="Camiones & Empaque" subtitle="Tipos de camión y reglas de apilado por familia">
			<AdminCard>
				<TiposCamiones />
			</AdminCard>
		</AdminShell>
	);
};

export default AdminTrucks;