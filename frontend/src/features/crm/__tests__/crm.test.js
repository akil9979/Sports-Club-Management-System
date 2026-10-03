import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  getLeads,
  getLeadById,
  updateLead,
  getLeadFollowups,
  createLeadFollowup,
  createLeadQuotation,
  createLeadTrial,
  resetInMemoryCrmState,
  LEAD_STATUSES,
  CONTACT_METHODS,
  SEED_LEADS
} from '../crmApi.js';

describe('Member 2 - CRM & Enquiry Management Test Suite', () => {

  beforeEach(() => {
    resetInMemoryCrmState();
  });

  // 1. Lead List Retrieval & Schema Conformance
  test('getLeads retrieves all leads with canonical fields and data types', async () => {
    const leads = await getLeads();
    assert.ok(Array.isArray(leads), 'Leads must be returned as an array');
    assert.ok(leads.length >= 4, 'Should contain all initial seed leads');

    const lead = leads[0];
    assert.ok(lead.id, 'Lead must have an id');
    assert.ok(lead.name, 'Lead must have a full name');
    assert.ok(lead.email, 'Lead must have an email');
    assert.ok(lead.phone, 'Lead must have a phone number');
    assert.ok(lead.sport, 'Lead must specify a sport interest');
    assert.ok(lead.status, 'Lead must have a canonical status');
    assert.ok(
      LEAD_STATUSES.some(s => s.value === lead.status),
      `Status '${lead.status}' must be a canonical backend status`
    );
  });

  // 2. Lead Filtering by Status, Sport, and Keyword Search
  test('getLeads accurately filters by status, sport, and search keyword', async () => {
    // Filter by status 'new'
    const newLeads = await getLeads({ status: 'new' });
    assert.ok(newLeads.length > 0, 'Should find new leads');
    newLeads.forEach(l => assert.equal(l.status, 'new'));

    // Filter by status 'quoted'
    const quotedLeads = await getLeads({ status: 'quoted' });
    assert.ok(quotedLeads.length > 0, 'Should find quoted leads');
    quotedLeads.forEach(l => assert.equal(l.status, 'quoted'));

    // Filter by sport 'Tennis'
    const tennisLeads = await getLeads({ sport: 'Tennis' });
    assert.ok(tennisLeads.length > 0, 'Should find tennis leads');
    tennisLeads.forEach(l => assert.equal(l.sport.toLowerCase(), 'tennis'));

    // Search by name / keyword 'Rohan'
    const rohanSearch = await getLeads({ search: 'Rohan' });
    assert.equal(rohanSearch.length, 1);
    assert.equal(rohanSearch[0].id, 'LEAD-101');
    assert.equal(rohanSearch[0].name, 'Rohan Mehta');

    // Search by phone
    const phoneSearch = await getLeads({ search: '9811223344' });
    assert.equal(phoneSearch.length, 1);
    assert.equal(phoneSearch[0].id, 'LEAD-102');
  });

  // 3. Lead Detail Retrieval & Sub-Resource Nesting
  test('getLeadById returns complete enquiry record with followups, quotations and trials', async () => {
    const lead = await getLeadById('LEAD-101');
    assert.ok(lead, 'Lead record must exist');
    assert.equal(lead.id, 'LEAD-101');
    assert.equal(lead.name, 'Rohan Mehta');
    assert.ok(Array.isArray(lead.followups), 'Must include followups array');
    assert.ok(Array.isArray(lead.quotations), 'Must include quotations array');
    assert.ok(Array.isArray(lead.trials), 'Must include trials array');

    // Check trial sub-resource on LEAD-101
    assert.ok(lead.trials.length > 0, 'LEAD-101 should have scheduled trial');
    assert.equal(lead.trials[0].courtId, 'court-1');
  });

  // 4. Edge Case: Lead Not Found Handling
  test('getLeadById throws 404 error when lead ID does not exist', async () => {
    await assert.rejects(
      async () => {
        await getLeadById('NON-EXISTENT-LEAD-999');
      },
      (err) => {
        assert.equal(err.status || err.statusCode, 404);
        assert.ok(err.message.includes('not found'));
        return true;
      }
    );
  });

  // 5. Updating Lead Status & Contact Information
  test('updateLead modifies fields and timestamps', async () => {
    const updated = await updateLead('LEAD-103', {
      name: 'Vikramaditya Roy Senior',
      phone: '+919988776655',
      status: 'contacted'
    });

    assert.equal(updated.name, 'Vikramaditya Roy Senior');
    assert.equal(updated.phone, '+919988776655');
    assert.equal(updated.status, 'contacted');

    // Verify persistence in subsequent fetch
    const fetched = await getLeadById('LEAD-103');
    assert.equal(fetched.name, 'Vikramaditya Roy Senior');
    assert.equal(fetched.status, 'contacted');
  });

  // 6. Validation: Reject Invalid Updates
  test('updateLead rejects empty name, invalid email, or invented status values', async () => {
    // Empty name
    await assert.rejects(
      async () => {
        await updateLead('LEAD-101', { name: '   ' });
      },
      (err) => err.status === 422 && err.message.includes('full name')
    );

    // Invalid email format
    await assert.rejects(
      async () => {
        await updateLead('LEAD-101', { email: 'not-an-email' });
      },
      (err) => err.status === 422 && err.message.includes('Valid email')
    );

    // Invented status
    await assert.rejects(
      async () => {
        await updateLead('LEAD-101', { status: 'arbitrary_invented_status' });
      },
      (err) => err.status === 422 && err.message.includes('canonical values')
    );
  });

  // 7. Logging Follow-ups & Automatic State Transitions
  test('createLeadFollowup records note and transitions new lead to contacted', async () => {
    // LEAD-103 starts as 'new'
    const initial = await getLeadById('LEAD-103');
    assert.equal(initial.status, 'new');

    const followup = await createLeadFollowup('LEAD-103', {
      contactMethod: 'whatsapp',
      summary: 'Sent official club brochure and membership rate card.',
      outcome: 'Client interested in evening padel coaching.',
      nextActionDate: '2026-10-10'
    });

    assert.ok(followup.id, 'Followup should have a generated ID');
    assert.equal(followup.leadId, 'LEAD-103');
    assert.equal(followup.contactMethod, 'whatsapp');
    assert.equal(followup.summary, 'Sent official club brochure and membership rate card.');

    // Lead should now be automatically updated to 'contacted'
    const updatedLead = await getLeadById('LEAD-103');
    assert.equal(updatedLead.status, 'contacted');

    // Followups list check
    const list = await getLeadFollowups('LEAD-103');
    assert.ok(list.some(f => f.id === followup.id));
  });

  // 8. Follow-up Validation Rules
  test('createLeadFollowup enforces required summary and valid contact method', async () => {
    // Empty summary
    await assert.rejects(
      async () => {
        await createLeadFollowup('LEAD-101', { contactMethod: 'phone', summary: '' });
      },
      (err) => err.status === 422 && err.message.includes('summary note is required')
    );

    // Invalid contact method
    await assert.rejects(
      async () => {
        await createLeadFollowup('LEAD-101', { contactMethod: 'carrier_pigeon', summary: 'Sent note' });
      },
      (err) => err.status === 422 && err.message.includes('Invalid contact method')
    );
  });

  // 9. Creating Membership Quotations & Positive Amount Enforcements
  test('createLeadQuotation creates quotation record and updates lead to quoted status', async () => {
    const quote = await createLeadQuotation('LEAD-102', {
      title: 'Silver Standard Corporate Box Cricket Package',
      planId: 'silver',
      amount: 26870,
      discountAmount: 2000,
      validUntil: '2026-10-30',
      terms: 'Includes 10% bar discount and guaranteed Saturday floodlight slot.'
    });

    assert.ok(quote.id, 'Quotation must have an ID');
    assert.ok(quote.quotationNumber.startsWith('QT-'), 'Quotation number must match QT format');
    assert.equal(quote.leadId, 'LEAD-102');
    assert.equal(quote.amount, 26870);
    assert.equal(quote.discountAmount, 2000);
    assert.equal(quote.status, 'sent');

    // Lead status must now be 'quoted'
    const lead = await getLeadById('LEAD-102');
    assert.equal(lead.status, 'quoted');
  });

  // 10. Quotation Validation Rules
  test('createLeadQuotation strictly rejects non-positive amounts and missing validUntil dates', async () => {
    // Zero amount
    await assert.rejects(
      async () => {
        await createLeadQuotation('LEAD-101', {
          title: 'Zero cost quote',
          amount: 0,
          validUntil: '2026-10-30'
        });
      },
      (err) => err.status === 422 && err.message.includes('positive number')
    );

    // Negative amount
    await assert.rejects(
      async () => {
        await createLeadQuotation('LEAD-101', {
          title: 'Negative quote',
          amount: -500,
          validUntil: '2026-10-30'
        });
      },
      (err) => err.status === 422 && err.message.includes('positive number')
    );

    // Missing validUntil
    await assert.rejects(
      async () => {
        await createLeadQuotation('LEAD-101', {
          title: 'Valid title',
          amount: 5000
        });
      },
      (err) => err.status === 422 && err.message.includes('expiration date')
    );
  });

  // 11. Creating Court Trial Bookings & Validation
  test('createLeadTrial schedules trial and updates lead to trial_booked status', async () => {
    const trial = await createLeadTrial('LEAD-103', {
      courtId: 'court-5',
      scheduledTime: '2026-10-08T18:00:00.000Z',
      durationMinutes: 60,
      feedback: 'Introductory padel trial evaluation with Head Coach.'
    });

    assert.ok(trial.id, 'Trial must have an ID');
    assert.equal(trial.leadId, 'LEAD-103');
    assert.equal(trial.courtId, 'court-5');
    assert.equal(trial.durationMinutes, 60);
    assert.equal(trial.status, 'scheduled');

    // Lead status must transition to 'trial_booked'
    const lead = await getLeadById('LEAD-103');
    assert.equal(lead.status, 'trial_booked');
  });

  // 12. Trial Booking Validation Rules
  test('createLeadTrial rejects missing courtId or missing scheduledTime', async () => {
    await assert.rejects(
      async () => {
        await createLeadTrial('LEAD-101', { scheduledTime: '2026-10-08T18:00:00.000Z' });
      },
      (err) => err.status === 422 && err.message.includes('Selected court is required')
    );

    await assert.rejects(
      async () => {
        await createLeadTrial('LEAD-101', { courtId: 'court-1' });
      },
      (err) => err.status === 422 && err.message.includes('Scheduled time is required')
    );
  });

  // 13. Full End-to-End Enquiry Conversion Journey
  test('Full CRM Pipeline Lifecycle: Enquiry -> Follow-up -> Trial -> Quotation -> Conversion', async () => {
    // 1. Initial State: Enquiry is 'new'
    const lead = await getLeadById('LEAD-103');
    assert.equal(lead.status, 'new');

    // 2. Staff logs first phone call follow-up
    await createLeadFollowup('LEAD-103', {
      contactMethod: 'phone',
      summary: 'Called prospect. Discussed Gold membership privileges and morning court access.',
      outcome: 'Prospect agreed to attend complimentary trial session.',
      nextActionDate: '2026-10-06'
    });
    const afterCall = await getLeadById('LEAD-103');
    assert.equal(afterCall.status, 'contacted');

    // 3. Staff books court trial session
    await createLeadTrial('LEAD-103', {
      courtId: 'court-1',
      scheduledTime: '2026-10-06T09:00:00.000Z',
      durationMinutes: 60,
      feedback: 'Coaching staff assigned for 9:00 AM session.'
    });
    const afterTrial = await getLeadById('LEAD-103');
    assert.equal(afterTrial.status, 'trial_booked');

    // 4. Staff dispatches customized membership quotation
    await createLeadQuotation('LEAD-103', {
      title: 'Gold Championship Annual Membership Quote',
      planId: 'gold',
      amount: 47990,
      discountAmount: 3000,
      validUntil: '2026-10-20',
      terms: 'Early bird sign-up includes 1 month free locker and VIP lounge pass.'
    });
    const afterQuote = await getLeadById('LEAD-103');
    assert.equal(afterQuote.status, 'quoted');

    // 5. Staff converts lead to full registered club member
    const convertedLead = await updateLead('LEAD-103', { status: 'converted' });
    assert.equal(convertedLead.status, 'converted');

    // 6. Final verification of lead inspection record
    const finalInspection = await getLeadById('LEAD-103');
    assert.equal(finalInspection.status, 'converted');
    assert.equal(finalInspection.followups.length, 1);
    assert.equal(finalInspection.trials.length, 1);
    assert.equal(finalInspection.quotations.length, 1);
  });

});
