/**
 * AgriWise: Authentication Controller
 * Handles user registration, login, profile updates, and role-based redirects.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

class AuthController {
  /**
   * Register a new Farmer or Admin / Agronomist
   */
  async register(req, res) {
    try {
      const { name, email, phone, password, state, district, village, farmer_type, total_farming_area, role } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Full Name, Email, and Password are required.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Check if user already exists
      const existing = await db.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing && existing.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please sign in.'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Determine user role (defaults to farmer)
      const targetRole = (role && role.trim().toLowerCase() === 'admin') ? 'admin' : 'farmer';

      // Create user record
      const userResult = await db.query(
        `INSERT INTO users (name, email, phone, password, role, status)
         VALUES (?, ?, ?, ?, ?, 'active')`,
        [name.trim(), cleanEmail, phone ? phone.trim() : null, hashedPassword, targetRole]
      );
      const userId = userResult.insertId;

      // Create associated farmer profile if role is farmer
      if (targetRole === 'farmer') {
        await db.query(
          `INSERT INTO farmer_profiles (user_id, country, state, district, village, preferred_language, farmer_type, total_farming_area)
           VALUES (?, 'India', ?, ?, ?, 'English', ?, ?)`,
          [
            userId,
            state ? state.trim() : 'India',
            district ? district.trim() : 'General',
            village ? village.trim() : null,
            farmer_type || 'Smallholder',
            total_farming_area ? parseFloat(total_farming_area) : 0.00
          ]
        );
      }

      // Issue JWT
      const token = jwt.sign(
        { id: userId, email: cleanEmail, role: targetRole, name: name.trim() },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const redirectUrl = targetRole === 'admin'
        ? '/admin/dashboard.html'
        : '/farmer/dashboard.html';

      return res.status(201).json({
        success: true,
        message: targetRole === 'admin'
          ? 'Lead Agronomist / Admin account registered successfully!'
          : 'Farmer account registered successfully!',
        token,
        user: {
          id: userId,
          name: name.trim(),
          email: cleanEmail,
          role: targetRole
        },
        redirectUrl
      });
    } catch (err) {
      console.error('Registration Error:', err);
      return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred during registration. Please try again.'
      });
    }
  }

  /**
   * User Login (Farmer or Admin)
   */
  async login(req, res) {
    try {
      const { email, password, role } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both email and password.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Find user
      const users = await db.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
      if (!users || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const user = users[0];

      if (user.status !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'This account has been deactivated or suspended. Please contact support.'
        });
      }

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Issue JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const redirectUrl = user.role === 'admin'
        ? '/admin/dashboard.html'
        : '/farmer/dashboard.html';

      const welcomeMsg = user.role === 'admin'
        ? `Welcome back, Lead Agronomist ${user.name}!`
        : `Welcome back, ${user.name}!`;

      return res.json({
        success: true,
        message: welcomeMsg,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone
        },
        redirectUrl
      });
    } catch (err) {
      console.error('Login Error:', err);
      return res.status(500).json({
        success: false,
        message: 'Server error during login. Please try again.'
      });
    }
  }

  /**
   * Get Current Authenticated User & Profile
   */
  async getMe(req, res) {
    try {
      const users = await db.query(
        'SELECT id, name, email, phone, role, status, created_at FROM users WHERE id = ?',
        [req.user.id]
      );
      if (!users || users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const user = users[0];

      if (user.role === 'farmer') {
        const profiles = await db.query(
          'SELECT * FROM farmer_profiles WHERE user_id = ?',
          [user.id]
        );
        user.profile = profiles && profiles.length > 0 ? profiles[0] : null;
      }

      return res.json({
        success: true,
        user
      });
    } catch (err) {
      console.error('getMe Error:', err);
      return res.status(500).json({ success: false, message: 'Server error retrieving user data.' });
    }
  }

  /**
   * Update Farmer Profile
   */
  async updateProfile(req, res) {
    try {
      const { name, phone, country, state, district, village, preferred_language, farmer_type, total_farming_area } = req.body;
      const userId = req.user.id;

      // Update users table
      if (name || phone !== undefined) {
        await db.query(
          'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [name || null, phone !== undefined ? phone : null, userId]
        );
      }

      // Check if profile exists
      const profiles = await db.query('SELECT id FROM farmer_profiles WHERE user_id = ?', [userId]);

      if (profiles && profiles.length > 0) {
        await db.query(
          `UPDATE farmer_profiles SET
            country = COALESCE(?, country),
            state = COALESCE(?, state),
            district = COALESCE(?, district),
            village = COALESCE(?, village),
            preferred_language = COALESCE(?, preferred_language),
            farmer_type = COALESCE(?, farmer_type),
            total_farming_area = COALESCE(?, total_farming_area),
            updated_at = CURRENT_TIMESTAMP
           WHERE user_id = ?`,
          [
            country || null,
            state || null,
            district || null,
            village || null,
            preferred_language || null,
            farmer_type || null,
            total_farming_area !== undefined ? parseFloat(total_farming_area) : null,
            userId
          ]
        );
      } else {
        await db.query(
          `INSERT INTO farmer_profiles (user_id, country, state, district, village, preferred_language, farmer_type, total_farming_area)
           VALUES (?, COALESCE(?, 'India'), ?, ?, ?, COALESCE(?, 'English'), COALESCE(?, 'Smallholder'), ?)`,
          [
            userId,
            country || null,
            state || null,
            district || null,
            village || null,
            preferred_language || null,
            farmer_type || null,
            total_farming_area ? parseFloat(total_farming_area) : 0.00
          ]
        );
      }

      return res.json({
        success: true,
        message: 'Profile updated successfully.'
      });
    } catch (err) {
      console.error('updateProfile Error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating profile.' });
    }
  }

  /**
   * Change Password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Both current and new password are required.' });
      }

      const users = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
      if (!users || users.length === 0) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, users[0].password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password does not match.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashed = await bcrypt.hash(newPassword, salt);

      await db.query('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, userId]);

      return res.json({ success: true, message: 'Password updated successfully.' });
    } catch (err) {
      console.error('changePassword Error:', err);
      return res.status(500).json({ success: false, message: 'Server error updating password.' });
    }
  }
}

module.exports = new AuthController();
