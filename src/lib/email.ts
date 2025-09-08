import nodemailer from 'nodemailer';

// Configurar transportador de Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    const info = await transporter.sendMail({
      from: `"PRETENSA Sistema" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

// Templates de email
export const emailTemplates = {
  // Notificación a sistemas@pretensa.com.ar para aprobar usuario
  adminApprovalNotification: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    department?: string;
    position?: string;
    registrationToken: string;
  }) => ({
    subject: 'Nueva Solicitud de Registro - PRETENSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0056a0 0%, #4A9FE8 100%); color: white; padding: 20px; text-align: center;">
          <h1>PRETENSA</h1>
          <h2>Nueva Solicitud de Registro</h2>
        </div>
        
        <div style="padding: 20px; background: #F7F9FB;">
          <h3>Datos del Solicitante:</h3>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
            <tr><td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Nombre:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${userData.firstName} ${userData.lastName}</td></tr>
            <tr><td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Email:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${userData.email}</td></tr>
            ${userData.phone ? `<tr><td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Teléfono:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${userData.phone}</td></tr>` : ''}
            ${userData.department ? `<tr><td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Departamento:</td><td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${userData.department}</td></tr>` : ''}
            ${userData.position ? `<tr><td style="padding: 12px; font-weight: bold;">Cargo:</td><td style="padding: 12px;">${userData.position}</td></tr>` : ''}
          </table>
          
          <div style="margin: 30px 0; text-align: center;">
            <p style="margin-bottom: 20px; color: #1a1a1a;">Para aprobar o rechazar este registro, accede al panel de administración:</p>
            <a href="${process.env.NEXTAUTH_URL}/admin/users/pending" 
               style="background: #0056a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Ver Panel de Administración
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Token de Registro:</strong> <code style="background: #f8f9fa; padding: 2px 6px; border-radius: 4px;">${userData.registrationToken}</code></p>
            <small>Este token es necesario para aprobar manualmente el registro si es requerido.</small>
          </div>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Sistema de Presupuestación PRETENSA</p>
          <p>Por favor no responder a este email</p>
        </div>
      </div>
    `,
    text: `Nueva Solicitud de Registro - PRETENSA\n\nDatos del Solicitante:\nNombre: ${userData.firstName} ${userData.lastName}\nEmail: ${userData.email}\n${userData.phone ? `Teléfono: ${userData.phone}\n` : ''}${userData.department ? `Departamento: ${userData.department}\n` : ''}${userData.position ? `Cargo: ${userData.position}\n` : ''}\n\nToken de Registro: ${userData.registrationToken}\n\nAccede al panel de administración para aprobar: ${process.env.NEXTAUTH_URL}/admin/users/pending`
  }),

  // Notificación al usuario cuando es aprobado
  userApprovalConfirmation: (userData: {
    firstName: string;
    email: string;
  }) => ({
    subject: 'Cuenta Aprobada - PRETENSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0056a0 0%, #4A9FE8 100%); color: white; padding: 20px; text-align: center;">
          <h1>PRETENSA</h1>
          <h2>Cuenta Aprobada</h2>
        </div>
        
        <div style="padding: 20px; background: #F7F9FB;">
          <h3>Hola ${userData.firstName},</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #1a1a1a;">
            Tu solicitud de registro ha sido <strong>aprobada</strong> por el equipo de sistemas.
          </p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;"><strong>Ya puedes acceder al sistema con tus credenciales.</strong></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/login" 
               style="background: #0056a0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Iniciar Sesión
            </a>
          </div>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Sistema de Presupuestación PRETENSA</p>
        </div>
      </div>
    `,
    text: `Cuenta Aprobada - PRETENSA\n\nHola ${userData.firstName},\n\nTu solicitud de registro ha sido aprobada por el equipo de sistemas.\nYa puedes acceder al sistema con tus credenciales.\n\nInicia sesión en: ${process.env.NEXTAUTH_URL}/login`
  }),

  // Notificación al usuario cuando es rechazado
  userRejectionNotification: (userData: {
    firstName: string;
    email: string;
    reason?: string;
  }) => ({
    subject: 'Solicitud de Registro Rechazada - PRETENSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #d92c3a 0%, #b91c2c 100%); color: white; padding: 20px; text-align: center;">
          <h1>PRETENSA</h1>
          <h2>Solicitud de Registro</h2>
        </div>
        
        <div style="padding: 20px; background: #F7F9FB;">
          <h3>Hola ${userData.firstName},</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #1a1a1a;">
            Lamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.
          </p>
          
          ${userData.reason ? `
            <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; color: #721c24;"><strong>Motivo:</strong> ${userData.reason}</p>
            </div>
          ` : ''}
          
          <p style="color: #1a1a1a;">Si tienes preguntas o deseas más información, puedes contactarnos en:</p>
          <p><strong>sistemas@pretensa.com.ar</strong></p>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Sistema de Presupuestación PRETENSA</p>
        </div>
      </div>
    `,
    text: `Solicitud de Registro Rechazada - PRETENSA\n\nHola ${userData.firstName},\n\nLamentamos informarte que tu solicitud de registro no ha sido aprobada en este momento.\n\n${userData.reason ? `Motivo: ${userData.reason}\n\n` : ''}Si tienes preguntas, contactanos en: sistemas@pretensa.com.ar`
  }),

  // Email de verificación de cuenta
  emailVerification: (userData: {
    firstName: string;
    lastName: string;
    email: string;
    verificationToken: string;
  }) => ({
    subject: 'Verifica tu Cuenta - PRETENSA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #0056a0 0%, #4A9FE8 100%); color: white; padding: 20px; text-align: center;">
          <h1>PRETENSA</h1>
          <h2>Verificación de Cuenta</h2>
        </div>
        
        <div style="padding: 20px; background: #F7F9FB;">
          <h3>Hola ${userData.firstName},</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #1a1a1a;">
            Gracias por registrarte en el sistema PRETENSA. Para completar tu registro, necesitas verificar tu dirección de email.
          </p>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; color: #0c5460;"><strong>Haz clic en el botón de abajo para verificar tu cuenta:</strong></p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXTAUTH_URL}/api/auth/verify?token=${userData.verificationToken}" 
               style="background: #0056a0; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Verificar Mi Cuenta
            </a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>¿No funciona el botón?</strong> Copia y pega este enlace en tu navegador:</p>
            <p style="margin: 10px 0 0 0; word-break: break-all; font-size: 12px; color: #0056a0;">
              ${process.env.NEXTAUTH_URL}/api/auth/verify?token=${userData.verificationToken}
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Si no solicitaste esta verificación, puedes ignorar este email de forma segura.
          </p>
        </div>
        
        <div style="background: #e9ecef; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>Sistema de Presupuestación PRETENSA</p>
          <p>Por favor no responder a este email</p>
        </div>
      </div>
    `,
    text: `Verificación de Cuenta - PRETENSA\n\nHola ${userData.firstName},\n\nGracias por registrarte en el sistema PRETENSA. Para completar tu registro, verifica tu email haciendo clic en el siguiente enlace:\n\n${process.env.NEXTAUTH_URL}/api/auth/verify?token=${userData.verificationToken}\n\nSi no solicitaste esta verificación, puedes ignorar este email.\n\nSistema de Presupuestación PRETENSA`
  })
};
