// src/config/passport.js
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User.model');
const { logger } = require('../utils/logger');

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
    if (!user.isActive) {
      return done(null, false, { message: 'Cuenta desactivada' });
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
    
    if (!user.isActive) {
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
    clientID: process.env.GOOGLE_CLIENT_ID.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET.trim(),
    callbackURL: process.env.GOOGLE_CALLBACK_URL.trim(),
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Google ID
      let user = await User.findByOAuth('google', profile.id);
      
      if (user) {
        // Update user info from Google
           user.first_name = profile.name?.givenName || profile._json?.given_name || user.first_name;
           user.last_name = profile.name?.familyName || profile._json?.family_name || user.last_name;
        user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
        await user.save();
        
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findByEmail(email);
        
        if (user) {
          // Link existing account with Google
          user.oauthProvider = 'google';
          user.oauthId = profile.id;
          user.isVerified = true; // Google already verified the email
          user.avatarUrl = profile.photos?.[0]?.value || user.avatarUrl;
          await user.save();
          
          return done(null, user);
        }
      }
      
      // Create new user
         const firstName = profile.name?.givenName || profile._json?.given_name || 'Usuario';
         const lastName = profile.name?.familyName || profile._json?.family_name || 'Google';

         user = await User.create({
           email: email,
           username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
           first_name: firstName,
           last_name: lastName,
          oauthProvider: 'google',
        oauthId: profile.id,
        isVerified: true,
        isActive: true,
        avatarUrl: profile.photos?.[0]?.value
      });

      // Send notification email
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

// Microsoft OAuth Strategy
if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(new MicrosoftStrategy({
    clientID: process.env.MICROSOFT_CLIENT_ID,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    callbackURL: process.env.MICROSOFT_CALLBACK_URL,
    scope: ['user.read']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists with this Microsoft ID
      let user = await User.findByOAuth('microsoft', profile.id);
      
      if (user) {
        // Update user info from Microsoft
        user.firstName = profile.name.givenName || user.firstName;
        user.lastName = profile.name.familyName || user.lastName;
        await user.save();
        
        return done(null, user);
      }
      
      // Check if user exists with same email
      const email = profile.emails?.[0]?.value;
      if (email) {
        user = await User.findByEmail(email);
        
        if (user) {
          // Link existing account with Microsoft
          user.oauthProvider = 'microsoft';
          user.oauthId = profile.id;
          user.isVerified = true; // Microsoft already verified the email
          await user.save();
          
          return done(null, user);
        }
      }
      
      // Create new user
      user = await User.create({
        email: email,
        username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
        firstName: profile.name.givenName || 'Usuario',
        lastName: profile.name.familyName || 'Microsoft',
        oauthProvider: 'microsoft',
        oauthId: profile.id,
        isVerified: true,
        isActive: true
      });

      // Send notification email
      try {
        await emailService.sendNewUserByOAuthEmail(user);
      } catch (error) {
        logger.error('Error sending new user email:', error);
      }
      
      return done(null, user);
    } catch (error) {
      logger.error('Error in Microsoft strategy:', error);
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