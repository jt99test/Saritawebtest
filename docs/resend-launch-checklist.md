# Resend launch checklist

Use this checklist when moving SARITA email from test/dev to production.

## Resend dashboard

1. Add and verify your sending domain in Resend.
2. Add the DNS records Resend gives you:
   - SPF / TXT
   - DKIM
   - DMARC, recommended
3. Create a production API key.
4. Add these environment variables in Vercel:
   - `RESEND_API_KEY`
   - `RESEND_FROM`, for example `SARITA <contacto@saritaastrology.com>`
   - `RESEND_REPLY_TO`, for example `contacto@saritaastrology.com`
   - `NEXT_PUBLIC_SITE_URL`, for example `https://saritaastrology.com`

For the temporary Vercel domain, `RESEND_FROM` still needs to use a domain verified in Resend.

## Supabase auth emails

SARITA has React Email templates for:

- Account confirmation
- Password reset

Generate the HTML templates with:

```bash
npx tsx scripts/render-email-templates.ts
```

Then paste the generated HTML into Supabase:

- `docs/supabase-email-templates/confirmation.html`
- `docs/supabase-email-templates/password-reset.html`

Supabase should keep using `{{ .ConfirmationURL }}` inside those templates.

## App-triggered emails

These are sent through `lib/email.ts` using Resend:

- Welcome email after sign-up
- Account deletion confirmation
- Stripe purchase receipt
- Stripe plan upgrade
- Stripe cancellation
- Stripe failed payment
- Stripe renewal reminder
- Lavado receipt

Stripe emails require the live Stripe webhook to be configured before they work in production.

## Manual test

Before launch:

1. Sign up with email/password and verify the Supabase confirmation email.
2. Request password reset from account settings.
3. Create a new account and confirm the welcome email arrives.
4. After Stripe is live, test checkout and webhook-triggered receipts.
