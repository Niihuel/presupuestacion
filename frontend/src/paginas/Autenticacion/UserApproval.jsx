import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import paschiniIcon from '@recursos/images/paschini-icon.png';
import pretensaIcon from '@recursos/images/pretensa-icon.png';

const UserApprovalPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  
  const userId = searchParams.get('id');
  const token = searchParams.get('token');

  useEffect(() => {
    const approveUser = async () => {
      if (!userId || !token || token === 'null') {
        setStatus('error');
        setMessage('Enlace de aprobación inválido. Verifique que copió el enlace completo del email.');
        return;
      }

      try {
        console.log('Intentando aprobar usuario:', { userId, token: token.substring(0, 10) + '...' });
        
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/v1/auth/approve-user?id=${userId}&token=${token}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        if (response.ok) {
          setStatus('success');
          setMessage('Usuario aprobado exitosamente. El usuario ha sido notificado por email.');
        } else {
          setStatus('error');
          // Mostrar mensajes específicos según el error
          if (data.message?.includes('Token de aprobación inválido')) {
            setMessage('El enlace de aprobación no es válido. Verifique que copió el enlace completo del email.');
          } else if (data.message?.includes('Token de aprobación expirado')) {
            setMessage('El enlace de aprobación ha expirado. Contacte al usuario para que se registre nuevamente.');
          } else if (data.message?.includes('Usuario no encontrado')) {
            setMessage('Usuario no encontrado en el sistema.');
          } else if (data.message?.includes('ya está activo')) {
            setMessage('Este usuario ya ha sido aprobado anteriormente.');
          } else {
            setMessage(data.message || 'Error al aprobar el usuario');
          }
        }
      } catch (error) {
        console.error('Error de conexión:', error);
        setStatus('error');
        setMessage('Error de conexión. Verifique que el servidor esté funcionando.');
      }
    };

    approveUser();
  }, [userId, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center space-x-6 mb-6">
          <img src={paschiniIcon} alt="Paschini" className="h-16 w-16 object-contain" />
          <img src={pretensaIcon} alt="Pretensa" className="h-16 w-16 object-contain" />
        </div>
        
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Procesando Aprobación</h2>
              <p className="text-gray-600">Por favor espera un momento...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="text-green-600 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">¡Usuario Aprobado!</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="text-red-600 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Error de Aprobación</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserApprovalPage;
