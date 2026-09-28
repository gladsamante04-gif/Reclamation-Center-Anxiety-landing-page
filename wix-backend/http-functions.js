// Reclamation Center – receives Anxiety Support landing page form submissions.
// Paste this into Wix: Dev Mode → Backend → http-functions.js
// Endpoint (after publishing the Wix site): https://www.reclamationcntr.com/_functions/lead
//
// Before this works, create a CMS collection named "AnxietyLeads" with these fields:
//   firstName (Text), phone (Text), email (Text), message (Text), consent (Boolean),
//   page (Text), utmSource (Text), utmCampaign (Text), submittedAt (Date and Time)
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
      message: clean(body.message, 1000),
      consent: body.consent === true,
      page: clean(body.page, 60),
      utmSource: clean(body.utmSource, 80),
      utmCampaign: clean(body.utmCampaign, 120),
      submittedAt: new Date()
    };

    if (!lead.firstName || lead.phone.replace(/\D/g, '').length < 10 || !lead.consent) {
      return badRequest({ headers, body: { ok: false, error: 'Missing required fields' } });
    }

    await wixData.insert('AnxietyLeads', lead, { suppressAuth: true });
    return ok({ headers, body: { ok: true } });
  } catch (err) {
    console.error('Lead form error', err);
    return serverError({ headers, body: { ok: false } });
  }
}
