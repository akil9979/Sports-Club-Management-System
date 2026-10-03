/**
 * Champions Club - Members Service
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const bcrypt = require('bcryptjs');
const { query, withTransaction } = require('../../config/database');
const { validators } = require('../../middleware/validator');

class MemberService {
  /**
   * Create a new member (and optionally user account + initial membership plan)
   */
  async createMember({
    firstName,
    lastName,
    email,
    phone,
    gender = null,
    dateOfBirth = null,
    address = null,
    emergencyContactName = null,
    emergencyContactPhone = null,
    password = null,
    role = 'member',
    planId = null,
    billingCycle = 'monthly',
    startDate = new Date(),
    endDate = null
  }) {
    // 1. Validation
    if (!validators.isNonEmptyString(firstName, 1)) {
      const error = new Error('First name is required');
      error.statusCode = 422;
      throw error;
    }
    if (!validators.isNonEmptyString(lastName, 1)) {
      const error = new Error('Last name is required');
      error.statusCode = 422;
      throw error;
    }
    if (!validators.isEmail(email)) {
      const error = new Error('Valid email address is required');
      error.statusCode = 422;
      throw error;
    }
    if (!validators.isNonEmptyString(phone, 1)) {
      const error = new Error('Phone number is required');
      error.statusCode = 422;
      throw error;
    }

    if (gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(gender)) {
      const error = new Error('Gender must be one of: male, female, other, prefer_not_to_say');
      error.statusCode = 422;
      throw error;
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email in members table
    const existingMember = await query(
      'SELECT id FROM members WHERE email = $1',
      [cleanEmail]
    );
    if (existingMember.rowCount > 0) {
      const error = new Error('Email address is already registered to a member');
      error.statusCode = 409;
      throw error;
    }

    // 2. If planId provided, check plan validity and Junior eligibility
    let plan = null;
    if (planId) {
      const planRes = await query(
        'SELECT * FROM membership_plans WHERE id = $1 AND is_active = true',
        [planId]
      );
      if (planRes.rowCount === 0) {
        const error = new Error(`Membership plan '${planId}' not found or inactive`);
        error.statusCode = 404;
        throw error;
      }
      plan = planRes.rows[0];

      const isJuniorPlan = (plan.tier && plan.tier.toLowerCase() === 'junior') ||
                           (plan.id && plan.id.toLowerCase().includes('junior')) ||
                           (plan.name && plan.name.toLowerCase().includes('junior'));

      if (isJuniorPlan) {
        if (!dateOfBirth) {
          const error = new Error('Date of birth is required to verify eligibility for Junior membership');
          error.statusCode = 422;
          throw error;
        }

        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          const error = new Error('Invalid date of birth format');
          error.statusCode = 422;
          throw error;
        }

        const refDate = new Date(startDate);
        let age = refDate.getFullYear() - dob.getFullYear();
        const monthDiff = refDate.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < dob.getDate())) {
          age--;
        }

        if (age < 0) {
          const error = new Error('Date of birth cannot be in the future');
          error.statusCode = 422;
          throw error;
        }

        if (age >= 18) {
          const error = new Error(`Member is ${age} years old and is not eligible for Junior membership (must be under 18)`);
          error.statusCode = 422;
          throw error;
        }
      }
    }

    // 3. Transactional creation
    return withTransaction(async (client) => {
      let userId = null;

      // Handle user account creation if password is provided
      if (password) {
        const existingUser = await client.query(
          'SELECT id FROM users WHERE email = $1',
          [cleanEmail]
        );
        if (existingUser.rowCount > 0) {
          userId = existingUser.rows[0].id;
        } else {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(password, salt);
          const userRes = await client.query(
            `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id`,
            [cleanEmail, passwordHash, role, firstName.trim(), lastName.trim(), phone.trim()]
          );
          userId = userRes.rows[0].id;
        }
      }

      // Generate unique member ID and member number
      let memberId;
      let memberNumber;
      let isUnique = false;
      let attempts = 0;

      while (!isUnique && attempts < 10) {
        attempts++;
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        memberId = `MEM-${randomSuffix}`;
        memberNumber = `CC-${new Date().getFullYear()}-${randomSuffix}`;

        const checkRes = await client.query(
          'SELECT id FROM members WHERE id = $1 OR member_number = $2',
          [memberId, memberNumber]
        );
        if (checkRes.rowCount === 0) {
          isUnique = true;
        }
      }

      const memberRes = await client.query(
        `INSERT INTO members (
           id, user_id, member_number, first_name, last_name, email, phone,
           gender, date_of_birth, address, emergency_contact_name, emergency_contact_phone, status
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'active')
         RETURNING *`,
        [
          memberId,
          userId,
          memberNumber,
          firstName.trim(),
          lastName.trim(),
          cleanEmail,
          phone.trim(),
          gender || null,
          dateOfBirth || null,
          address?.trim() || null,
          emergencyContactName?.trim() || null,
          emergencyContactPhone?.trim() || null
        ]
      );
      const newMember = memberRes.rows[0];

      // Initial membership creation if plan was specified
      let createdMembership = null;
      if (plan) {
        const start = new Date(startDate);
        let end;
        if (endDate) {
          end = new Date(endDate);
        } else {
          end = new Date(start);
          if (billingCycle === 'annual') {
            end.setFullYear(end.getFullYear() + 1);
          } else if (billingCycle === 'quarterly') {
            end.setMonth(end.getMonth() + 3);
          } else {
            end.setMonth(end.getMonth() + 1);
          }
        }

        const memRes = await client.query(
          `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, auto_renew, payment_frequency)
           VALUES ($1, $2, $3, $4, 'active', true, $5)
           RETURNING *`,
          [
            newMember.id,
            plan.id,
            start.toISOString().split('T')[0],
            end.toISOString().split('T')[0],
            billingCycle
          ]
        );
        createdMembership = {
          ...memRes.rows[0],
          planName: plan.name,
          planTier: plan.tier
        };
      }

      return {
        ...newMember,
        membership: createdMembership
      };
    });
  }

  /**
   * List members with filtering and pagination
   */
  async getMembers({ search, status, tier, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT m.id, m.member_number, m.first_name, m.last_name, m.email, m.phone,
             m.gender, m.date_of_birth, m.status, m.created_at,
             ms.id AS membership_id, ms.status AS membership_status,
             mp.id AS plan_id, mp.name AS plan_name, mp.tier AS plan_tier,
             mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct
      FROM members m
      LEFT JOIN LATERAL (
        SELECT ms1.id, ms1.plan_id, ms1.status, ms1.end_date
        FROM memberships ms1
        WHERE ms1.member_id = m.id AND ms1.status = 'active'
        ORDER BY ms1.end_date DESC
        LIMIT 1
      ) ms ON true
      LEFT JOIN membership_plans mp ON mp.id = ms.plan_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      sql += ` AND (LOWER(m.first_name || ' ' || m.last_name) LIKE $${params.length} 
                OR LOWER(m.email) LIKE $${params.length} 
                OR LOWER(m.member_number) LIKE $${params.length}
                OR LOWER(m.id) LIKE $${params.length})`;
    }

    if (status) {
      params.push(status);
      sql += ` AND m.status = $${params.length}`;
    }

    if (tier) {
      params.push(tier);
      sql += ` AND mp.tier = $${params.length}`;
    }

    sql += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Get member by ID with current active membership, full membership history, and booking stats
   */
  async getMemberById(memberId) {
    const memberRes = await query(
      `SELECT m.id, m.user_id, m.member_number, m.first_name, m.last_name, m.email, m.phone,
              m.gender, m.date_of_birth, m.address, m.emergency_contact_name, m.emergency_contact_phone,
              m.status, m.created_at, m.updated_at
       FROM members m
       WHERE m.id = $1 OR m.member_number = $1`,
      [memberId]
    );

    if (memberRes.rowCount === 0) {
      const error = new Error(`Member '${memberId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    const member = memberRes.rows[0];

    // Current active membership
    const membershipRes = await query(
      `SELECT ms.id, ms.plan_id, ms.start_date, ms.end_date, ms.status, ms.auto_renew, ms.payment_frequency,
              mp.name AS plan_name, mp.tier AS plan_tier, mp.price, mp.annual_price,
              mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct,
              mp.advance_booking_days, mp.guest_passes_per_month, mp.court_privileges
       FROM memberships ms
       JOIN membership_plans mp ON mp.id = ms.plan_id
       WHERE ms.member_id = $1 AND ms.status = 'active'
       ORDER BY ms.end_date DESC
       LIMIT 1`,
      [member.id]
    );

    // All memberships history
    const historyRes = await query(
      `SELECT ms.id, ms.plan_id, ms.start_date, ms.end_date, ms.status, ms.auto_renew, ms.payment_frequency, ms.created_at,
              mp.name AS plan_name, mp.tier AS plan_tier, mp.price, mp.annual_price
       FROM memberships ms
       JOIN membership_plans mp ON mp.id = ms.plan_id
       WHERE ms.member_id = $1
       ORDER BY ms.created_at DESC`,
      [member.id]
    );

    // Recent bookings count
    const bookingCountRes = await query(
      `SELECT COUNT(*) AS total_bookings
       FROM bookings
       WHERE member_id = $1 AND status != 'cancelled'`,
      [member.id]
    );

    return {
      ...member,
      membership: membershipRes.rows[0] || null,
      memberships: historyRes.rows,
      stats: {
        totalBookings: parseInt(bookingCountRes.rows[0]?.total_bookings || '0', 10)
      }
    };
  }

  /**
   * Update member profile
   */
  async updateMember(memberId, updates) {
    const allowed = ['first_name', 'last_name', 'phone', 'gender', 'date_of_birth', 'address', 'emergency_contact_name', 'emergency_contact_phone', 'status'];
    const setClauses = [];
    const params = [memberId];

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowed.includes(snakeKey)) {
        params.push(value);
        setClauses.push(`${snakeKey} = $${params.length}`);
      }
    }

    if (setClauses.length === 0) {
      return this.getMemberById(memberId);
    }

    setClauses.push('updated_at = CURRENT_TIMESTAMP');

    const sql = `
      UPDATE members
      SET ${setClauses.join(', ')}
      WHERE id = $1 OR member_number = $1
      RETURNING *
    `;

    const res = await query(sql, params);
    if (res.rowCount === 0) {
      const error = new Error(`Member '${memberId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
  }
}

module.exports = new MemberService();
