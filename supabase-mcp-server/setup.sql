-- Supabase MCP Server Setup
-- Run this SQL in your Supabase SQL Editor to enable the MCP server

-- Create a function to execute arbitrary SQL queries
-- This is required for the supabase_query tool
CREATE OR REPLACE FUNCTION exec_sql(query text, params anyarray DEFAULT ARRAY[]::text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  -- Execute the query
  EXECUTE query INTO result USING VARIADIC params;
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql TO service_role;

-- Optional: Create a view for easier table inspection
CREATE OR REPLACE VIEW mcp_table_info AS
SELECT
  t.table_schema,
  t.table_name,
  t.table_type,
  (
    SELECT COUNT(*)
    FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name = t.table_name
  ) as column_count,
  (
    SELECT pg_size_pretty(pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)))
    FROM pg_class
    WHERE relname = t.table_name
  ) as table_size,
  (
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = t.table_name
  ) as rls_enabled
FROM information_schema.tables t
WHERE t.table_schema = 'public'
ORDER BY t.table_name;

-- Grant access to the view
GRANT SELECT ON mcp_table_info TO authenticated;
GRANT SELECT ON mcp_table_info TO service_role;

-- Success message
SELECT 'Supabase MCP Server setup complete!' as message;
