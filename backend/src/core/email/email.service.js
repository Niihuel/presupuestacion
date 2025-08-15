/**
 * Servicio de email mejorado con plantillas modernas
 * 
 * Maneja el envío de emails con diseño profesional estilo Meta/Facebook
 * 
 * @author Sistema de Presupuestación
 * @version 2.0.0
 */

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { logger } = require('@utilidades/logger');
const {
  getVerificationEmailTemplate,
  getPasswordResetTemplate,
  getAccountApprovedTemplate,
  getAccountLockedTemplate,
  getNewUserRegistrationTemplate,
  getNewUserOAuthTemplate
} = require('./email.templates');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
    this.useFallback = false;
    this.attachments = this.setupAttachments();
    
    // Verificar conexión al inicializar
    this.verifyConnection();
  }

  /**
   * Configura los archivos adjuntos de logos
   */
  setupAttachments() {
    const attachments = [];
    
    try {
      // Buscar los logos en la carpeta de imágenes del frontend
      const frontendImagesPath = path.join(process.cwd(), '..', 'frontend', 'src', 'assets', 'images');
      const paschiniPath = path.join(frontendImagesPath, 'paschini-icon.png');
      const pretensaPath = path.join(frontendImagesPath, 'pretensa-icon.png');
      
      if (fs.existsSync(paschiniPath)) {
        attachments.push({
          filename: 'paschini-icon.png',
          path: paschiniPath,
          cid: 'paschini-icon'
        });
      }
      
      if (fs.existsSync(pretensaPath)) {
        attachments.push({
          filename: 'pretensa-icon.png',
          path: pretensaPath,
          cid: 'pretensa-icon'
        });
      }
      
      logger.info(`📎 Logos configurados: ${attachments.length} archivos encontrados`);
    } catch (error) {
      logger.warn('⚠️ No se pudieron cargar los logos para emails:', error.message);
    }
    
    return attachments;
  }

  /**
   * Crea el transportador de email basado en el entorno
   */
  createTransporter() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    if (isDevelopment) {
      // En desarrollo, usar streamTransport para simular emails
      logger.info('📧 Configurando servicio de email en modo desarrollo (simulación)');
      return nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });
    } else {
      // En producción, usar Gmail SMTP con puerto 465
      logger.info('📧 Configurando servicio de email para Gmail SMTP (puerto 465)');
      return nodemailer.createTransport({
        service: 'gmail', // Usar servicio predefinido es más confiable
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS // Esta debe ser la App Password de Gmail
        },
        tls: {
          rejectUnauthorized: false // Para entornos empresariales
        }
      });
    }
  }

  /**
   * Verifica la conexión SMTP
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('✅ Conexión SMTP establecida correctamente');
    } catch (error) {
      logger.error('❌ Error en la conexión SMTP:', error.message);
      
      // Errores específicos de Gmail para mejor diagnóstico
      if (error.message.includes('Username and Password not accepted')) {
        logger.error('🔐 Error de autenticación Gmail - Posibles causas:');
        logger.error('   1. Necesitas crear una App Password en https://myaccount.google.com/apppasswords');
        logger.error('   2. Debes habilitar verificación en 2 pasos en tu cuenta Gmail');
        logger.error('   3. Verifica que EMAIL_USER y EMAIL_PASS sean correctos en .env');
      }
      
      if (error.message.includes('Invalid login')) {
        logger.error('🚫 Login inválido - Verifica:');
        logger.error('   - Que el email sea correcto');
        logger.error('   - Que uses App Password (no la contraseña normal)');
      }
      
      this.useFallback = true;
    }
  }

  /**
   * Envía un email usando las plantillas modernas
   * @param {object} mailOptions - Opciones del correo
   * @param {string} context - Contexto del email (para logging)
   */
  async sendEmail(mailOptions, context = 'email') {
    try {
      // Agregar los attachments de logos a todos los emails
      const finalMailOptions = {
        ...mailOptions,
        attachments: [...(mailOptions.attachments || []), ...this.attachments]
      };

      const info = await this.transporter.sendMail(finalMailOptions);
      
      if (this.useFallback || !info.messageId) {
        // Fallback para development mode o cuando SMTP no está disponible
        logger.info(`📧 [DESARROLLO] ${context} simulado:`);
        logger.info(`   Para: ${mailOptions.to}`);
        logger.info(`   Asunto: ${mailOptions.subject}`);
        logger.info(`   De: ${mailOptions.from}`);
        if (mailOptions.html && mailOptions.html.includes('http')) {
          // Extraer URLs del HTML
          const urls = mailOptions.html.match(/https?:\/\/[^\s"'<>]+/g);
          if (urls) {
            logger.info(`   URLs importantes: ${urls.join(', ')}`);
          }
        }
        logger.info('   📧 Email simulado exitosamente');
      } else {
        logger.info(`✅ ${context} enviado exitosamente a: ${mailOptions.to}`);
        logger.info(`   Message ID: ${info.messageId}`);
      }
      return true;
    } catch (error) {
      logger.error(`❌ Error enviando ${context} a ${mailOptions.to}:`, error.message);
      return false;
    }
  }

  /**
   * Envía un correo electrónico de verificación al usuario
   * @param {object} user - El objeto de usuario
   * @param {string} token - El token de verificación
   */
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: user.email,
      subject: 'Verifica tu dirección de correo electrónico - Presupuestación',
      html: getVerificationEmailTemplate(user, verificationUrl)
    };

    const result = await this.sendEmail(mailOptions, `Correo de verificación para: ${user.email}`);
    
    // En caso de fallo, registrar la URL para testing/debug
    if (!result) {
      logger.info('--- FALLBACK: Información de verificación ---');
      logger.info(`Para: ${user.email}`);
      logger.info(`URL de verificación: ${verificationUrl}`);
      logger.info('------------------------------------------');
    }
    
    return result;
  }

  /**
   * Envía un correo electrónico de restablecimiento de contraseña al usuario
   * @param {object} user - El objeto de usuario
   * @param {string} token - El token de restablecimiento de contraseña
   */
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: user.email,
      subject: 'Restablece tu contraseña - Presupuestación',
      html: getPasswordResetTemplate(user, resetUrl)
    };

    const result = await this.sendEmail(mailOptions, `Correo de restablecimiento para: ${user.email}`);
    
    // En caso de fallo, registrar la URL para testing/debug
    if (!result) {
      logger.info('--- FALLBACK: Información de restablecimiento ---');
      logger.info(`Para: ${user.email}`);
      logger.info(`URL de restablecimiento: ${resetUrl}`);
      logger.info('------------------------------------------');
    }
    
    return result;
  }

  /**
   * Envía un correo electrónico de confirmación de cuenta aprobada
   * @param {object} user - El objeto del usuario aprobado
   */
  async sendAccountApprovedEmail(user) {
    const loginUrl = `${process.env.CLIENT_URL}/login`;
    
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: user.email,
      subject: '¡Tu cuenta ha sido aprobada! - Presupuestación',
      html: getAccountApprovedTemplate(user, loginUrl)
    };

    return await this.sendEmail(mailOptions, `Correo de cuenta aprobada para: ${user.email}`);
  }

  /**
   * Envía un correo electrónico al usuario notificándole que su cuenta ha sido bloqueada
   * @param {object} user - El objeto de usuario
   */
  async sendAccountLockedEmail(user) {
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: user.email,
      subject: 'Cuenta Bloqueada - Presupuestación',
      html: getAccountLockedTemplate(user)
    };

    return await this.sendEmail(mailOptions, `Correo de cuenta bloqueada para: ${user.email}`);
  }

  /**
   * Envía un correo electrónico para notificar la creación de un nuevo usuario a través de OAuth
   * @param {object} user - El objeto del nuevo usuario
   */
  async sendNewUserByOAuthEmail(user) {
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: 'sistemas@pretensa.com.ar', // Correo de destino fijo
      subject: 'Nuevo Usuario Registrado por OAuth - Presupuestación',
      html: getNewUserOAuthTemplate(user)
    };

    return await this.sendEmail(mailOptions, `Correo de notificación de nuevo usuario OAuth para: ${user.email}`);
  }

  /**
   * Envía un correo electrónico para notificar un nuevo registro que requiere aprobación manual
   * @param {object} user - El objeto del nuevo usuario
   */
  async sendNewUserRegistrationEmail(user) {
    const approveUrl = `${process.env.CLIENT_URL}/admin/approve-user?id=${user.id}&token=${user.email_verification_token}`;
    
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to: 'sistemas@pretensa.com.ar', // Correo de destino fijo
      subject: 'Nuevo Registro Pendiente de Aprobación - Presupuestación',
      html: getNewUserRegistrationTemplate(user, approveUrl)
    };

    return await this.sendEmail(mailOptions, `Correo de notificación de nuevo registro para: ${user.email}`);
  }

  /**
   * Método genérico para enviar emails personalizados
   * @param {string} to - Email destinatario
   * @param {string} subject - Asunto del email
   * @param {string} htmlContent - Contenido HTML del email
   * @param {object} options - Opciones adicionales
   */
  async sendCustomEmail(to, subject, htmlContent, options = {}) {
    const mailOptions = {
      from: `"Presupuestación" <${process.env.EMAIL_USER || 'sistemas@pretensa.com.ar'}>`,
      to,
      subject,
      html: htmlContent,
      ...options
    };

    return await this.sendEmail(mailOptions, `Email personalizado para: ${to}`);
  }
}

// Exportar instancia singleton del servicio
module.exports = new EmailService();
