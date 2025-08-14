/**
 * Plantillas de Email Profesionales
 * 
 * Diseño moderno y minimalista con estilo empresarial
 * Inspirado en Microsoft/Meta con gradientes sutiles
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0 - Rediseño Profesional
 */

/**
 * Paleta de colores empresarial moderna
 */
const COLORS = {
  primary: '#0078d4',      // Azul Microsoft
  secondary: '#6264a7',    // Púrpura sutil
  accent: '#005a9e',       // Azul oscuro
  success: '#107c10',      // Verde éxito
  warning: '#f7630c',      // Naranja advertencia
  error: '#d13438',        // Rojo error
  background: '#f3f2f1',   // Gris neutro
  surface: '#ffffff',      // Blanco puro
  text: {
    primary: '#201f1e',    // Negro suave
    secondary: '#605e5c',  // Gris medio
    tertiary: '#8a8886',   // Gris claro
    inverse: '#ffffff'     // Blanco
  },
  border: {
    light: '#edebe9',      // Borde sutil
    medium: '#d2d0ce',     // Borde medio
    strong: '#8a8886'      // Borde fuerte
  }
};

/**
 * Plantilla base moderna para todos los emails
 */
const getBaseTemplate = (content, title = 'Sistema de Presupuestación') => {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* Reset y tipografía moderna */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.5;
      color: ${COLORS.text.primary};
      background-color: ${COLORS.background};
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Container principal con sombras modernas */
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: ${COLORS.surface};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    /* Header con gradiente sutil */
    .header {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%);
      padding: 40px 32px;
      text-align: center;
      position: relative;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
      pointer-events: none;
    }
    
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      position: relative;
      z-index: 1;
    }
    
    .logo {
      width: 40px;
      height: 40px;
      background-color: rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18px;
      color: ${COLORS.text.inverse};
    }
    
    .header-title {
      color: ${COLORS.text.inverse};
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }
    
    .header-subtitle {
      color: rgba(255, 255, 255, 0.85);
      font-size: 14px;
      font-weight: 400;
      margin-top: 4px;
      position: relative;
      z-index: 1;
    }
    
    /* Contenido principal */
    .content {
      padding: 40px 32px;
    }
    
    .content h1 {
      color: ${COLORS.text.primary};
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }
    
    .content h2 {
      color: ${COLORS.text.primary};
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 16px;
      letter-spacing: -0.3px;
    }
    
    .content h3 {
      color: ${COLORS.text.primary};
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .content p {
      color: ${COLORS.text.secondary};
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .content .lead {
      font-size: 18px;
      color: ${COLORS.text.primary};
      font-weight: 400;
      margin-bottom: 24px;
    }
    
    /* Botones modernos con hover effects */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      transition: all 0.2s ease;
      border: none;
      cursor: pointer;
      min-width: 120px;
    }
    
    .btn-primary {
      background: linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.accent} 100%);
      color: ${COLORS.text.inverse};
      box-shadow: 0 2px 8px rgba(0, 120, 212, 0.25);
    }
    
    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(0, 120, 212, 0.35);
    }
    
    .btn-secondary {
      background-color: ${COLORS.surface};
      color: ${COLORS.primary};
      border: 2px solid ${COLORS.border.medium};
    }
    
    .btn-secondary:hover {
      background-color: ${COLORS.primary};
      color: ${COLORS.text.inverse};
      border-color: ${COLORS.primary};
    }
    
    .btn-success {
      background-color: ${COLORS.success};
      color: ${COLORS.text.inverse};
      box-shadow: 0 2px 8px rgba(16, 124, 16, 0.25);
    }
    
    .btn-warning {
      background-color: ${COLORS.warning};
      color: ${COLORS.text.inverse};
      box-shadow: 0 2px 8px rgba(247, 99, 12, 0.25);
    }
    
    .btn-error {
      background-color: ${COLORS.error};
      color: ${COLORS.text.inverse};
      box-shadow: 0 2px 8px rgba(209, 52, 56, 0.25);
    }
    
    /* Cards modernas */
    .card {
      background-color: ${COLORS.surface};
      border: 1px solid ${COLORS.border.light};
      border-radius: 12px;
      padding: 24px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }
    
    .card-header {
      border-bottom: 1px solid ${COLORS.border.light};
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    
    .card-title {
      color: ${COLORS.text.primary};
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }
    
    .card-subtitle {
      color: ${COLORS.text.secondary};
      font-size: 14px;
      margin-top: 4px;
    }
    
    /* Cajas de información */
    .info-box {
      border-radius: 8px;
      padding: 16px 20px;
      margin: 20px 0;
      border-left: 4px solid;
    }
    
    .info-box.success {
      border-left-color: ${COLORS.success};
      background-color: rgba(16, 124, 16, 0.05);
      color: ${COLORS.text.primary};
    }
    
    .info-box.warning {
      border-left-color: ${COLORS.warning};
      background-color: rgba(247, 99, 12, 0.05);
      color: ${COLORS.text.primary};
    }
    
    .info-box.error {
      border-left-color: ${COLORS.error};
      background-color: rgba(209, 52, 56, 0.05);
      color: ${COLORS.text.primary};
    }
    
    .info-box.info {
      border-left-color: ${COLORS.primary};
      background-color: rgba(0, 120, 212, 0.05);
      color: ${COLORS.text.primary};
    }
    
    /* Lista de detalles moderna */
    .details-grid {
      display: grid;
      gap: 16px;
      margin: 24px 0;
    }
    
    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid ${COLORS.border.light};
    }
    
    .detail-item:last-child {
      border-bottom: none;
    }
    
    .detail-label {
      color: ${COLORS.text.secondary};
      font-size: 14px;
      font-weight: 500;
    }
    
    .detail-value {
      color: ${COLORS.text.primary};
      font-weight: 600;
    }
    
    /* Separadores */
    .divider {
      height: 1px;
      background-color: ${COLORS.border.light};
      margin: 32px 0;
    }
    
    /* Footer minimalista */
    .footer {
      background-color: ${COLORS.background};
      padding: 32px;
      text-align: center;
      border-top: 1px solid ${COLORS.border.light};
    }
    
    .footer-content {
      max-width: 400px;
      margin: 0 auto;
    }
    
    .footer p {
      color: ${COLORS.text.tertiary};
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .footer-links {
      margin-top: 20px;
      display: flex;
      justify-content: center;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .footer-links a {
      color: ${COLORS.text.secondary};
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .footer-links a:hover {
      color: ${COLORS.primary};
    }
    
    .company-info {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid ${COLORS.border.light};
    }
    
    .company-info p {
      font-size: 12px;
      color: ${COLORS.text.tertiary};
      margin-bottom: 4px;
    }
    
    /* Responsive design */
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
        border-radius: 8px;
      }
      
      .header, .content, .footer {
        padding: 24px 20px;
      }
      
      .content h1 {
        font-size: 24px;
      }
      
      .content h2 {
        font-size: 20px;
      }
      
      .btn {
        padding: 12px 24px;
        font-size: 15px;
        display: block;
        margin: 12px 0;
      }
      
      .footer-links {
        flex-direction: column;
        gap: 12px;
      }
      
      .detail-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo-container">
        <div class="logo">SP</div>
      </div>
      <h1 class="header-title">Sistema de Presupuestación</h1>
      <p class="header-subtitle">Plataforma profesional de gestión de presupuestos</p>
    </div>
    
    <div class="content">
      ${content}
    </div>
    
    <div class="footer">
      <div class="footer-content">
        <p>Este email fue enviado automáticamente por el Sistema de Presupuestación.</p>
        <p>Para consultas, contacta con nuestro equipo de soporte.</p>
        
        <div class="footer-links">
          <a href="#">Centro de Ayuda</a>
          <a href="#">Política de Privacidad</a>
          <a href="#">Términos de Uso</a>
        </div>
        
        <div class="company-info">
          <p>&copy; ${new Date().getFullYear()} Sistema de Presupuestación. Todos los derechos reservados.</p>
          <p>Esta comunicación es confidencial y está dirigida únicamente al destinatario.</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Plantilla para emails de bienvenida
 */
const getWelcomeTemplate = (userName, activationLink) => {
  const content = `
    <h1>Bienvenido a bordo, ${userName}</h1>
    <p class="lead">Nos complace darte la bienvenida al Sistema de Presupuestación, tu nueva plataforma para gestionar presupuestos de manera profesional y eficiente.</p>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Activa tu cuenta</h3>
        <p class="card-subtitle">Confirma tu dirección de email para comenzar</p>
      </div>
      
      <p>Para completar tu registro y acceder a todas las funcionalidades, necesitas activar tu cuenta haciendo clic en el botón de abajo:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${activationLink}" class="btn btn-primary">Activar mi cuenta</a>
      </div>
      
      <div class="info-box info">
        <strong>Importante:</strong> Este enlace expirará en 24 horas. Si no activas tu cuenta dentro de este tiempo, deberás solicitar un nuevo enlace de activación.
      </div>
    </div>
    
    <div class="divider"></div>
    
    <h3>¿Qué puedes hacer con tu cuenta?</h3>
    
    <div class="details-grid">
      <div class="detail-item">
        <span class="detail-label">Gestión de Presupuestos</span>
        <span class="detail-value">Crear y administrar presupuestos detallados</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Control de Proyectos</span>
        <span class="detail-value">Seguimiento completo de tus proyectos</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Gestión de Clientes</span>
        <span class="detail-value">Base de datos de clientes integrada</span>
      </div>
      <div class="detail-item">
        <span class="detail-label">Reportes Avanzados</span>
        <span class="detail-value">Análisis y reportes personalizados</span>
      </div>
    </div>
    
    <p>Si tienes alguna pregunta o necesitas ayuda, nuestro equipo de soporte está disponible para asistirte.</p>
  `;
  
  return getBaseTemplate(content, 'Bienvenido al Sistema de Presupuestación');
};

/**
 * Plantilla para confirmación de activación
 */
const getActivationConfirmTemplate = (userName) => {
  const content = `
    <div class="info-box success">
      <h2 style="margin-bottom: 8px;">¡Cuenta activada con éxito!</h2>
      <p style="margin-bottom: 0;">Tu cuenta está ahora completamente activa y lista para usar.</p>
    </div>
    
    <h1>¡Perfecto, ${userName}!</h1>
    <p class="lead">Tu cuenta ha sido activada exitosamente. Ya puedes acceder a todas las funcionalidades del Sistema de Presupuestación.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" class="btn btn-primary">Acceder al sistema</a>
    </div>
    
    <div class="card">
      <h3>Próximos pasos recomendados</h3>
      
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">1. Configurar perfil</span>
          <span class="detail-value">Completa tu información personal</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">2. Crear primer proyecto</span>
          <span class="detail-value">Inicia con tu primer presupuesto</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">3. Explorar funciones</span>
          <span class="detail-value">Descubre todas las herramientas disponibles</span>
        </div>
      </div>
    </div>
    
    <p>¿Necesitas ayuda para comenzar? Consulta nuestra documentación o contacta con nuestro equipo de soporte.</p>
  `;
  
  return getBaseTemplate(content, 'Cuenta activada - Sistema de Presupuestación');
};

/**
 * Plantilla para recuperación de contraseña
 */
const getPasswordResetTemplate = (userName, resetLink, expiresIn = '1 hora') => {
  const content = `
    <h1>Recuperación de contraseña</h1>
    <p class="lead">Hola ${userName}, hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
    
    <div class="info-box warning">
      <strong>Seguridad:</strong> Si no solicitaste este cambio, puedes ignorar este email. Tu contraseña permanecerá sin cambios.
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Restablecer contraseña</h3>
        <p class="card-subtitle">Haz clic en el botón para crear una nueva contraseña</p>
      </div>
      
      <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetLink}" class="btn btn-primary">Cambiar mi contraseña</a>
      </div>
      
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Enlace válido por</span>
          <span class="detail-value">${expiresIn}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de solicitud</span>
          <span class="detail-value">${new Date().toLocaleString('es-ES')}</span>
        </div>
      </div>
    </div>
    
    <div class="divider"></div>
    
    <h3>Consejos de seguridad</h3>
    <p>Para mantener tu cuenta segura, te recomendamos:</p>
    
    <ul style="margin-left: 20px; color: ${COLORS.text.secondary};">
      <li>Usar una contraseña única y segura</li>
      <li>Incluir letras, números y símbolos</li>
      <li>No compartir tu contraseña con nadie</li>
      <li>Cambiar contraseñas regularmente</li>
    </ul>
  `;
  
  return getBaseTemplate(content, 'Recuperación de contraseña - Sistema de Presupuestación');
};

/**
 * Plantilla para notificación de nuevo usuario registrado (Admin)
 */
const getNewUserNotificationTemplate = (userDetails) => {
  const content = `
    <h1>Nuevo usuario registrado</h1>
    <p class="lead">Se ha registrado un nuevo usuario en el Sistema de Presupuestación y está pendiente de aprobación.</p>
    
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Información del usuario</h3>
        <p class="card-subtitle">Detalles de la cuenta registrada</p>
      </div>
      
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Nombre completo</span>
          <span class="detail-value">${userDetails.nombre}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Email</span>
          <span class="detail-value">${userDetails.email}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Empresa</span>
          <span class="detail-value">${userDetails.empresa || 'No especificada'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Fecha de registro</span>
          <span class="detail-value">${new Date().toLocaleString('es-ES')}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Estado</span>
          <span class="detail-value">Pendiente de aprobación</span>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" class="btn btn-primary">Gestionar usuarios</a>
      <a href="#" class="btn btn-secondary" style="margin-left: 16px;">Ver detalles</a>
    </div>
    
    <div class="info-box info">
      <strong>Acción requerida:</strong> Revisa la información del usuario y procede con la aprobación o rechazo según las políticas de la empresa.
    </div>
  `;
  
  return getBaseTemplate(content, 'Nuevo usuario registrado - Sistema de Presupuestación');
};

/**
 * Plantilla para aprobación de usuario
 */
const getUserApprovalTemplate = (userName, loginLink) => {
  const content = `
    <div class="info-box success">
      <h2 style="margin-bottom: 8px;">¡Tu cuenta ha sido aprobada!</h2>
      <p style="margin-bottom: 0;">Ya puedes acceder al Sistema de Presupuestación.</p>
    </div>
    
    <h1>¡Bienvenido, ${userName}!</h1>
    <p class="lead">Nos complace informarte que tu cuenta ha sido aprobada por nuestro equipo de administración. Ahora tienes acceso completo a la plataforma.</p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${loginLink}" class="btn btn-primary">Iniciar sesión</a>
    </div>
    
    <div class="card">
      <h3>Tu cuenta incluye</h3>
      
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Gestión completa</span>
          <span class="detail-value">Presupuestos, proyectos y clientes</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Reportes avanzados</span>
          <span class="detail-value">Análisis detallados y exportación</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Soporte técnico</span>
          <span class="detail-value">Asistencia profesional incluida</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Actualizaciones</span>
          <span class="detail-value">Nuevas funciones automáticamente</span>
        </div>
      </div>
    </div>
    
    <p>Si necesitas ayuda para comenzar o tienes alguna pregunta, no dudes en contactar con nuestro equipo de soporte.</p>
  `;
  
  return getBaseTemplate(content, 'Cuenta aprobada - Sistema de Presupuestación');
};

/**
 * Plantilla para rechazo de usuario
 */
const getUserRejectionTemplate = (userName, reason = '') => {
  const content = `
    <h1>Actualización sobre tu solicitud</h1>
    <p class="lead">Hola ${userName}, gracias por tu interés en el Sistema de Presupuestación.</p>
    
    <div class="info-box error">
      <strong>Solicitud no aprobada:</strong> Lamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.
    </div>
    
    ${reason ? `
    <div class="card">
      <h3>Motivo</h3>
      <p>${reason}</p>
    </div>
    ` : ''}
    
    <div class="card">
      <h3>¿Qué puedes hacer?</h3>
      
      <ul style="margin-left: 20px; color: ${COLORS.text.secondary};">
        <li>Contactar con nuestro equipo para aclarar dudas</li>
        <li>Revisar los requisitos de registro</li>
        <li>Volver a aplicar cuando cumplas los criterios</li>
      </ul>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="#" class="btn btn-secondary">Contactar soporte</a>
    </div>
    
    <p>Apreciamos tu comprensión y esperamos poder asistirte en el futuro.</p>
  `;
  
  return getBaseTemplate(content, 'Actualización de solicitud - Sistema de Presupuestación');
};

module.exports = {
  getBaseTemplate,
  getWelcomeTemplate,
  getActivationConfirmTemplate,
  getPasswordResetTemplate,
  getNewUserNotificationTemplate,
  getUserApprovalTemplate,
  getUserRejectionTemplate
};
