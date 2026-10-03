/**
 * Champions Club - Members Service
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { query } = require('../../config/database');

class MemberService {
  /**
   * List members with filtering and pagination
   */
  async getMembers({ search, status, tier, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT m.id, m.member_number, m.first_name, m.last_name, m.email, m.phone,
             m.gender, m.status, m.created_at,
             ms.id AS membership_id, ms.status AS membership_status,
             mp.id AS plan_id, mp.name AS plan_name, mp.tier AS plan_tier
      FROM members m
      LEFT JOIN LATERAL (
        SELECT ms1.id, ms1.plan_id, ms1.status
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
   * Get member by ID with current membership and booking stats
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
              mp.name AS plan_name, mp.tier AS plan_tier, mp.price, mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct
       FROM memberships ms
       JOIN membership_plans mp ON mp.id = ms.plan_id
       WHERE ms.member_id = $1 AND ms.status = 'active'
       ORDER BY ms.end_date DESC
       LIMIT 1`,
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

    const sql = `
      UPDATE members
      SET ${setClauses.join(', ')}
      WHERE id = $1
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
