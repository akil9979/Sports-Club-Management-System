/**
 * Champions Club - Management Reporting & Analytics Service
 * Role: MEMBER 4 (Backend Operations - Financial & Operational Reporting)
 */

const { query } = require('../../config/database');

/**
 * Generates SQL WHERE clause timestamp/date filter based on selected period
 * @param {'today'|'week'|'month'} period
 * @param {string} column
 */
function getPeriodFilter(period = 'today', column = 'created_at') {
  if (period === 'today') {
    return `${column} >= CURRENT_DATE`;
  } else if (period === 'week') {
    return `${column} >= CURRENT_DATE - INTERVAL '7 days'`;
  } else if (period === 'month') {
    return `${column} >= CURRENT_DATE - INTERVAL '30 days'`;
  }
  return `${column} >= CURRENT_DATE`;
}

function roundToTwo(val) {
  return Math.round((Number(val) || 0) * 100) / 100;
}

class ReportService {
  /**
   * GET /api/dashboard/summary?period=today|week|month
   * Real database aggregations for executive management dashboard
   */
  async getDashboardSummary(period = 'today') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'today';

    // 1. Fetch Revenue by Source
    const [courtRevRes, shopRevRes, barRevRes, memRevRes, directPaymentsRes, expensesRes, duesRes, opRes] = await Promise.all([
      // Courts revenue
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COUNT(id) AS count,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_count
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),

      // Shop revenue
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COUNT(id) AS count,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_count
        FROM shop_orders
        WHERE status NOT IN ('cancelled', 'refunded')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),

      // Bar revenue
      query(`
        SELECT 
          COALESCE(SUM(total), 0) AS total,
          COUNT(id) AS count,
          COUNT(CASE WHEN status = 'settled' THEN 1 END) AS settled_count
        FROM bar_orders
        WHERE status NOT IN ('cancelled', 'voided')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),

      // Membership subscription revenue
      query(`
        SELECT 
          COALESCE(SUM(mp.price), 0) AS total,
          COUNT(ms.id) AS count
        FROM memberships ms
        JOIN membership_plans mp ON mp.id = ms.plan_id
        WHERE ms.status = 'active'
          AND ${getPeriodFilter(periodNormalized, 'ms.created_at')}
      `),

      // Direct completed payments
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM payments
        WHERE status = 'completed'
          AND ${getPeriodFilter(periodNormalized, 'paid_at')}
      `),

      // Total expenses
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM expenses
        WHERE ${getPeriodFilter(periodNormalized, 'expense_date')}
      `),

      // Outstanding Dues / Receivables
      query(`
        SELECT 
          (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE status IN ('unpaid', 'partially_paid', 'overdue')) AS invoice_dues,
          (SELECT COALESCE(SUM(total), 0) FROM bar_orders WHERE status = 'open') AS open_bar_tabs,
          (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'unpaid' AND status NOT IN ('cancelled', 'no_show')) AS unpaid_bookings
      `),

      // Operational volume metrics
      query(`
        SELECT 
          (SELECT COUNT(*) FROM members WHERE status = 'active') AS active_members,
          (SELECT COUNT(*) FROM bookings WHERE status NOT IN ('cancelled', 'no_show') AND ${getPeriodFilter(periodNormalized, 'created_at')}) AS total_bookings,
          (SELECT COUNT(*) FROM shop_orders WHERE status NOT IN ('cancelled') AND ${getPeriodFilter(periodNormalized, 'created_at')}) AS total_shop_orders,
          (SELECT COUNT(*) FROM bar_orders WHERE status NOT IN ('cancelled', 'voided') AND ${getPeriodFilter(periodNormalized, 'created_at')}) AS total_bar_orders
      `)
    ]);

    // Payment methods breakdown
    const paymentMethodsRes = await query(`
      SELECT 
        payment_method,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(id) AS count
      FROM payments
      WHERE status = 'completed'
        AND ${getPeriodFilter(periodNormalized, 'paid_at')}
      GROUP BY payment_method
    `);

    const courtRevenue = parseFloat(courtRevRes.rows[0].total || 0);
    const shopRevenue = parseFloat(shopRevRes.rows[0].total || 0);
    const barRevenue = parseFloat(barRevRes.rows[0].total || 0);
    const membershipRevenue = parseFloat(memRevRes.rows[0].total || 0);
    const directPaymentsTotal = parseFloat(directPaymentsRes.rows[0].total || 0);

    // Operational revenue is the sum of operational source streams
    const calculatedGrossRevenue = courtRevenue + shopRevenue + barRevenue + membershipRevenue;
    // Total revenue is either the operational total or the direct payments total if operational is 0
    const totalRevenue = calculatedGrossRevenue > 0 ? calculatedGrossRevenue : directPaymentsTotal;

    const totalExpenses = parseFloat(expensesRes.rows[0].total || 0);
    const netIncome = totalRevenue - totalExpenses;

    const duesRow = duesRes.rows[0];
    const totalOutstandingDues = parseFloat(duesRow.invoice_dues || 0) + parseFloat(duesRow.open_bar_tabs || 0) + parseFloat(duesRow.unpaid_bookings || 0);

    const paymentMethodsMap = {
      upi: 0,
      card: 0,
      cash: 0,
      netbanking: 0,
      other: 0
    };

    for (const row of paymentMethodsRes.rows) {
      const method = (row.payment_method || '').toLowerCase();
      const amount = parseFloat(row.total || 0);
      if (['upi'].includes(method)) paymentMethodsMap.upi += amount;
      else if (['card'].includes(method)) paymentMethodsMap.card += amount;
      else if (['cash'].includes(method)) paymentMethodsMap.cash += amount;
      else if (['netbanking'].includes(method)) paymentMethodsMap.netbanking += amount;
      else paymentMethodsMap.other += amount;
    }

    const opRow = opRes.rows[0];

    return {
      period: periodNormalized,
      totalRevenue: roundToTwo(totalRevenue),
      totalExpenses: roundToTwo(totalExpenses),
      netIncome: roundToTwo(netIncome),
      profitMargin: totalRevenue > 0 ? roundToTwo((netIncome / totalRevenue) * 100) : 0,
      outstandingDues: roundToTwo(totalOutstandingDues),
      duesBreakdown: {
        invoices: roundToTwo(duesRow.invoice_dues || 0),
        openBarTabs: roundToTwo(duesRow.open_bar_tabs || 0),
        unpaidBookings: roundToTwo(duesRow.unpaid_bookings || 0)
      },
      revenueBySource: {
        courts: roundToTwo(courtRevenue),
        shop: roundToTwo(shopRevenue),
        bar: roundToTwo(barRevenue),
        memberships: roundToTwo(membershipRevenue)
      },
      revenueByPaymentMethod: {
        upi: roundToTwo(paymentMethodsMap.upi),
        card: roundToTwo(paymentMethodsMap.card),
        cash: roundToTwo(paymentMethodsMap.cash),
        netbanking: roundToTwo(paymentMethodsMap.netbanking),
        other: roundToTwo(paymentMethodsMap.other)
      },
      operationalMetrics: {
        activeMembers: parseInt(opRow.active_members || 0, 10),
        totalBookings: parseInt(opRow.total_bookings || 0, 10),
        totalShopOrders: parseInt(opRow.total_shop_orders || 0, 10),
        totalBarOrders: parseInt(opRow.total_bar_orders || 0, 10)
      }
    };
  }

  /**
   * GET /api/reports/revenue?period=today|week|month
   * Deep dive revenue breakdown by source, stream, and payment method
   */
  async getRevenueReport(period = 'today') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'today';

    const [courtRes, shopRes, barRes, memRes, expRes, paymentMethodsRes, trendRes] = await Promise.all([
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COUNT(id) AS total_count,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_count
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),
      query(`
        SELECT 
          COALESCE(SUM(total_amount), 0) AS total,
          COUNT(id) AS total_count,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) AS paid_count
        FROM shop_orders
        WHERE status NOT IN ('cancelled', 'refunded')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),
      query(`
        SELECT 
          COALESCE(SUM(total), 0) AS total,
          COUNT(id) AS total_count,
          COUNT(CASE WHEN status = 'settled' THEN 1 END) AS settled_count
        FROM bar_orders
        WHERE status NOT IN ('cancelled', 'voided')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),
      query(`
        SELECT 
          COALESCE(SUM(mp.price), 0) AS total,
          COUNT(ms.id) AS total_count
        FROM memberships ms
        JOIN membership_plans mp ON mp.id = ms.plan_id
        WHERE ms.status = 'active'
          AND ${getPeriodFilter(periodNormalized, 'ms.created_at')}
      `),
      query(`
        SELECT 
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS total_count
        FROM expenses
        WHERE ${getPeriodFilter(periodNormalized, 'expense_date')}
      `),
      query(`
        SELECT 
          payment_method,
          COALESCE(SUM(amount), 0) AS total,
          COUNT(id) AS count
        FROM payments
        WHERE status = 'completed'
          AND ${getPeriodFilter(periodNormalized, 'paid_at')}
        GROUP BY payment_method
        ORDER BY total DESC
      `),
      query(`
        SELECT 
          DATE(paid_at) AS transaction_date,
          COALESCE(SUM(amount), 0) AS daily_revenue,
          COUNT(id) AS transaction_count
        FROM payments
        WHERE status = 'completed'
          AND ${getPeriodFilter(periodNormalized, 'paid_at')}
        GROUP BY DATE(paid_at)
        ORDER BY transaction_date ASC
      `)
    ]);

    const courtTotal = parseFloat(courtRes.rows[0].total || 0);
    const shopTotal = parseFloat(shopRes.rows[0].total || 0);
    const barTotal = parseFloat(barRes.rows[0].total || 0);
    const memTotal = parseFloat(memRes.rows[0].total || 0);
    const totalExpenses = parseFloat(expRes.rows[0].total || 0);

    const grossRevenue = courtTotal + shopTotal + barTotal + memTotal;
    const netIncome = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? roundToTwo((netIncome / grossRevenue) * 100) : 0;

    const sources = [
      {
        source: 'courts',
        label: 'Court Bookings',
        amount: roundToTwo(courtTotal),
        transactions: parseInt(courtRes.rows[0].total_count || 0, 10),
        paidTransactions: parseInt(courtRes.rows[0].paid_count || 0, 10),
        percentage: grossRevenue > 0 ? roundToTwo((courtTotal / grossRevenue) * 100) : 0
      },
      {
        source: 'shop',
        label: 'Pro Shop Sales',
        amount: roundToTwo(shopTotal),
        transactions: parseInt(shopRes.rows[0].total_count || 0, 10),
        paidTransactions: parseInt(shopRes.rows[0].paid_count || 0, 10),
        percentage: grossRevenue > 0 ? roundToTwo((shopTotal / grossRevenue) * 100) : 0
      },
      {
        source: 'bar',
        label: 'Sports Bar & Lounge',
        amount: roundToTwo(barTotal),
        transactions: parseInt(barRes.rows[0].total_count || 0, 10),
        paidTransactions: parseInt(barRes.rows[0].settled_count || 0, 10),
        percentage: grossRevenue > 0 ? roundToTwo((barTotal / grossRevenue) * 100) : 0
      },
      {
        source: 'memberships',
        label: 'Membership Subscriptions',
        amount: roundToTwo(memTotal),
        transactions: parseInt(memRes.rows[0].total_count || 0, 10),
        paidTransactions: parseInt(memRes.rows[0].total_count || 0, 10),
        percentage: grossRevenue > 0 ? roundToTwo((memTotal / grossRevenue) * 100) : 0
      }
    ];

    const paymentMethods = paymentMethodsRes.rows.map(row => {
      const amount = parseFloat(row.total || 0);
      return {
        method: row.payment_method,
        amount: roundToTwo(amount),
        count: parseInt(row.count || 0, 10),
        percentage: grossRevenue > 0 ? roundToTwo((amount / grossRevenue) * 100) : 0
      };
    });

    const dailyTrend = trendRes.rows.map(row => ({
      date: row.transaction_date,
      revenue: roundToTwo(row.daily_revenue || 0),
      count: parseInt(row.transaction_count || 0, 10)
    }));

    return {
      period: periodNormalized,
      grossRevenue: roundToTwo(grossRevenue),
      totalExpenses: roundToTwo(totalExpenses),
      netIncome: roundToTwo(netIncome),
      profitMargin,
      sources,
      paymentMethods,
      dailyTrend
    };
  }

  /**
   * GET /api/reports/court-usage?period=today|week|month
   * Real database court utilization, peak hours, and sport performance metrics
   */
  async getCourtUsageReport(period = 'today') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'today';

    const [courtsCountRes, totalsRes, sportsRes, courtsRes, typesRes, hourlyRes] = await Promise.all([
      query(`SELECT COUNT(*) AS active_count FROM courts WHERE is_active = true`),
      query(`
        SELECT 
          COUNT(id) AS total_bookings,
          COALESCE(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600), 0) AS total_hours,
          COALESCE(SUM(total_amount), 0) AS total_revenue
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
      `),
      query(`
        SELECT 
          s.id, s.name,
          COUNT(b.id) AS booking_count,
          COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600), 0) AS total_hours,
          COALESCE(SUM(b.total_amount), 0) AS total_revenue
        FROM sports s
        LEFT JOIN courts c ON c.sport_id = s.id
        LEFT JOIN bookings b ON b.court_id = c.id 
          AND b.status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'b.created_at')}
        GROUP BY s.id, s.name
        ORDER BY total_hours DESC
      `),
      query(`
        SELECT 
          c.id, c.name, s.name AS sport_name,
          COUNT(b.id) AS booking_count,
          COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time))/3600), 0) AS total_hours,
          COALESCE(SUM(b.total_amount), 0) AS total_revenue
        FROM courts c
        JOIN sports s ON s.id = c.sport_id
        LEFT JOIN bookings b ON b.court_id = c.id 
          AND b.status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'b.created_at')}
        GROUP BY c.id, c.name, s.name
        ORDER BY booking_count DESC, total_revenue DESC
      `),
      query(`
        SELECT 
          booking_type,
          COUNT(id) AS count,
          COALESCE(SUM(total_amount), 0) AS revenue
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
        GROUP BY booking_type
        ORDER BY count DESC
      `),
      query(`
        SELECT 
          EXTRACT(HOUR FROM start_time) AS hour_of_day,
          COUNT(id) AS bookings_count
        FROM bookings
        WHERE status NOT IN ('cancelled', 'no_show')
          AND ${getPeriodFilter(periodNormalized, 'created_at')}
        GROUP BY EXTRACT(HOUR FROM start_time)
        ORDER BY hour_of_day ASC
      `)
    ]);

    const activeCourts = parseInt(courtsCountRes.rows[0].active_count || 0, 10);
    const totalBookings = parseInt(totalsRes.rows[0].total_bookings || 0, 10);
    const totalHoursBooked = parseFloat(totalsRes.rows[0].total_hours || 0);
    const totalRevenue = parseFloat(totalsRes.rows[0].total_revenue || 0);

    // 14 operating hours per day per court
    const daysInPeriod = periodNormalized === 'today' ? 1 : periodNormalized === 'week' ? 7 : 30;
    const maxCapacityHours = activeCourts * 14 * daysInPeriod;
    const overallUtilizationRate = maxCapacityHours > 0 ? roundToTwo((totalHoursBooked / maxCapacityHours) * 100) : 0;

    const bySport = sportsRes.rows.map(row => ({
      sportId: row.id,
      name: row.name,
      bookings: parseInt(row.booking_count || 0, 10),
      hours: roundToTwo(row.total_hours || 0),
      revenue: roundToTwo(row.total_revenue || 0)
    }));

    const byCourt = courtsRes.rows.map(row => ({
      courtId: row.id,
      name: row.name,
      sportName: row.sport_name,
      bookings: parseInt(row.booking_count || 0, 10),
      hours: roundToTwo(row.total_hours || 0),
      revenue: roundToTwo(row.total_revenue || 0)
    }));

    const byBookingType = typesRes.rows.map(row => ({
      type: row.booking_type,
      count: parseInt(row.count || 0, 10),
      revenue: roundToTwo(row.revenue || 0),
      percentage: totalBookings > 0 ? roundToTwo((parseInt(row.count || 0, 10) / totalBookings) * 100) : 0
    }));

    const peakHours = hourlyRes.rows.map(row => ({
      hour: parseInt(row.hour_of_day, 10),
      label: `${String(row.hour_of_day).padStart(2, '0')}:00`,
      bookings: parseInt(row.bookings_count || 0, 10)
    }));

    return {
      period: periodNormalized,
      activeCourts,
      totalBookings,
      totalHoursBooked: roundToTwo(totalHoursBooked),
      totalRevenue: roundToTwo(totalRevenue),
      overallUtilizationRate,
      bySport,
      byCourt,
      byBookingType,
      peakHours
    };
  }

  /**
   * GET /api/reports/memberships?period=today|week|month
   * Membership subscriber base, plan breakdown, and recurring revenue
   */
  async getMembershipsReport(period = 'today') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'today';

    const [membersCountRes, activeMembershipsRes, planDistRes, newSubsRes, expiringRes] = await Promise.all([
      query(`
        SELECT 
          COUNT(*) AS total_members,
          COUNT(CASE WHEN status = 'active' THEN 1 END) AS active_members,
          COUNT(CASE WHEN status != 'active' THEN 1 END) AS inactive_members
        FROM members
      `),
      query(`
        SELECT 
          COUNT(*) AS active_subscriptions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) AS expired_subscriptions,
          COUNT(CASE WHEN status = 'pending_renewal' THEN 1 END) AS pending_renewal_subscriptions
        FROM memberships
      `),
      query(`
        SELECT 
          mp.id AS plan_id,
          mp.name AS plan_name,
          mp.tier,
          mp.price,
          mp.annual_price,
          COUNT(ms.id) AS active_count,
          COALESCE(SUM(mp.price), 0) AS total_mrr
        FROM membership_plans mp
        LEFT JOIN memberships ms ON ms.plan_id = mp.id AND ms.status = 'active'
        GROUP BY mp.id, mp.name, mp.tier, mp.price, mp.annual_price
        ORDER BY active_count DESC, mp.price DESC
      `),
      query(`
        SELECT 
          COUNT(ms.id) AS new_memberships_count,
          COALESCE(SUM(mp.price), 0) AS new_revenue
        FROM memberships ms
        JOIN membership_plans mp ON mp.id = ms.plan_id
        WHERE ms.status = 'active'
          AND ${getPeriodFilter(periodNormalized, 'ms.created_at')}
      `),
      query(`
        SELECT COUNT(*) AS expiring_soon_count
        FROM memberships
        WHERE status = 'active'
          AND end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days')
      `)
    ]);

    const memberCounts = membersCountRes.rows[0];
    const subCounts = activeMembershipsRes.rows[0];
    const newSubs = newSubsRes.rows[0];
    const expiringSoon = parseInt(expiringRes.rows[0].expiring_soon_count || 0, 10);

    let totalMRR = 0;
    const planDistribution = planDistRes.rows.map(row => {
      const mrr = parseFloat(row.total_mrr || 0);
      totalMRR += mrr;
      return {
        planId: row.plan_id,
        planName: row.plan_name,
        tier: row.tier,
        price: parseFloat(row.price || 0),
        activeCount: parseInt(row.active_count || 0, 10),
        totalMRR: roundToTwo(mrr)
      };
    });

    return {
      period: periodNormalized,
      totalRegisteredMembers: parseInt(memberCounts.total_members || 0, 10),
      activeMembers: parseInt(memberCounts.active_members || 0, 10),
      inactiveMembers: parseInt(memberCounts.inactive_members || 0, 10),
      activeSubscriptions: parseInt(subCounts.active_subscriptions || 0, 10),
      newMembershipsInPeriod: parseInt(newSubs.new_memberships_count || 0, 10),
      newMembershipRevenue: roundToTwo(newSubs.new_revenue || 0),
      expiringInNext30Days: expiringSoon,
      totalMonthlyRecurringRevenue: roundToTwo(totalMRR),
      planDistribution
    };
  }

  /**
   * GET /api/reports/sales?period=today|week|month
   * Real database reporting for Pro Shop & Sports Bar commercial sales
   */
  async getSalesReport(period = 'today') {
    const periodNormalized = ['today', 'week', 'month'].includes(period) ? period : 'today';

    const [shopTotalsRes, shopTopRes, shopCatRes, barTotalsRes, barTopRes, barCatRes] = await Promise.all([
      // Shop Totals
      query(`
        SELECT 
          COUNT(DISTINCT so.id) AS total_orders,
          COALESCE(SUM(soi.quantity), 0) AS total_items_sold,
          COALESCE(SUM(so.total_amount), 0) AS total_revenue
        FROM shop_orders so
        LEFT JOIN shop_order_items soi ON soi.shop_order_id = so.id
        WHERE so.status NOT IN ('cancelled', 'refunded')
          AND ${getPeriodFilter(periodNormalized, 'so.created_at')}
      `),
      // Shop Top Products
      query(`
        SELECT 
          p.id AS product_id,
          p.name AS product_name,
          pc.name AS category_name,
          COALESCE(SUM(soi.quantity), 0) AS units_sold,
          COALESCE(SUM(soi.total_price), 0) AS revenue
        FROM products p
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        JOIN shop_order_items soi ON soi.product_id = p.id
        JOIN shop_orders so ON so.id = soi.shop_order_id
        WHERE so.status NOT IN ('cancelled', 'refunded')
          AND ${getPeriodFilter(periodNormalized, 'so.created_at')}
        GROUP BY p.id, p.name, pc.name
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 10
      `),
      // Shop Category Breakdown
      query(`
        SELECT 
          COALESCE(pc.name, 'Uncategorized') AS category,
          COALESCE(SUM(soi.quantity), 0) AS units_sold,
          COALESCE(SUM(soi.total_price), 0) AS revenue
        FROM shop_orders so
        JOIN shop_order_items soi ON soi.shop_order_id = so.id
        JOIN products p ON p.id = soi.product_id
        LEFT JOIN product_categories pc ON pc.id = p.category_id
        WHERE so.status NOT IN ('cancelled', 'refunded')
          AND ${getPeriodFilter(periodNormalized, 'so.created_at')}
        GROUP BY pc.name
        ORDER BY revenue DESC
      `),
      // Bar Totals
      query(`
        SELECT 
          COUNT(DISTINCT bo.id) AS total_orders,
          COALESCE(SUM(boi.quantity), 0) AS total_items_sold,
          COALESCE(SUM(bo.total), 0) AS total_revenue
        FROM bar_orders bo
        LEFT JOIN bar_order_items boi ON boi.bar_order_id = bo.id
        WHERE bo.status NOT IN ('cancelled', 'voided')
          AND ${getPeriodFilter(periodNormalized, 'bo.created_at')}
      `),
      // Bar Top Menu Items
      query(`
        SELECT 
          mi.id AS item_id,
          mi.name AS item_name,
          mi.category,
          COALESCE(SUM(boi.quantity), 0) AS units_sold,
          COALESCE(SUM(boi.quantity * boi.unit_price), 0) AS revenue
        FROM menu_items mi
        JOIN bar_order_items boi ON boi.item_id = mi.id
        JOIN bar_orders bo ON bo.id = boi.bar_order_id
        WHERE bo.status = 'settled'
          AND ${getPeriodFilter(periodNormalized, 'bo.created_at')}
        GROUP BY mi.id, mi.name, mi.category
        ORDER BY units_sold DESC, revenue DESC
        LIMIT 10
      `),
      // Bar Category Breakdown
      query(`
        SELECT 
          mi.category,
          COALESCE(SUM(boi.quantity), 0) AS units_sold,
          COALESCE(SUM(boi.quantity * boi.unit_price), 0) AS revenue
        FROM bar_orders bo
        JOIN bar_order_items boi ON boi.bar_order_id = bo.id
        JOIN menu_items mi ON mi.id = boi.item_id
        WHERE bo.status = 'settled'
          AND ${getPeriodFilter(periodNormalized, 'bo.created_at')}
        GROUP BY mi.category
        ORDER BY revenue DESC
      `)
    ]);

    const shopRow = shopTotalsRes.rows[0];
    const shopOrders = parseInt(shopRow.total_orders || 0, 10);
    const shopRevenue = parseFloat(shopRow.total_revenue || 0);
    const shopItems = parseInt(shopRow.total_items_sold || 0, 10);
    const shopAOV = shopOrders > 0 ? roundToTwo(shopRevenue / shopOrders) : 0;

    const barRow = barTotalsRes.rows[0];
    const barOrders = parseInt(barRow.total_orders || 0, 10);
    const barRevenue = parseFloat(barRow.total_revenue || 0);
    const barItems = parseInt(barRow.total_items_sold || 0, 10);
    const barAOV = barOrders > 0 ? roundToTwo(barRevenue / barOrders) : 0;

    const totalSalesRevenue = shopRevenue + barRevenue;
    const totalOrders = shopOrders + barOrders;

    return {
      period: periodNormalized,
      totalSalesRevenue: roundToTwo(totalSalesRevenue),
      totalOrders,
      shop: {
        totalOrders: shopOrders,
        totalItemsSold: shopItems,
        totalRevenue: roundToTwo(shopRevenue),
        averageOrderValue: shopAOV,
        topProducts: shopTopRes.rows.map(r => ({
          productId: r.product_id,
          productName: r.product_name,
          categoryName: r.category_name || 'General',
          unitsSold: parseInt(r.units_sold || 0, 10),
          revenue: roundToTwo(r.revenue || 0)
        })),
        byCategory: shopCatRes.rows.map(r => ({
          category: r.category,
          unitsSold: parseInt(r.units_sold || 0, 10),
          revenue: roundToTwo(r.revenue || 0)
        }))
      },
      bar: {
        totalOrders: barOrders,
        totalItemsSold: barItems,
        totalRevenue: roundToTwo(barRevenue),
        averageOrderValue: barAOV,
        topItems: barTopRes.rows.map(r => ({
          itemId: r.item_id,
          itemName: r.item_name,
          category: r.category,
          unitsSold: parseInt(r.units_sold || 0, 10),
          revenue: roundToTwo(r.revenue || 0)
        })),
        byCategory: barCatRes.rows.map(r => ({
          category: r.category,
          unitsSold: parseInt(r.units_sold || 0, 10),
          revenue: roundToTwo(r.revenue || 0)
        }))
      }
    };
  }
}

module.exports = new ReportService();
