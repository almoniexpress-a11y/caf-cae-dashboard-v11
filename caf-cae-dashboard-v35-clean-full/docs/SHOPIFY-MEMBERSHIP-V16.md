# CAF CAE Shopify Membership v16

## What this release adds

- Verifies Shopify webhook HMAC using `SHOPIFY_API_SECRET`.
- Processes paid orders only.
- Recognizes the four CAF CAE membership SKUs.
- Creates or updates the Shopify customer in `clients`.
- Activates a 12-month membership with plan credits and discount.
- Creates a receipt record for every activated membership.
- Uses Shopify webhook ID plus order/line-item uniqueness to prevent duplicates.
- Exposes the membership App Proxy dashboard at `/apps/cae-membership`.

## SKU mapping

| Shopify SKU | Plan | Price | Credits | Discount |
| --- | --- | ---: | ---: | ---: |
| `CAE-MEMBERSHIP-SMART` | Smart | €39 | 1 | 10% |
| `CAE-MEMBERSHIP-MAMMA` | Mamma & Bebè | €89 | 5 | 10% |
| `CAE-MEMBERSHIP-GOLD` | Gold | €129 | 3 | 15% |
| `CAE-MEMBERSHIP-PLATINUM` | Platinum | €199 | 5 | 20% |

## Deployment order

1. In Supabase SQL Editor, run `supabase/caf_cae_schema_v16_shopify_membership.sql`.
2. Commit/push this project to the GitHub repository connected to Railway.
3. In Railway, set:
   - `SHOPIFY_SHOP=s7peme-m9.myshopify.com`
   - `SHOPIFY_API_SECRET=<Client secret from CAF CAE Membership app>`
   - `SHOPIFY_APP_PROXY_PATH=/apps/cae-membership`
4. Wait for Railway deployment to become successful.
5. Confirm this returns JSON with `status: online`:
   - `https://caf-cae-dashboard-v11-production.up.railway.app/api/shopify/app`
6. Register a Shopify webhook for **Order payment / Orders paid** using JSON format and this URL:
   - `https://caf-cae-dashboard-v11-production.up.railway.app/api/shopify/webhooks/orders-paid`
7. Place one test order using a membership product and verify the rows in:
   - `shopify_webhook_receipts`
   - `clients`
   - `customer_memberships`
   - `membership_receipts`

## Important

Do not register the paid-order webhook before the database migration and Railway deployment are complete. In production, a missing `SHOPIFY_API_SECRET` causes webhook verification to fail closed.
