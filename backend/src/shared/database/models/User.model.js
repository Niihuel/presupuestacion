// src/shared/database/User.model.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sequelize, executeQuery } = require('../database');

class User extends Model {
  // Métodos de instancia

  /**
   * Valida la contraseña del usuario
   * @param {string} password - La contraseña a validar
   * @returns {Promise<boolean>} - Verdadero si la contraseña es válida
   */
  async validatePassword(password) {
    if (!this.password_hash) return false;
    return bcrypt.compare(password, this.password_hash);
  }

  /**
   * Establece la contraseña del usuario
   * @param {string} password - La contraseña a establecer
   */
  async setPassword(password) {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(password, salt);
  }

  /**
   * Genera el token de verificación de correo electrónico
   * @returns {string} - El token de verificación
   */
  generateEmailVerificationToken() {
    const token = crypto.randomBytes(16).toString('hex');
    this.email_verification_token = token; // Usar el token directamente sin hash
    this.email_verification_expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    return token;
  }

  /**
   * Genera el token de restablecimiento de contraseña
   * @returns {string} - El token de restablecimiento
   */
  generatePasswordResetToken() {
    const token = crypto.randomBytes(16).toString('hex');
    this.password_reset_token = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');
    // Crear la fecha sin timezone information para SQL Server
    this.password_reset_expires = new Date(Date.now() + 10 * 60 * 1000);
    return token;
  }

  /**
   * Comprueba si la cuenta está bloqueada
   * @returns {boolean>} - Verdadero si la cuenta está bloqueada
   */
  isLocked() {
    return this.locked_until && this.locked_until > new Date();
  }

  /**
   * Incrementa los intentos de inicio de sesión fallidos
   */
  async incrementLoginAttempts() {
    this.failed_login_attempts += 1;
    if (this.failed_login_attempts >= 5) {
      this.locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
    }
    await this.save();
  }

  /**
   * Restablece los intentos de inicio de sesión fallidos
   */
  async resetLoginAttempts() {
    this.failed_login_attempts = 0;
    this.locked_until = null;
    await this.save();
  }

  // Métodos estáticos

  /**
   * Encuentra un usuario por su correo electrónico
   * @param {string} email - El correo electrónico del usuario
   * @returns {Promise<User|null>} - La instancia del usuario o nulo
   */
  static async findByEmail(email) {
    return this.findOne({ where: { email } });
  }

  /**
   * Encuentra un usuario por su nombre de usuario
   * @param {string} username - El nombre de usuario
   * @returns {Promise<User|null>} - La instancia del usuario o nulo
   */
  static async findByUsername(username) {
    return this.findOne({ where: { username } });
  }

  /**
   * Encuentra un usuario por proveedor OAuth y ID
   * @param {string} provider - El proveedor OAuth
   * @param {string} id - El ID de usuario OAuth
   * @returns {Promise<User|null>} - La instancia del usuario o nulo
   */
  static async findByOAuth(provider, id) {
    return this.findOne({ where: { oauth_provider: provider, oauth_id: id } });
  }

  /**
   * Encuentra un usuario por su token de verificación de email
   * @param {string} token - El token de verificación
   * @returns {Promise<User|null>} - La instancia del usuario o nulo
   */
  static async findByEmailVerificationToken(token) {
    return this.findOne({
      where: {
        email_verification_token: token, // Buscar directamente sin hash
        email_verification_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
  }

  /**
   * Encuentra un usuario por su token de restablecimiento de contraseña
   * @param {string} token - El token de restablecimiento
   * @returns {Promise<User|null>} - La instancia del usuario o nulo
   */
  static async findByPasswordResetToken(token) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    return this.findOne({
      where: {
        password_reset_token: hashedToken,
        password_reset_expires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // Cambiado: Los usuarios requieren aprobación manual
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_vendor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    role: {
      type: DataTypes.STRING(50),
      defaultValue: 'user',
    },
    oauth_provider: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    oauth_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verification_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email_verification_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    password_reset_expires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    locked_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at', 
    deletedAt: 'deleted_at'
  }
);

module.exports = User;