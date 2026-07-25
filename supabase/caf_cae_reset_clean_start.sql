-- CAF CAE v13 CLEAN START RESET
-- Keeps secure users and password_hash. Removes demo/snapshot/practice data.

begin;

-- Remove old browser/live snapshots so the app starts from a clean state.
delete from public.dashboard_snapshots;

-- Remove operational demo/work data.
truncate table
  public.practice_status_history,
  public.agent_clients,
  public.agent_credit_transactions,
  public.agent_credit_requests,
  public.modify_requests,
  public.invoices,
  public.comm_sales,
  public.comm_f24,
  public.comm_employees,
  public.documents,
  public.comm_documents,
  public.generated_documents,
  public.communications,
  public.comm_deadlines,
  public.comm_backups,
  public.tickets,
  public.team_daily_reports,
  public.receipts,
  public.shopify_sync_logs,
  public.webhook_events,
  public.pratiche,
  public.business_profiles,
  public.subscriptions,
  public.subscription_payments,
  public.companies,
  public.clients
restart identity cascade;

-- Keep dashboard_users, password_hash and active roles. Remove any accidental plain text passwords.
update public.dashboard_users
set password = null, updated_at = now()
where username in ('admin','agent','commercialista','bangla','italy');

commit;

-- Check clean result
select 'dashboard_snapshots' as table_name, count(*) as rows from public.dashboard_snapshots
union all select 'pratiche', count(*) from public.pratiche
union all select 'companies', count(*) from public.companies
union all select 'clients', count(*) from public.clients
union all select 'dashboard_users', count(*) from public.dashboard_users;
