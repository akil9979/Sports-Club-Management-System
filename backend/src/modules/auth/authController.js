/**
 * Champions Club - Authentication Controller
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const authService = require('./authService');
const { validators } = require('../../middleware/validator');

class AuthController {
  async register(req, res, next) {
    try {
      const { email, password, firstName, lastName, phone, role } = req.body;

      if (!validators.isEmail(email)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Valid email is required' });
      }
      if (!validators.isNonEmptyString(password, 6)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Password must be at least 6 characters' });
      }
      if (!validators.isNonEmptyString(firstName, 1)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'First name is required' });
      }
      if (!validators.isNonEmptyString(lastName, 1)) {
        return res.status(422).json({ success: false, error: 'Validation Error', message: 'Last name is required' });
      }

      const result = await authService.register({ email, password, firstName, lastName, phone, role });
      res.status(201).json({
        success: true,
        data: result,
        message: 'Account registered successfully'
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      if (!validators.isEmail(email) || !validators.isNonEmptyString(password, 1)) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'Email and password are required' });
      }

      const result = await authService.login({ email, password });
      res.status(200).json({
        success: true,
        data: result,
        message: 'Login successful'
      });
    } catch (err) {
      next(err);
    }
  }

  async pinLogin(req, res, next) {
    try {
      const { pin, employeeId } = req.body;
      if (!pin) {
        return res.status(400).json({ success: false, error: 'Bad Request', message: 'PIN code is required' });
      }

      const result = await authService.pinLogin({ pin, employeeId });
      res.status(200).json({
        success: true,
        data: result,
        message: 'Terminal authenticated'
      });
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      const profile = await authService.getProfile(req.user.id);
      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
