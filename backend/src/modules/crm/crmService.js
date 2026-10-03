/**
 * Champions Club - CRM & Enquiry Management Service
 * Role: MEMBER 4 (Backend Operations Developer)
 */

const { query, withTransaction } = require('../../config/database');

class CrmService {
  /**
   * Create new customer lead / enquiry (Public submission)
   */
  async createLead({
    name,
    email,
    phone,
    sport = null,
    interestTier = null,
    interest_tier = null,
    source = 'website',
    message = null,
    assignedTo = null,
    assigned_to = null
  }) {
    const tier = interestTier || interest_tier || null;
    const assigned = assignedTo || assigned_to || null;

    // Check for duplicate pending enquiry from same email or phone in 'new' state
    const dupCheck = await query(
      `SELECT id FROM leads WHERE (LOWER(email) = LOWER($1) OR phone = $2) AND status = 'new'`,
      [email.trim(), phone.trim()]
    );
    if (dupCheck.rowCount > 0) {
      const error = new Error(`An open enquiry for '${email.trim()}' is already pending review`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_ENQUIRY';
      throw error;
    }

    // Generate unique human-readable lead ID
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const leadId = `LEAD-${randSuffix}`;

    const res = await query(
      `INSERT INTO leads (
          id, name, email, phone, sport, interest_tier, source, status, message, assigned_to
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'new', $8, $9)
       RETURNING *`,
      [leadId, name.trim(), email.trim(), phone.trim(), sport, tier, source, message, assigned]
    );

    const lead = res.rows[0];
    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      sport: lead.sport,
      interestTier: lead.interest_tier,
      interest_tier: lead.interest_tier,
      source: lead.source,
      status: lead.status,
      message: lead.message,
      assignedTo: lead.assigned_to,
      assigned_to: lead.assigned_to,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    };
  }

  /**
   * Retrieve list of leads with optional filtering and search
   */
  async getLeads({ status, sport, search, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT l.id, l.name, l.email, l.phone, l.sport, l.interest_tier,
             l.source, l.status, l.message, l.assigned_to, l.created_at, l.updated_at,
             u.first_name AS assigned_first_name, u.last_name AS assigned_last_name
      FROM leads l
      LEFT JOIN users u ON u.id = l.assigned_to
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND l.status = $${params.length}`;
    }

    if (sport && sport !== 'all') {
      params.push(sport.toLowerCase());
      sql += ` AND LOWER(l.sport) = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (
        LOWER(l.name) LIKE $${params.length} OR
        LOWER(l.email) LIKE $${params.length} OR
        LOWER(l.phone) LIKE $${params.length} OR
        LOWER(COALESCE(l.sport, '')) LIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY l.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(Number(limit) || 50, Number(offset) || 0);

    const res = await query(sql, params);

    return res.rows.map(lead => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      sport: lead.sport,
      interestTier: lead.interest_tier,
      interest_tier: lead.interest_tier,
      source: lead.source,
      status: lead.status,
      message: lead.message,
      assignedTo: lead.assigned_to,
      assigned_to: lead.assigned_to,
      assignedName: lead.assigned_first_name ? `${lead.assigned_first_name} ${lead.assigned_last_name}` : null,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at
    }));
  }

  /**
   * Get complete lead details including sub-resources (followups, quotations, trials)
   */
  async getLeadById(leadId) {
    const leadRes = await query(
      `SELECT l.id, l.name, l.email, l.phone, l.sport, l.interest_tier,
              l.source, l.status, l.message, l.assigned_to, l.created_at, l.updated_at,
              u.first_name AS assigned_first_name, u.last_name AS assigned_last_name
       FROM leads l
       LEFT JOIN users u ON u.id = l.assigned_to
       WHERE l.id = $1`,
      [leadId]
    );

    if (leadRes.rowCount === 0) {
      const error = new Error(`Enquiry Lead '${leadId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    const lead = leadRes.rows[0];

    // Fetch followups
    const followupsRes = await query(
      `SELECT f.id, f.lead_id, f.followup_date, f.contact_method, f.summary,
              f.outcome, f.next_action_date, f.created_by, f.created_at,
              u.first_name, u.last_name
       FROM lead_followups f
       LEFT JOIN users u ON u.id = f.created_by
       WHERE f.lead_id = $1
       ORDER BY f.followup_date DESC`,
      [leadId]
    );

    // Fetch quotations
    const quotationsRes = await query(
      `SELECT q.id, q.quotation_number, q.lead_id, q.member_id, q.title,
              q.plan_id, q.amount, q.discount_amount, q.valid_until, q.status,
              q.terms, q.created_at, q.updated_at
       FROM quotations q
       WHERE q.lead_id = $1
       ORDER BY q.created_at DESC`,
      [leadId]
    );

    // Fetch trial bookings
    const trialsRes = await query(
      `SELECT tb.id, tb.lead_id, tb.court_id, c.name AS court_name,
              tb.scheduled_time, tb.duration_minutes, tb.status, tb.feedback,
              tb.created_at, tb.updated_at
       FROM trial_bookings tb
       JOIN courts c ON c.id = tb.court_id
       WHERE tb.lead_id = $1
       ORDER BY tb.scheduled_time ASC`,
      [leadId]
    );

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      sport: lead.sport,
      interestTier: lead.interest_tier,
      interest_tier: lead.interest_tier,
      source: lead.source,
      status: lead.status,
      message: lead.message,
      assignedTo: lead.assigned_to,
      assigned_to: lead.assigned_to,
      assignedName: lead.assigned_first_name ? `${lead.assigned_first_name} ${lead.assigned_last_name}` : null,
      createdAt: lead.created_at,
      updatedAt: lead.updated_at,
      followups: followupsRes.rows.map(f => ({
        id: f.id,
        leadId: f.lead_id,
        lead_id: f.lead_id,
        followupDate: f.followup_date,
        followup_date: f.followup_date,
        contactMethod: f.contact_method,
        contact_method: f.contact_method,
        summary: f.summary,
        outcome: f.outcome,
        nextActionDate: f.next_action_date,
        next_action_date: f.next_action_date,
        createdBy: f.created_by,
        creatorName: f.first_name ? `${f.first_name} ${f.last_name}` : null,
        createdAt: f.created_at
      })),
      quotations: quotationsRes.rows.map(q => ({
        id: q.id,
        quotationNumber: q.quotation_number,
        quotation_number: q.quotation_number,
        leadId: q.lead_id,
        lead_id: q.lead_id,
        title: q.title,
        planId: q.plan_id,
        plan_id: q.plan_id,
        amount: parseFloat(q.amount),
        discountAmount: parseFloat(q.discount_amount),
        validUntil: q.valid_until,
        valid_until: q.valid_until,
        status: q.status,
        terms: q.terms,
        createdAt: q.created_at
      })),
      trials: trialsRes.rows.map(t => ({
        id: t.id,
        leadId: t.lead_id,
        lead_id: t.lead_id,
        courtId: t.court_id,
        court_id: t.court_id,
        courtName: t.court_name,
        scheduledTime: t.scheduled_time,
        scheduled_time: t.scheduled_time,
        durationMinutes: t.duration_minutes,
        duration_minutes: t.duration_minutes,
        status: t.status,
        feedback: t.feedback,
        createdAt: t.created_at
      }))
    };
  }

  /**
   * Update lead profile and status
   */
  async updateLead(leadId, updates = {}) {
    const existing = await query('SELECT * FROM leads WHERE id = $1', [leadId]);
    if (existing.rowCount === 0) {
      const error = new Error(`Enquiry Lead '${leadId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    const fields = [];
    const values = [];

    if (updates.name !== undefined) {
      values.push(updates.name.trim());
      fields.push(`name = $${values.length}`);
    }
    if (updates.email !== undefined) {
      values.push(updates.email.trim());
      fields.push(`email = $${values.length}`);
    }
    if (updates.phone !== undefined) {
      values.push(updates.phone.trim());
      fields.push(`phone = $${values.length}`);
    }
    if (updates.sport !== undefined) {
      values.push(updates.sport);
      fields.push(`sport = $${values.length}`);
    }
    const tier = updates.interestTier !== undefined ? updates.interestTier : updates.interest_tier;
    if (tier !== undefined) {
      values.push(tier);
      fields.push(`interest_tier = $${values.length}`);
    }
    if (updates.status !== undefined) {
      values.push(updates.status);
      fields.push(`status = $${values.length}`);
    }
    if (updates.message !== undefined) {
      values.push(updates.message);
      fields.push(`message = $${values.length}`);
    }
    const assigned = updates.assignedTo !== undefined ? updates.assignedTo : updates.assigned_to;
    if (assigned !== undefined) {
      values.push(assigned);
      fields.push(`assigned_to = $${values.length}`);
    }

    if (fields.length === 0) {
      return this.getLeadById(leadId);
    }

    values.push(leadId);
    const sql = `
      UPDATE leads
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;

    const res = await query(sql, values);
    const updated = res.rows[0];

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      sport: updated.sport,
      interestTier: updated.interest_tier,
      interest_tier: updated.interest_tier,
      source: updated.source,
      status: updated.status,
      message: updated.message,
      assignedTo: updated.assigned_to,
      assigned_to: updated.assigned_to,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at
    };
  }

  /**
   * Log a follow-up interaction for an enquiry lead
   */
  async createFollowup(leadId, {
    summary,
    note,
    contactMethod = 'phone',
    contact_method = null,
    followupDate = null,
    followup_date = null,
    outcome = 'Follow-up logged',
    nextActionDate = null,
    next_action_date = null
  }, createdBy = null) {
    const leadRes = await query('SELECT id, status FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rowCount === 0) {
      const error = new Error(`Enquiry Lead '${leadId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    const text = summary || note;
    const method = contact_method || contactMethod || 'phone';
    const date = followup_date || followupDate || new Date().toISOString();
    const nextDate = next_action_date || nextActionDate || null;

    const res = await query(
      `INSERT INTO lead_followups (
          lead_id, followup_date, contact_method, summary, outcome, next_action_date, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [leadId, date, method, text.trim(), outcome, nextDate, createdBy]
    );

    const fup = res.rows[0];

    // Transition lead from 'new' to 'contacted' automatically
    if (leadRes.rows[0].status === 'new') {
      await query(
        `UPDATE leads SET status = 'contacted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [leadId]
      );
    }

    return {
      id: fup.id,
      leadId: fup.lead_id,
      lead_id: fup.lead_id,
      followupDate: fup.followup_date,
      followup_date: fup.followup_date,
      contactMethod: fup.contact_method,
      contact_method: fup.contact_method,
      summary: fup.summary,
      outcome: fup.outcome,
      nextActionDate: fup.next_action_date,
      next_action_date: fup.next_action_date,
      createdBy: fup.created_by,
      createdAt: fup.created_at
    };
  }

  /**
   * Retrieve followups for a specific lead
   */
  async getFollowups(leadId) {
    const leadRes = await query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rowCount === 0) {
      const error = new Error(`Enquiry Lead '${leadId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    const res = await query(
      `SELECT f.id, f.lead_id, f.followup_date, f.contact_method, f.summary,
              f.outcome, f.next_action_date, f.created_by, f.created_at,
              u.first_name, u.last_name
       FROM lead_followups f
       LEFT JOIN users u ON u.id = f.created_by
       WHERE f.lead_id = $1
       ORDER BY f.followup_date DESC`,
      [leadId]
    );

    return res.rows.map(f => ({
      id: f.id,
      leadId: f.lead_id,
      lead_id: f.lead_id,
      followupDate: f.followup_date,
      followup_date: f.followup_date,
      contactMethod: f.contact_method,
      contact_method: f.contact_method,
      summary: f.summary,
      outcome: f.outcome,
      nextActionDate: f.next_action_date,
      next_action_date: f.next_action_date,
      createdBy: f.created_by,
      creatorName: f.first_name ? `${f.first_name} ${f.last_name}` : null,
      createdAt: f.created_at
    }));
  }

  /**
   * Create quotation for a lead
   */
  async createQuotation(leadId, {
    title,
    planId = null,
    plan_id = null,
    amount,
    discountAmount = 0.00,
    discount_amount = 0.00,
    validUntil,
    valid_until = null,
    terms = null
  }) {
    const leadRes = await query('SELECT id FROM leads WHERE id = $1', [leadId]);
    if (leadRes.rowCount === 0) {
      const error = new Error(`Enquiry Lead '${leadId}' not found`);
      error.statusCode = 404;
      error.code = 'LEAD_NOT_FOUND';
      throw error;
    }

    const rawAmount = parseFloat(amount);
    if (Number.isNaN(rawAmount) || rawAmount <= 0) {
      const error = new Error('Quote amount must be a positive number');
      error.statusCode = 422;
      error.code = 'VALIDATION_FAILED';
      throw error;
    }

    const validDate = valid_until || validUntil;
    const discount = parseFloat(discount_amount || discountAmount || 0);
    const plan = plan_id || planId || null;
    const termsText = terms ? terms.trim() : 'Includes standard club court reservation rights and welcome gear bundle.';

    const quotationNumber = `QT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const res = await query(
      `INSERT INTO quotations (
          quotation_number, lead_id, title, plan_id, amount, discount_amount, valid_until, status, terms
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'sent', $8)
       RETURNING *`,
      [quotationNumber, leadId, title.trim(), plan, rawAmount, discount, validDate, termsText]
    );

    const q = res.rows[0];

    // Automatically update lead status to 'quoted'
    await query(
      `UPDATE leads SET status = 'quoted', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [leadId]
    );

    return {
      id: q.id,
      quotationNumber: q.quotation_number,
      quotation_number: q.quotation_number,
      leadId: q.lead_id,
      lead_id: q.lead_id,
      title: q.title,
      planId: q.plan_id,
      plan_id: q.plan_id,
      amount: parseFloat(q.amount),
      discountAmount: parseFloat(q.discount_amount),
      discount_amount: parseFloat(q.discount_amount),
      validUntil: q.valid_until,
      valid_until: q.valid_until,
      status: q.status,
      terms: q.terms,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    };
  }

  /**
   * Book a trial session for a lead with court conflict protection
   */
  async createTrial(leadId, {
    courtId,
    court_id = null,
    scheduledTime,
    scheduled_time = null,
    durationMinutes = 60,
    duration_minutes = 60,
    coachUserId = null,
    coach_user_id = null,
    feedback = null
  }) {
    return withTransaction(async (client) => {
      const effectiveCourtId = court_id || courtId;
      const effectiveTime = scheduled_time || scheduledTime;
      const duration = parseInt(duration_minutes || durationMinutes || 60, 10);
      const coach = coach_user_id || coachUserId || null;

      // 1. Verify lead exists
      const leadRes = await client.query('SELECT id, name, email, phone FROM leads WHERE id = $1', [leadId]);
      if (leadRes.rowCount === 0) {
        const error = new Error(`Enquiry Lead '${leadId}' not found`);
        error.statusCode = 404;
        error.code = 'LEAD_NOT_FOUND';
        throw error;
      }
      const lead = leadRes.rows[0];

      // 2. Verify court exists
      const courtRes = await client.query('SELECT * FROM courts WHERE id = $1 AND is_active = true', [effectiveCourtId]);
      if (courtRes.rowCount === 0) {
        const error = new Error(`Court '${effectiveCourtId}' not found or inactive`);
        error.statusCode = 404;
        error.code = 'COURT_NOT_FOUND';
        throw error;
      }
      const court = courtRes.rows[0];

      // 3. Calculate slot range
      const start = new Date(effectiveTime);
      if (Number.isNaN(start.getTime())) {
        const error = new Error('Invalid scheduledTime format');
        error.statusCode = 400;
        throw error;
      }
      const end = new Date(start.getTime() + duration * 60 * 1000);

      // 4. Overlap & Conflict Protection against existing bookings
      const conflictRes = await client.query(
        `SELECT id, booking_type FROM bookings
         WHERE court_id = $1
           AND status NOT IN ('cancelled', 'no_show')
           AND tstzrange(start_time, end_time) && tstzrange($2::timestamptz, $3::timestamptz)
         LIMIT 1`,
        [effectiveCourtId, start.toISOString(), end.toISOString()]
      );

      if (conflictRes.rowCount > 0) {
        const error = new Error('The requested court slot is already booked and conflicts with an existing booking or trial session');
        error.statusCode = 409;
        error.code = 'COURT_SLOT_UNAVAILABLE';
        throw error;
      }

      // 5. Overlap Protection against existing scheduled trial bookings
      const trialConflictRes = await client.query(
        `SELECT id FROM trial_bookings
         WHERE court_id = $1
           AND status = 'scheduled'
           AND tstzrange(scheduled_time, scheduled_time + (duration_minutes || ' minutes')::interval) && tstzrange($2::timestamptz, $3::timestamptz)
         LIMIT 1`,
        [effectiveCourtId, start.toISOString(), end.toISOString()]
      );

      if (trialConflictRes.rowCount > 0) {
        const error = new Error('The requested court slot is already booked and conflicts with an existing trial booking');
        error.statusCode = 409;
        error.code = 'COURT_SLOT_UNAVAILABLE';
        throw error;
      }

      // 6. Insert trial booking record
      const trialRes = await client.query(
        `INSERT INTO trial_bookings (
            lead_id, court_id, scheduled_time, duration_minutes, coach_user_id, status, feedback
         )
         VALUES ($1, $2, $3, $4, $5, 'scheduled', $6)
         RETURNING *`,
        [leadId, effectiveCourtId, start.toISOString(), duration, coach, feedback]
      );
      const trial = trialRes.rows[0];

      // 7. Insert shadow booking in bookings table to block the slot on the court availability grid
      const bookingNumber = `TR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const bookingDate = start.toISOString().split('T')[0];

      await client.query(
        `INSERT INTO bookings (
            booking_number, court_id, guest_name, guest_email, guest_phone,
            booking_date, start_time, end_time, booking_type, status,
            rate_applied, total_amount, payment_status, notes
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'trial', 'confirmed', 0.00, 0.00, 'waived', $9)`,
        [
          bookingNumber,
          effectiveCourtId,
          lead.name,
          lead.email,
          lead.phone,
          bookingDate,
          start.toISOString(),
          end.toISOString(),
          `Complimentary trial session for ${lead.name}`
        ]
      );

      // 8. Update lead status to 'trial_booked'
      await client.query(
        `UPDATE leads SET status = 'trial_booked', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [leadId]
      );

      return {
        id: trial.id,
        leadId: trial.lead_id,
        lead_id: trial.lead_id,
        courtId: trial.court_id,
        court_id: trial.court_id,
        courtName: court.name,
        scheduledTime: trial.scheduled_time,
        scheduled_time: trial.scheduled_time,
        durationMinutes: trial.duration_minutes,
        duration_minutes: trial.duration_minutes,
        coachUserId: trial.coach_user_id,
        coach_user_id: trial.coach_user_id,
        status: trial.status,
        feedback: trial.feedback,
        createdAt: trial.created_at,
        updatedAt: trial.updated_at
      };
    });
  }
}

module.exports = new CrmService();
