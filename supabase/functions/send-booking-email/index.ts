// Supabase Edge Function: send-booking-email
// Triggered from Checkout.tsx after a successful payment
// Sends confirmation email to guest + notification to host via Resend

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = 'Aloft <onboarding@resend.dev>'; // Free Resend test address — works without a custom domain

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const {
      guestEmail,
      hostEmail,
      propertyTitle,
      propertyLocation,
      checkIn,
      checkOut,
      nights,
      guests,
      grandTotal,
      paymentReference,
    } = await req.json();

    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('en-GH', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

    // ── 1. Guest confirmation email ─────────────────────────────────
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: guestEmail,
        subject: `Booking Confirmed – ${propertyTitle}`,
        html: `
          <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #111;">
            <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">You're booked! 🎉</h1>
            <p style="color: #555; margin-top: 0;">Your stay at <strong>${propertyTitle}</strong> is confirmed.</p>

            <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #777;">Property</td><td style="font-weight: 600;">${propertyTitle}</td></tr>
                <tr><td style="padding: 6px 0; color: #777;">Location</td><td>${propertyLocation}</td></tr>
                <tr><td style="padding: 6px 0; color: #777;">Check-in</td><td style="font-weight: 600;">${formatDate(checkIn)}</td></tr>
                <tr><td style="padding: 6px 0; color: #777;">Check-out</td><td style="font-weight: 600;">${formatDate(checkOut)}</td></tr>
                <tr><td style="padding: 6px 0; color: #777;">Duration</td><td>${nights} night${nights !== 1 ? 's' : ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #777;">Guests</td><td>${guests}</td></tr>
                <tr style="border-top: 1px solid #eee;">
                  <td style="padding: 12px 0 6px; font-weight: 700; font-size: 15px;">Total paid</td>
                  <td style="font-weight: 700; font-size: 15px;">GHS ${grandTotal.toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 12px; color: #aaa;">Payment ref: ${paymentReference}</p>
            <p style="font-size: 13px; color: #555;">Need help? Reply to this email and we'll get back to you.</p>
            <p style="font-size: 13px; color: #888; margin-top: 32px;">— The Aloft Team</p>
          </div>
        `,
      }),
    });

    // ── 2. Host notification email ──────────────────────────────────
    if (hostEmail) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: hostEmail,
          subject: `New booking for ${propertyTitle}`,
          html: `
            <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; color: #111;">
              <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">New booking! 🏠</h1>
              <p style="color: #555; margin-top: 0;">Someone just booked <strong>${propertyTitle}</strong>.</p>

              <div style="background: #f9f9f9; border-radius: 12px; padding: 24px; margin: 24px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr><td style="padding: 6px 0; color: #777;">Guest</td><td style="font-weight: 600;">${guestEmail}</td></tr>
                  <tr><td style="padding: 6px 0; color: #777;">Check-in</td><td style="font-weight: 600;">${formatDate(checkIn)}</td></tr>
                  <tr><td style="padding: 6px 0; color: #777;">Check-out</td><td style="font-weight: 600;">${formatDate(checkOut)}</td></tr>
                  <tr><td style="padding: 6px 0; color: #777;">Duration</td><td>${nights} night${nights !== 1 ? 's' : ''}</td></tr>
                  <tr><td style="padding: 6px 0; color: #777;">Guests</td><td>${guests}</td></tr>
                  <tr style="border-top: 1px solid #eee;">
                    <td style="padding: 12px 0 6px; font-weight: 700; font-size: 15px;">Your earnings (90%)</td>
                    <td style="font-weight: 700; font-size: 15px; color: #16a34a;">GHS ${(grandTotal * 0.9).toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 12px; color: #aaa;">Payment ref: ${paymentReference}</p>
              <p style="font-size: 13px; color: #888; margin-top: 32px;">— The Aloft Team</p>
            </div>
          `,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err) {
    console.error('Email send error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
