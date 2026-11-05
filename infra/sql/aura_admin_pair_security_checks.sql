do $$
declare t text;
begin
  foreach t in array array['aura_admin_email_allowlist','aura_pairing_requests'] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
       where n.nspname='public' and c.relname=t and c.relrowsecurity
    ) then raise exception 'Missing RLS on %',t; end if;
    if has_table_privilege('anon', 'public.'||t,'SELECT')
       or has_table_privilege('authenticated','public.'||t,'SELECT')
       or has_table_privilege('authenticated','public.'||t,'INSERT')
       or has_table_privilege('authenticated','public.'||t,'UPDATE')
       or has_table_privilege('authenticated','public.'||t,'DELETE')
    then raise exception 'Client permissions exposed on %',t; end if;
  end loop;
  if has_function_privilege('anon','public.aura_bootstrap_parent(uuid)','EXECUTE')
    or has_function_privilege('authenticated','public.aura_bootstrap_parent(uuid)','EXECUTE')
    or has_function_privilege('anon','public.aura_redeem_device_pairing(text,uuid,text)','EXECUTE')
    or has_function_privilege('authenticated','public.aura_redeem_device_pairing(text,uuid,text)','EXECUTE')
  then raise exception 'Privileged bootstrap/pair RPC exposed'; end if;
  if not has_function_privilege('service_role','public.aura_bootstrap_parent(uuid)','EXECUTE')
    or not has_function_privilege('service_role','public.aura_redeem_device_pairing(text,uuid,text)','EXECUTE')
  then raise exception 'Server-only RPC permission missing'; end if;
  raise notice 'AURA admin allowlist and pairing grants check passed';
end $$;