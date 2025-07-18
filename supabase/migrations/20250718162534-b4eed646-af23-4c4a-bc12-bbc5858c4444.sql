-- Check if any views still have SECURITY DEFINER and remove them completely
DO $$
DECLARE
    view_rec RECORD;
    view_definition TEXT;
BEGIN
    -- Get all views in public schema
    FOR view_rec IN 
        SELECT schemaname, viewname, definition
        FROM pg_views 
        WHERE schemaname = 'public'
    LOOP
        -- Check if the view definition contains SECURITY DEFINER
        IF view_rec.definition ILIKE '%SECURITY DEFINER%' THEN
            RAISE NOTICE 'Found SECURITY DEFINER view: %.%', view_rec.schemaname, view_rec.viewname;
            EXECUTE 'DROP VIEW IF EXISTS ' || view_rec.schemaname || '.' || view_rec.viewname || ' CASCADE';
            RAISE NOTICE 'Dropped view: %.%', view_rec.schemaname, view_rec.viewname;
        END IF;
    END LOOP;
END $$;