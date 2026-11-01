# Ironvale: subscription management for a gym

A full-stack membership app for a fictional gym. Members pick a plan, pay in full or pay half now and the rest later, and follow their invoices. Admins manage plans and coupons, watch payments, and can close out a partial payment.

I built it as a take-home assessment for AgarkarMedia. The brand is made up, and payments are simulated.

- Live site: `https://fitness-subscriptions.vercel.app/`
- Repository: `https://github.com/Ishank-GH/fitness-subscriptions`
- Demo logins (one member, one admin): in my submission message.

## What it does

**Members**
- Browse plans and see a live price breakdown (gross, commitment discount, total, per month, minimum upfront).
- Check out with an optional coupon and choose full or partial payment.
- See the membership status on the dashboard, an alert after activation, and a warning in the last 3 days.
- `/billing` lists every invoice with its payments and any balance left, and lets the member pay the rest.

**Admins**
- Create, edit and archive plans (duration, base price, discount, partial payments allowed).
- Create, edit and archive coupons (flat or percentage, redemption limit, validity window).
- View all payments and close a partial payment as Completed, with a note.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Clerk for auth, MongoDB with Mongoose, Zod, TailwindCSS with shadcn/ui, GSAP for motion, Vitest for tests. Deployed on Vercel.

## Environment variables

The same template is in `.env.example`. Never commit real values.

| Variable | What it is |
|---|---|
| `MONGODB_URI` | MongoDB connection string, including the database name |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `CLERK_WEBHOOK_SECRET` | Signing secret of the Clerk webhook |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

## How it is organized

```
src/app/            pages and API route handlers
src/app/api/        plans, coupons, subscriptions, payments, transactions, webhooks
src/lib/pricing/    pricing engine, coupon rules, date math, atomic coupon redemption (+ tests)
src/lib/db/         connection, Mongoose models, lazy user creation
src/lib/auth.ts     role guards for pages and API handlers
src/lib/validators/ Zod schemas for every request body
src/components/     UI, with admin screens in components/admin
scripts/seed.ts     sample plans and coupons
```

## Decisions and why

- **Money is stored as integer paise** (₹1 = 100 paise), and field names carry a `Paise` suffix. Fractions come up easily (10% off ₹1,555, or 50% of an odd total), and floating-point rupees would make sums drift. In the brief's schema, `baseMonthlyPrice` is `baseMonthlyPricePaise` here.
- **All price math lives in one module** (`lib/pricing/engine.ts`). Checkout, billing and the admin override use it, and the client never sends a price. The plans page computes the breakdown on the server and passes plain numbers down.
- **Pricing order:** commitment discount first, then the coupon on what is left, never below zero. Percentages are rounded to the nearest paisa with one rule everywhere.
- **Subscription status is derived, not stored.** It is `NONE`, `ACTIVE`, `PARTIAL` or `EXPIRED`, computed from the end date and the balance when it is read, so it cannot go stale and no scheduled job is needed. The 3-day warning works the same way.
- **Roles** live in Clerk public metadata and reach the app as a session claim. They are enforced in the page layouts and in every admin API handler, not only in the middleware.
- **A subscription starts on the first successful payment.** Checkout creates a `PENDING` transaction only, so abandoning checkout leaves nothing active.
- **Coupons are redeemed atomically on the first payment**, with a single conditional update that only succeeds while redemptions are below the limit.
- **Invoice numbers** (`INV-0001`...) come from a counter collection incremented atomically, so two purchases cannot share a number.

## Snapshot strategy: what happens when plan prices change

An invoice must keep showing what the member agreed to, even after an admin edits or archives the plan.

When a subscription is created, the transaction stores its own frozen copy of everything that affects the money:

- `planSnapshot`: name, duration, monthly price, discount percentage, and whether partial payment was allowed.
- `couponSnapshot`: the code, type and amounts, if a coupon was used.
- The computed totals: `totalAmountPaise`, `amountPaidPaise`, `remainingBalancePaise`.

Billing pages, the balance owed, and the partial-payment rules all read from that copy and never from the live plan. `planId` is kept only as a link for reporting.

Example: a member buys the 3-month plan at ₹4,000 a month with 10% off, so the total is ₹10,800, and pays ₹5,400 up front. Next week an admin raises the plan to ₹5,000 a month. The member's invoice still shows ₹10,800, with ₹5,400 left to pay. Only new purchases are priced at ₹13,500.

Plans and coupons are archived (`isActive: false`), never deleted, so old transactions always have something to point to.

## Problems I found and fixed

- **Double submit on payments.** Two quick clicks could both read the same balance and record two payments. The payment now uses a conditional update on the amount already paid, and the losing request gets a clear conflict error.
- **Month-end dates.** A naive add-a-month turns 31 January into 3 March. A date helper now clamps to the last day of the month, with tests for leap years and year rollover.
- **Old balance overwriting a new subscription.** Paying an old partial invoice could overwrite the balance of a newer subscription. The subscription now stores which transaction it belongs to, and only that transaction updates it.
- **Partial-payment rule read from the live plan.** It now reads from the snapshot, so later plan edits cannot change an existing invoice.
- **Revenue counted forgiven amounts.** I spotted it on the admin overview, where collected revenue included an invoice that had been closed by an override. An override adds an `ADMIN_OVERRIDE` payment so the totals stay consistent, and revenue now excludes it and shows it separately as written off.
- **Error messages leaked internals.** Unexpected errors are logged on the server and return a generic message.
- **Display rounding.** Amounts such as ₹5,400.50 were shown rounded. They now show exact paise.

## Assumptions and limits

- Payments are simulated: a payment is recorded with a reference like `SIM-...`.
- Partial payment means a minimum of 50% on the first payment, then any amounts up to the balance before the plan ends. There is no fixed installment schedule.
- One active subscription per member. A new purchase is blocked while one is `ACTIVE` or `PARTIAL` and allowed after it expires. A transaction left `PENDING` does not block anything.
- A zero total (for example after a 100% coupon) is treated as paid immediately.
- One coupon per purchase. Times are shown in Indian time (IST).