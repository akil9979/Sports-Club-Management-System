import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  login,
  pinLogin,
  register,
  logout,
  getCurrentUser,
  getAdminUsers,
  updateUserRole,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  isValidEmail
} from '../authApi.js';

describe('Frontend Authentication Flow - MEMBER 2', () => {
  beforeEach(() => {
    removeToken();
    removeStoredUser();
  });

  describe('1. Signup & Account Creation Workflow', () => {
    it('should successfully create a new member account with valid credentials', async () => {
      const email = `alex.turner.${Date.now()}@example.com`;
      const res = await register({
        firstName: 'Alex',
        lastName: 'Turner',
        email,
        phone: '+919876599999',
        password: 'Password@123',
        role: 'member'
      });

      assert.equal(res.success, true);
      assert.ok(res.data, 'Response should contain data payload');
      assert.ok(res.data.user, 'Response data should contain user');
      assert.equal(res.data.user.email, email.toLowerCase());
      assert.equal(res.data.user.firstName, 'Alex');
      assert.equal(res.data.user.lastName, 'Turner');
      assert.equal(res.data.user.role, 'member');
      assert.ok(res.data.token, 'Should issue JWT auth token');

      // Member profile should be created for role=member
      if (res.data.member) {
        assert.ok(res.data.member.id, 'Should create member id');
        assert.ok(res.data.member.member_number || res.data.member.memberNumber, 'Should create member number');
      }

      // Token and user should be persisted
      assert.equal(getToken(), res.data.token);
      assert.ok(getStoredUser(), 'Stored user should exist');
    });

    it('should reject signup with missing or empty first name', async () => {
      await assert.rejects(
        async () => {
          await register({
            firstName: '   ',
            lastName: 'Doe',
            email: 'valid.email@example.com',
            password: 'Password@123'
          });
        },
        (err) => {
          assert.equal(err.status, 422);
          assert.match(err.message, /first name/i);
          return true;
        }
      );
    });

    it('should reject signup with missing or empty last name', async () => {
      await assert.rejects(
        async () => {
          await register({
            firstName: 'John',
            lastName: '',
            email: 'valid.email@example.com',
            password: 'Password@123'
          });
        },
        (err) => {
          assert.equal(err.status, 422);
          assert.match(err.message, /last name/i);
          return true;
        }
      );
    });

    it('should reject signup with invalid email format', async () => {
      await assert.rejects(
        async () => {
          await register({
            firstName: 'John',
            lastName: 'Doe',
            email: 'invalid-email-address',
            password: 'Password@123'
          });
        },
        (err) => {
          assert.equal(err.status, 422);
          assert.match(err.message, /valid email/i);
          return true;
        }
      );
    });

    it('should reject signup with password shorter than 6 characters', async () => {
      await assert.rejects(
        async () => {
          await register({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.short@example.com',
            password: '123'
          });
        },
        (err) => {
          assert.equal(err.status, 422);
          assert.match(err.message, /at least 6 characters/i);
          return true;
        }
      );
    });

    it('should reject duplicate signup for already registered email with Conflict error', async () => {
      const email = `duplicate.test.${Date.now()}@example.com`;
      
      // Register first time
      await register({
        firstName: 'Initial',
        lastName: 'User',
        email,
        password: 'Password@123'
      });

      // Attempt second registration with same email
      await assert.rejects(
        async () => {
          await register({
            firstName: 'Second',
            lastName: 'User',
            email,
            password: 'Password@123'
          });
        },
        (err) => {
          assert.equal(err.status, 409);
          assert.match(err.message, /already registered/i);
          return true;
        }
      );
    });
  });

  describe('2. Login & Credential Authentication', () => {
    it('should successfully authenticate registered member and store session', async () => {
      const res = await login({
        email: 'devon.conway@example.com',
        password: 'Password@123'
      });

      assert.equal(res.success, true);
      assert.ok(res.data.token, 'Must return JWT token');
      assert.ok(res.data.user, 'Must return user object');
      assert.equal(res.data.user.email, 'devon.conway@example.com');
      assert.equal(res.data.user.role, 'member');

      // Verify localStorage sync
      assert.equal(getToken(), res.data.token);
      assert.equal(getStoredUser().email, 'devon.conway@example.com');
    });

    it('should successfully authenticate staff credentials', async () => {
      const res = await login({
        email: 'priya.nair@championsclub.com',
        password: 'Password@123'
      });

      assert.equal(res.success, true);
      assert.equal(res.data.user.role, 'staff');
      assert.equal(res.data.user.firstName, 'Priya');
      assert.ok(res.data.token);
    });

    it('should successfully authenticate admin credentials', async () => {
      const res = await login({
        email: 'admin@championsclub.com',
        password: 'Password@123'
      });

      assert.equal(res.success, true);
      assert.equal(res.data.user.role, 'admin');
      assert.ok(res.data.token);
    });

    it('should reject login when password is incorrect', async () => {
      await assert.rejects(
        async () => {
          await login({
            email: 'devon.conway@example.com',
            password: 'WrongPassword999!'
          });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /invalid email or password/i);
          return true;
        }
      );
    });

    it('should reject login for non-existent email', async () => {
      await assert.rejects(
        async () => {
          await login({
            email: 'nonexistent.ghost.account@example.com',
            password: 'Password@123'
          });
        },
        (err) => {
          assert.equal(err.status, 401);
          assert.match(err.message, /invalid email or password/i);
          return true;
        }
      );
    });

    it('should reject login when email or password is empty', async () => {
      await assert.rejects(
        async () => {
          await login({ email: '', password: 'Password@123' });
        },
        (err) => {
          assert.match(err.message, /required/i);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await login({ email: 'admin@championsclub.com', password: '' });
        },
        (err) => {
          assert.match(err.message, /required/i);
          return true;
        }
      );
    });
  });

  describe('3. Session Hydration & Refresh Flow', () => {
    it('should restore authenticated session when stored token and user exist', async () => {
      // Simulate existing logged in user in storage
      const demoUser = {
        id: 'user-restore-test',
        email: 'restored@example.com',
        role: 'member',
        firstName: 'Restored',
        lastName: 'User'
      };
      setToken('mock-valid-token-12345');
      setStoredUser(demoUser);

      assert.equal(getToken(), 'mock-valid-token-12345');

      const restored = await getCurrentUser();
      assert.ok(restored, 'Should retrieve restored user');
      assert.equal(restored.email, 'restored@example.com');
    });

    it('should return null when no token is present in storage', async () => {
      removeToken();
      removeStoredUser();

      const user = await getCurrentUser();
      assert.equal(user, null, 'Unauthenticated check should return null');
    });
  });

  describe('4. Logout & State Clearance', () => {
    it('should completely clear auth token and cached user upon logout', async () => {
      // Set active session
      setToken('active-token-to-clear');
      setStoredUser({ id: 'usr-1', email: 'test@example.com' });

      assert.ok(getToken());
      assert.ok(getStoredUser());

      const res = await logout();
      assert.equal(res.success, true);
      assert.equal(res.message, 'Logged out successfully');

      // Storage must be empty
      assert.equal(getToken(), null, 'Token should be null after logout');
      assert.equal(getStoredUser(), null, 'User cache should be null after logout');
    });
  });

  describe('5. Protected Route Guarding & RBAC Logic', () => {
    function evaluateRouteAccess({ isAuthenticated, userRole, allowedRoles }) {
      if (!isAuthenticated) {
        return { allowed: false, redirect: '/login' };
      }
      if (!allowedRoles || allowedRoles.length === 0) {
        return { allowed: true };
      }
      if (userRole === 'admin' || allowedRoles.includes(userRole)) {
        return { allowed: true };
      }
      return { allowed: false, redirect: '/unauthorized' };
    }

    it('should deny unauthenticated users and redirect to /login', () => {
      const access = evaluateRouteAccess({
        isAuthenticated: false,
        userRole: null,
        allowedRoles: ['staff', 'manager', 'admin']
      });

      assert.equal(access.allowed, false);
      assert.equal(access.redirect, '/login');
    });

    it('should permit staff member to access staff operations routes', () => {
      const access = evaluateRouteAccess({
        isAuthenticated: true,
        userRole: 'staff',
        allowedRoles: ['staff', 'manager', 'admin']
      });

      assert.equal(access.allowed, true);
    });

    it('should permit admin to access any protected area regardless of role requirement', () => {
      const access = evaluateRouteAccess({
        isAuthenticated: true,
        userRole: 'admin',
        allowedRoles: ['staff']
      });

      assert.equal(access.allowed, true);
    });

    it('should reject regular member from accessing staff-only operations portal', () => {
      const access = evaluateRouteAccess({
        isAuthenticated: true,
        userRole: 'member',
        allowedRoles: ['staff', 'manager', 'admin']
      });

      assert.equal(access.allowed, false);
      assert.equal(access.redirect, '/unauthorized');
    });
  });

  describe('6. Staff PIN Login & Terminal Auth', () => {
    it('should successfully authenticate staff using valid 4-digit PIN', async () => {
      const res = await pinLogin({ pin: '1234' });
      assert.equal(res.success, true);
      assert.ok(res.data.token, 'Should issue session token');
      assert.equal(res.data.user.role, 'staff');
      assert.equal(getToken(), res.data.token);
    });

    it('should reject invalid staff PIN', async () => {
      await assert.rejects(
        async () => {
          await pinLogin({ pin: '0000' });
        },
        (err) => {
          assert.equal(err.status, 401);
          return true;
        }
      );
    });

    it('should reject empty staff PIN', async () => {
      await assert.rejects(
        async () => {
          await pinLogin({ pin: '' });
        },
        (err) => {
          assert.equal(err.status, 400);
          return true;
        }
      );
    });
  });

  describe('7. Admin User & Role Management', () => {
    it('should list all registered users for administration', async () => {
      const users = await getAdminUsers();
      assert.ok(Array.isArray(users), 'Must return array of users');
      assert.ok(users.length >= 3, 'Must contain seed demo users');
      const admin = users.find(u => u.role === 'admin');
      const staff = users.find(u => u.role === 'staff');
      const member = users.find(u => u.role === 'member');
      assert.ok(admin, 'Admin user must exist in list');
      assert.ok(staff, 'Staff user must exist in list');
      assert.ok(member, 'Member user must exist in list');
    });

    it('should update a user role dynamically', async () => {
      const users = await getAdminUsers();
      const targetUser = users.find(u => u.role === 'member') || users[0];
      const updated = await updateUserRole(targetUser.id, 'manager');
      assert.equal(updated.role, 'manager');
    });
  });

  describe('8. Validation Helpers', () => {
    it('should correctly validate email formats', () => {
      assert.equal(isValidEmail('member@example.com'), true);
      assert.equal(isValidEmail('staff.lead+club@sub.domain.co'), true);
      assert.equal(isValidEmail('invalid-plain-text'), false);
      assert.equal(isValidEmail('missing@tld'), false);
      assert.equal(isValidEmail('@nodomain.com'), false);
      assert.equal(isValidEmail(null), false);
      assert.equal(isValidEmail(undefined), false);
    });
  });
});
