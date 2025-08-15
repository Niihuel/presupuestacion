// src/config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('@modelos/User.model');
const { logger } = require('@utilidades/logger');

// Local Strategy (email/password)
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return done(null, false, { message: 'Email o contraseña incorrectos' });
    }
    
    // Check if account is locked
    if (user.isLocked()) {
      return done(null, false, { 
        message: 'Cuenta bloqueada temporalmente por múltiples intentos fallidos' 
      });
    }
    
    // Check if account is active
    if (!user.is_active) {
      return done(null, false, { message: 'Cuenta desactivada o pendiente de aprobación' });
    }
    
    // Validate password
    const isValidPassword = await user.validatePassword(password);
    
    if (!isValidPassword) {
      await user.incrementLoginAttempts();
      return done(null, false, { message: 'Email o contraseña incorrectos' });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    return done(null, user);
  } catch (error) {
    logger.error('Error in local strategy:', error);
    return done(error);
  }
}));

// JWT Strategy
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISSUER,
  audience: process.env.JWT_AUDIENCE
};

passport.use(new JwtStrategy(jwtOptions, async (payload, done) => {
  try {
    const user = await User.findByPk(payload.sub);
    
    if (!user) {
      return done(null, false);
    }
    
    if (!user.is_active) {
      return done(null, false, { message: 'Cuenta desactivada' });
    }
    
    return done(null, user);
  } catch (error) {
    logger.error('Error in JWT strategy:', error);
    return done(error, false);
  }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const { emailService } = require('../../core/email');

      // Check if user exists with this Google ID
      let user = await User.findByOAuth('google', profile.id);
      
      if (user) {
        // Update user info from Google
        user.first_name = profile.name.givenName || user.first_name;
        user.last_name = profile.name.familyName || user.last_name;
        user.avatar_url = profile.photos?.[0]?.value || user.avatar_url;
        user.last_login = new Date();
        await user.save();
        
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findByEmail(email);
        
        if (user) {
          // Link existing account with Google
          user.oauth_provider = 'google';
          user.oauth_id = profile.id;
          user.is_verified = true; // Google already verified the email
          user.avatar_url = profile.photos?.[0]?.value || user.avatar_url;
          user.last_login = new Date();
          await user.save();
          
          return done(null, user);
        }
      }
      
      // Create new user (OAuth users are auto-approved)
      user = await User.create({
        email: email,
        username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
        first_name: profile.name.givenName || 'Usuario',
        last_name: profile.name.familyName || 'Google',
        oauth_provider: 'google',
        oauth_id: profile.id,
        is_verified: true,
        is_active: true, // OAuth users are auto-approved
        avatar_url: profile.photos?.[0]?.value,
        last_login: new Date()
      });

      // Marcar que es un usuario nuevo para el callback
      user.isNewUser = true;

      // Send notification email to admin
      try {
        await emailService.sendNewUserByOAuthEmail(user);
      } catch (error) {
        logger.error('Error sending new user email:', error);
      }
      
      return done(null, user);
    } catch (error) {
      logger.error('Error in Google strategy:', error);
      return done(error, null);
    }
  }));
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;