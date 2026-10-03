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
   * Get all memberships history for a specific member
   */
  async getMemberMemberships(memberId) {
    // 1. Verify member exists
    const memberRes = await query(
      'SELECT id, member_number, first_name, last_name FROM members WHERE id = $1 OR member_number = $1',
      [memberId]
    );
    if (memberRes.rowCount === 0) {
      const error = new Error(`Member '${memberId}' not found`);
      error.statusCode = 404;
      throw error;
    }
    const resolvedMemberId = memberRes.rows[0].id;

    const res = await query(
      `SELECT ms.id, ms.member_id, ms.plan_id, ms.start_date, ms.end_date, ms.status,
              ms.auto_renew, ms.payment_frequency, ms.created_at, ms.updated_at,
              mp.name AS plan_name, mp.tier AS plan_tier, mp.price AS plan_price,
              mp.annual_price AS plan_annual_price, mp.court_privileges,
              mp.shop_discount_pct, mp.bar_discount_pct, mp.court_discount_pct,
              mp.advance_booking_days, mp.guest_passes_per_month
       FROM memberships ms
       JOIN membership_plans mp ON mp.id = ms.plan_id
       WHERE ms.member_id = $1
       ORDER BY ms.created_at DESC`,
      [resolvedMemberId]
    );

    return res.rows;
  }

  /**
   * Subscribe member to a membership plan (Transactional)
   */
  async subscribe({ memberId, planId, billingCycle = 'monthly', startDate = new Date(), endDate = null, autoRenew = true }) {
    return withTransaction(async (client) => {
      // 1. Verify plan exists and is active
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

      // 2. Verify member exists
      const memberRes = await client.query(
        'SELECT * FROM members WHERE id = $1 OR member_number = $1',
        [memberId]
      );
      if (memberRes.rowCount === 0) {
        const error = new Error(`Member '${memberId}' not found`);
        error.statusCode = 404;
        throw error;
      }
      const member = memberRes.rows[0];
      const targetMemberId = member.id;

      // 3. Validate Junior plan eligibility based on Date of Birth
      const isJuniorPlan = (plan.tier && plan.tier.toLowerCase() === 'junior') ||
                           (plan.id && plan.id.toLowerCase().includes('junior')) ||
                           (plan.name && plan.name.toLowerCase().includes('junior'));

      const start = new Date(startDate);
      if (isNaN(start.getTime())) {
        const error = new Error('Invalid start date provided');
        error.statusCode = 422;
        throw error;
      }

      if (isJuniorPlan) {
        if (!member.date_of_birth) {
          const error = new Error('Date of birth is required to verify eligibility for Junior membership');
          error.statusCode = 422;
          throw error;
        }

        const dob = new Date(member.date_of_birth);
        if (isNaN(dob.getTime())) {
          const error = new Error('Invalid date of birth recorded for member');
          error.statusCode = 422;
          throw error;
        }

        // Calculate age at start date
        let age = start.getFullYear() - dob.getFullYear();
        const monthDiff = start.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && start.getDate() < dob.getDate())) {
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

      // 4. Calculate or validate end date
      let end;
      if (endDate) {
        end = new Date(endDate);
        if (isNaN(end.getTime())) {
          const error = new Error('Invalid end date provided');
          error.statusCode = 422;
          throw error;
        }
        if (end < start) {
          const error = new Error('End date must be greater than or equal to start date');
          error.statusCode = 422;
          throw error;
        }
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

      // 5. Mark existing active memberships as expired/superseded
      await client.query(
        `UPDATE memberships
         SET status = 'expired', updated_at = CURRENT_TIMESTAMP
         WHERE member_id = $1 AND status = 'active'`,
        [targetMemberId]
      );

      // 6. Insert new active membership with backend-derived plan pricing
      const insertRes = await client.query(
        `INSERT INTO memberships (member_id, plan_id, start_date, end_date, status, auto_renew, payment_frequency)
         VALUES ($1, $2, $3, $4, 'active', $5, $6)
         RETURNING *`,
        [
          targetMemberId,
          plan.id,
          start.toISOString().split('T')[0],
          end.toISOString().split('T')[0],
          Boolean(autoRenew),
          billingCycle
        ]
      );

      // 7. Update member status to active
      await client.query(
        `UPDATE members
         SET status = 'active', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [targetMemberId]
      );

      return {
        membership: insertRes.rows[0],
        plan: {
          id: plan.id,
          name: plan.name,
          tier: plan.tier,
          price: parseFloat(plan.price),
          annualPrice: parseFloat(plan.annual_price),
          shopDiscountPct: parseFloat(plan.shop_discount_pct),
          barDiscountPct: parseFloat(plan.bar_discount_pct),
          courtDiscountPct: parseFloat(plan.court_discount_pct),
          advanceBookingDays: plan.advance_booking_days,
          guestPassesPerMonth: plan.guest_passes_per_month,
          courtPrivileges: plan.court_privileges
        }
      };
    });
  }
}

module.exports = new MembershipService();
