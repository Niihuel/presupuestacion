/**
 * Página de callback para autenticación OAuth
 * 
 * Procesa la respuesta de OAuth y completa el inicio de sesión
 */

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@nucleo/store/auth.store';
import { authService } from '@compartido/servicios';
import { useNotifications } from '@compartido/hooks/useNotificaciones';

const OAuthCallbackPage = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const notifications = useNotifications();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(true);
  const [processed, setProcessed] = useState(false); // Evitar procesamiento múltiple

  useEffect(() => {
    // Si ya procesamos una vez, no procesar de nuevo
    if (processed) return;

    const processCallback = async () => {
      try {
        setProcessed(true); // Marcar como procesado inmediatamente
        console.log('🔵 Procesando callback OAuth con:', location.search);
        
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const errorParam = urlParams.get('error');
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        
        console.log('📋 Parámetros recibidos:', { token, error: errorParam, code, state });
        
        // Si hay un error explícito en los parámetros
        if (errorParam) {
          throw new Error('The operation is insecure.');
        }
        
        // Si no hay ni token ni código, es un error
        if (!token && !code) {
          console.error('❌ No se encontró token ni código en los parámetros');
          throw new Error('No se recibió información de autenticación válida');
        }
        
        // Si tenemos un token directo, usarlo
        if (token) {
          console.log('✅ Token recibido directamente');
          
          // Decodificar el JWT para obtener la información del usuario
          try {
            const base64Payload = token.split('.')[1];
            const payload = JSON.parse(atob(base64Payload));
            console.log('📋 Información del token:', payload);
            
            const mockResponse = {
              user: {
                id: payload.sub,
                email: payload.email,
                username: payload.username,
                role: payload.role
              },
              token: token
            };
            
            console.log('📝 Datos para login:', mockResponse);
            login(mockResponse);
          } catch (decodeError) {
            console.error('❌ Error decodificando token:', decodeError);
            // Fallback si no se puede decodificar
            const mockResponse = {
              user: null,
              token: token
            };
            login(mockResponse);
          }
          
          notifications.success('Inicio de sesión exitoso');
          
          // Usar window.location en lugar de navigate para evitar el error
          console.log('🔄 Redirigiendo a dashboard...');
          window.location.href = '/';
          return;
        }
        
                // Si tenemos un code, hacer el intercambio
        if (code && !processed.current) {
          console.log('🔄 Intercambiando código por token...');
          processed.current = true;
          
          try {
            const response = await fetch('/auth/google/callback', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ code }),
            });
            
            const data = await response.json();
            console.log('📦 Respuesta del servidor:', data);
            
            if (data.token && data.user) {
              console.log('✅ Autenticación exitosa');
              const loginData = {
                user: data.user,
                token: data.token
              };
              
              login(loginData);
              notifications.success('Inicio de sesión exitoso');
              
              // Usar window.location en lugar de navigate
              console.log('🔄 Redirigiendo a dashboard...');
              window.location.href = '/';
            } else {
              throw new Error('Token o usuario no recibido');
            }
          } catch (error) {
            console.error('❌ Error en intercambio:', error);
            notifications.error('Error durante la autenticación');
            processed.current = true;
            window.location.href = '/auth/login';
          }
          return;
        }
        
      } catch (error) {
        console.error('❌ Error en OAuth callback:', error);
        const errorMessage = error.message || 'Error durante el inicio de sesión con OAuth';
        setError(errorMessage);
        setProcessing(false);
        
        notifications.error(errorMessage);
        
        // Usar window.location para la redirección de error también
        setTimeout(() => {
          console.log('🔄 Redirigiendo a login...');
          window.location.href = '/login';
        }, 3000);
      }
    };

    // Solo procesar si estamos en el componente y tenemos parámetros
    if (location.search) {
      processCallback();
    } else {
      console.error('❌ No hay parámetros de búsqueda en la URL');
      setError('No se encontraron parámetros de autenticación');
      setProcessing(false);
      setProcessed(true);
      setTimeout(() => {
        console.log('🔄 Redirigiendo a login...');
        window.location.href = '/login';
      }, 2000);
    }
  }, [location.search, processed]); // Agregar processed a las dependencias

  return (
    <div className="min-h-screen flex items-center justify-center bg-pretensa-gradient">
      <div className="text-center">
        {processing && !error && (
          <>
            <h1 className="text-3xl font-bold text-gray-800 mb-4">Procesando autenticación...</h1>
            <p className="text-lg text-gray-600">Por favor, espera un momento.</p>
          </>
        )}

        {error && (
          <>
            <h1 className="text-3xl font-bold text-red-600 mb-4">Error de autenticación</h1>
            <p className="text-lg text-gray-600 mb-4">{error}</p>
            <p className="text-base text-gray-500">Serás redirigido al inicio de sesión en unos segundos...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallbackPage;