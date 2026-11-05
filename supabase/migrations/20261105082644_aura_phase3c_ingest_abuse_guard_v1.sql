-- AURA STUDY Phase 3C STAGING — migration applied on 2026-11-05.
-- Adds server-side per-device guard: 60 events/min, 1000/day, <=7d offline age, +10m skew.

CREATE INDEX aura_events_device_rate_idx
ON public.aura_learning_events (device_id, received_at DESC);

CREATE FUNCTION public.aura_guard_learning_event_ingest_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE v_minute bigint; v_day bigint;
BEGIN
  IF NEW.client_created_at < pg_catalog.now() - interval '7 days'
     OR NEW.client_created_at > pg_catalog.now() + interval '10 minutes'
  THEN
    RAISE EXCEPTION 'AURA_EVENT_TIMESTAMP_OUT_OF_RANGE'
    USING ERRCODE = '22007';
  END IF;

  IF (SELECT auth.uid()) IS NOT NULL THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(NEW.device_id::text, 381209)
    );

    SELECT count(*) INTO v_minute
      FROM public.aura_learning_events AS e
     WHERE e.device_id = NEW.device_id
       AND e.received_at >= pg_catalog.now() - interval '1 minute';
    IF v_minute >= 60 THEN
      RAISE EXCEPTION 'AURA_EVENT_RATE_LIMIT'
      USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO v_day
      FROM public.aura_learning_events AS e
     WHERE e.device_id = NEW.device_id
       AND e.received_at >= pg_catalog.now() - interval '1 day';
    IF v_day >= 1000 THEN
      RAISE EXCEPTION 'AURA_EVENT_DAILY_LIMIT'
      USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.aura_guard_learning_event_ingest_v1()
FROM PUBLIC, anon, authenticated;

CREATE TRIGGER aura_events_ingest_guard_v1
BEFORE INSERT ON public.aura_learning_events
FOR EACH ROW EXECUTE FUNCTION public.aura_guard_learning_event_ingest_v1();

COMMENT ON FUNCTION public.aura_guard_learning_event_ingest_v1() IS
 'STAGING Phase3C: per-device rate guard (60/min and 1000/day), 7d offline-age window. SECURITY INVOKER; RLS still applies.';
