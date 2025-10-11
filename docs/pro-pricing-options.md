# Professional Dashboard Pricing Concepts

## Tiering Outline
- **Starter (Free trial)**
  - Up to 3 active clients
  - Basic caseload tracking, manual exports
- **Professional ($49/mo)**
  - Unlimited clients, task workflow, saved matches syncing
  - Email summaries + PDF export credits
- **Team ($199/mo for 5 seats)**
  - Shared caseloads, role-based access, audit logs
  - Priority support, concierge facility outreach
- **Enterprise (Custom)**
  - SSO, API access, custom analytics dashboards
  - Dedicated success manager and onboarding package

## Billing Hooks
- Use `pro_accounts` table with `plan_tier`, `stripe_customer_id`, `trial_ends_at`
- `pro_members` records include `role` and `is_active`
- Feature flags stored in `pro_account_features` for add-ons (e.g., SMS alerts)

## Next Steps
- Finalize plan inclusions with partnerships team
- Integrate Stripe billing portal once plans approved
- Add entitlement checks around `/pro` routes and actions
