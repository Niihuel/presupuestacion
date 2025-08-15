import React from 'react';
import Politicas from './Politicas.jsx';
import { AdminShell, AdminCard } from '@compartido/componentes/AdminUI';

const AdminPolicies = () => {
	return (
		<AdminShell title="Políticas" subtitle="Feature flags, redondeos y límites operativos">
			<AdminCard>
				<Politicas />
			</AdminCard>
		</AdminShell>
	);
};

export default AdminPolicies;
