// Reclamation Center – receives Anxiety Support landing page form submissions.
// Paste this into Wix: Dev Mode → Backend → http-functions.js
// Endpoint (after publishing the Wix site): https://www.reclamationcntr.com/_functions/lead
//
// Before this works, create a CMS collection named "AnxietyLeads" with these fields:
//   firstName (Text), phone (Text), email (Text),
//   preferredDate (Text), preferredDateISO (Text), preferredTime (Text),
//   message (Text), consent (Boolean), smsConsent (Boolean),
//   page (Text), utmSource (Text), utmCampaign (Text), submittedAt (Date and Time)
//
// Booking behavior:
//   - Each date + time can only be booked once. A second submission for the same
//     slot is rejected, and the landing page asks the visitor to pick another time.
//   - To FREE UP a slot (cancellation or spam), delete that row from AnxietyLeads —
//     the time becomes bookable again right away.
//   - The landing page also calls GET /_functions/slots to grey out taken times.
//     That endpoint only returns date/time pairs — never names, phones, or emails.
// Set the collection's permissions so that only admins can read it.

import { ok, badRequest, serverError, response } from 'wix-http-functions';
import wixData from 'wix-data';

// Websites allowed to send submissions. Update if your landing page address is different.
const ALLOWED_ORIGINS = [
  'https://care.reclamationcntr.com',
];

function corsHeaders(request) {
  const origin = (request.headers && (request.headers.origin || request.headers.Origin)) || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) || /\.github\.io$/.test(origin);
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}

function clean(value, max) {
  return String(value || '').replace(/[<>]/g, '').trim().slice(0, max);
}

// Browser "preflight" check before the POST
export function options_lead(request) {
  return response({ status: 204, headers: corsHeaders(request) });
}

// GET https://www.reclamationcntr.com/_functions/slots
// Returns which upcoming date + time slots are already taken, so the landing
// page can grey them out. Shares ONLY date/time pairs — no personal details.
export async function get_slots(request) {
  const headers = corsHeaders(request);
  try {
    // "Today" in Florida (Eastern) time, as yyyy-mm-dd
    const todayISO = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const res = await wixData.query('AnxietyLeads')
      .ge('preferredDateISO', todayISO)
      .limit(1000)
      .find({ suppressAuth: true });
    const slots = res.items
      .filter(i => i.preferredDateISO && i.preferredTime)
      .map(i => ({ d: i.preferredDateISO, t: i.preferredTime }));
    return ok({ headers, body: { ok: true, slots } });
  } catch (err) {
    console.error('Slots lookup error', err);
    return serverError({ headers, body: { ok: false } });
  }
}

export async function post_lead(request) {
  const headers = corsHeaders(request);
  try {
    const body = await request.body.json();

    // Spam trap: real visitors never fill in this hidden field
    if (body.website) {
      return ok({ headers, body: { ok: true } });
    }

    const lead = {
      firstName: clean(body.firstName, 80),
      phone: clean(body.phone, 30),
      email: clean(body.email, 120),
      preferredDate: clean(body.preferredDate, 60),
      preferredDateISO: clean(body.preferredDateISO, 10),
      preferredTime: clean(body.preferredTime, 20),
      message: clean(body.message, 1000),
      consent: body.consent === true,
      smsConsent: body.smsConsent === true,
      page: clean(body.page, 60),
      utmSource: clean(body.utmSource, 80),
      utmCampaign: clean(body.utmCampaign, 120),
      submittedAt: new Date()
    };

    // Phone must be a valid 10-digit US number (optionally with a leading 1),
    // checked here too so nothing can bypass the form's own check.
    let phoneDigits = lead.phone.replace(/\D/g, '');
    if (phoneDigits.length === 11 && phoneDigits.startsWith('1')) phoneDigits = phoneDigits.slice(1);
    const validUSPhone = /^[2-9]\d{2}[2-9]\d{2}\d{4}$/.test(phoneDigits);

    if (!lead.firstName || !validUSPhone || !lead.consent) {
      return badRequest({ headers, body: { ok: false, error: 'Missing required fields' } });
    }

    // No double-booking: if this exact date + time is already taken, say so
    // instead of saving, and the page will ask the visitor to pick another time.
    if (lead.preferredDateISO && lead.preferredTime) {
      const taken = await wixData.query('AnxietyLeads')
        .eq('preferredDateISO', lead.preferredDateISO)
        .eq('preferredTime', lead.preferredTime)
        .limit(1)
        .find({ suppressAuth: true });
      if (taken.items.length > 0) {
        return response({ status: 409, headers, body: { ok: false, error: 'slot_taken' } });
      }
    }

    await wixData.insert('AnxietyLeads', lead, { suppressAuth: true });
    return ok({ headers, body: { ok: true } });
  } catch (err) {
    console.error('Lead form error', err);
    return serverError({ headers, body: { ok: false } });
  }
}
