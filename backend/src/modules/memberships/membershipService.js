/**
 * Champions Club - Membership Plans & Subscriptions Service
 * Role: MEMBER 3 (Canonical Database Owner)
 */

const { query, withTransaction } = require('../../config/database');

class MembershipService {
  /**
   * Get all active membership plans (public endpoint matching frontend contract)
   */
  async getPlans() {
    const res = await query(
      `SELECT id, name, tier, price, annual_price, billing_cycle, badge, popular,
              description, court_privileges, shop_discount_pct, bar_discount_pct,
              court_discount_pct, advance_booking_days, guest_passes_per_month, features
       FROM membership_plans
       WHERE is_active = true
       ORDER BY price ASC`
    );

    // Map fields cleanly to camelCase for API consumers if needed, while maintaining exact schema fidelity
    return res.rows.map(plan => ({
      id: plan.id,
      name: plan.name,
      tier: plan.tier,
      price: parseFloat(plan.price),
      annualPrice: parseFloat(plan.annual_price),
      billingCycle: plan.billing_cycle,
      badge: plan.badge,
      popular: plan.popular,
      description: plan.description,
      courtPrivileges: plan.court_privileges,
      shopDiscount: `${parseFloat(plan.shop_discount_pct)}% Pro Shop discount`,
      barDiscount: `${parseFloat(plan.bar_discount_pct)}% Lounge & Bar discount`,
      shopDiscountPct: parseFloat(plan.shop_discount_pct),
      barDiscountPct: parseFloat(plan.bar_discount_pct),
      courtDiscountPct: parseFloat(plan.court_discount_pct),
      advanceBookingDays: plan.advance_booking_days,
      guestPassesPerMonth: plan.guest_passes_per_month,
      features: plan.features
    }));
  }

  /**
   * Get specific plan details
   */
  async getPlanById(planId) {
    const res = await query(
      `SELECT * FROM membership_plans WHERE id = $1`,
      [planId]
    );

    if (res.rowCount === 0) {
      const error = new Error(`Membership plan '${planId}' not found`);
      error.statusCode = 404;
      throw error;
    }

    return res.rows[0];
  }

  /**
   * Subscribe member to a membership plan (Transactional)
   */
  async subscribe({ memberId, planId, billingCycle = 'monthly', startDate = new Date() }) {
    return withTransaction(async (client) => {
      // 1. Verify plan
      const planRes = await client.query(
        'SELECT * FROM membership_plans WHERE id = $1 AND is_active = true',
        [planId]
      );
      if (planRes.rowCount === 0) {
        const error = new Error(`Membership plan '${planId}' not found or inactive`);
        error.statusCode = 404;
        throw error;
      }
      const plan = planRes.rows[0];

      // 2. Verify member
      const memberRes = await client.query(
        'SELECT * FROM members WHERE id = $1',
        [memberId]
      );
      if (memberRes.rowCount === 0) {
        const error = new Error(`Member '${memberId}' not found`);
        error.statusCode = 404;
        throw error;
      }

      // 3. Calculate start & end date
      const start = new Date(startDate);
      const end = new Date(start);
      if (billingCycle === 'annual') {
        end.setFullYear(end.getFullYear() + 1);
      } else if (billingCycle === 'quarterly') {
        end.setMonth(end.getMonth() + 3);
      } else {
        end.setMonth(end.getMonth() + 1);
      }

      // 4. Mark existing active memberships as expired/upgraded
      await client.query(
        `UPDATE memberships
         SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE member_id = $1 AND status = 'active'`,
        [memberId]
      );

      // 5. Insert new active membership
      const insertRes = await client.query(
        `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, auto_renew, payment_frequency)
         VALUES ($1, $2, $3, $4, 'active', true, $5)
         RETURNING *`,
        [memberId, plan.id, start.toISOString().split('T')[0], end.toISOString().split('T')[0], billingCycle]
      );

      return {
        membership: insertRes.rows[0],
        plan
      };
    });
  }
}

module.exports = new MembershipService();
