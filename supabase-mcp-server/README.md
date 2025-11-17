# Supabase MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) server for Supabase. Query databases, deploy edge functions, stream logs, and manage your Supabase projects directly from Claude Code or any MCP-compatible client.

## Features

### 🗄️ Database Operations
- Execute SQL queries (SELECT, INSERT, UPDATE, DELETE)
- Inspect table schemas and sample data
- List all tables
- Check RLS policies and status
- Safe read-only mode available

### ⚡ Edge Functions
- Deploy edge functions
- Retrieve function logs with filtering
- List all functions
- Get function details

### 🔒 Security
- Read-only mode to prevent accidental modifications
- Service role key support for admin operations
- Anon key support for client operations

## Installation

```bash
npm install -g @supabase/mcp-server
```

Or use directly with `npx`:

```bash
npx @supabase/mcp-server
```

## Configuration

### Environment Variables

The server requires the following environment variables:

```bash
# Required: Your Supabase project reference
SUPABASE_PROJECT_REF=ckfktnhnnjbnbajgvwyz

# Required: At least one of these keys
SUPABASE_ACCESS_TOKEN=sbp_xxxxx  # Supabase access token (for API calls)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx  # Service role key (for database access)

# Optional
SUPABASE_ANON_KEY=eyJxxx  # Anon key for client operations
SUPABASE_READ_ONLY=true  # Enable read-only mode (default: false)
```

### Claude Code Configuration

Add to your Claude Code settings (`~/.config/claude/config.json` or workspace settings):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_ACCESS_TOKEN": "your-access-token",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_READ_ONLY": "false"
      }
    }
  }
}
```

### Read-Only Mode (Recommended for Safety)

For debugging and inspection without risk of modifying data:

```json
{
  "mcpServers": {
    "supabase-readonly": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "SUPABASE_READ_ONLY": "true"
      }
    }
  }
}
```

## Available Tools

### Database Tools

#### `supabase_query`
Execute SQL queries on your database.

**Parameters:**
- `sql` (string, required): SQL query to execute
- `params` (array, optional): Query parameters for prepared statements

**Example:**
```typescript
{
  "sql": "SELECT * FROM users WHERE created_at > $1 LIMIT 10",
  "params": ["2024-01-01"]
}
```

#### `supabase_inspect_table`
Inspect table schema and optionally retrieve sample data.

**Parameters:**
- `tableName` (string, required): Name of the table
- `includeData` (boolean, optional): Include 10 sample rows

**Example:**
```typescript
{
  "tableName": "company_os_documents",
  "includeData": true
}
```

#### `supabase_list_tables`
List all tables in the public schema.

**Parameters:** None

#### `supabase_get_rls_policies`
Get RLS policies for tables.

**Parameters:**
- `tableName` (string, optional): Filter by table name

**Example:**
```typescript
{
  "tableName": "company_os_documents"
}
```

#### `supabase_check_rls_status`
Check if RLS is enabled on a table.

**Parameters:**
- `tableName` (string, required): Name of the table

### Edge Function Tools

#### `supabase_deploy_function`
Deploy an edge function.

**Parameters:**
- `functionName` (string, required): Name of the function
- `verify` (boolean, optional): Verify after deployment

**Example:**
```typescript
{
  "functionName": "extract-text",
  "verify": true
}
```

#### `supabase_function_logs`
Retrieve edge function logs.

**Parameters:**
- `functionName` (string, optional): Filter by function name
- `limit` (number, optional): Number of logs (default: 50)
- `level` (string, optional): Filter by level (info, error, warn, debug)

**Example:**
```typescript
{
  "functionName": "generate-embeddings",
  "limit": 100,
  "level": "error"
}
```

#### `supabase_list_functions`
List all edge functions.

**Parameters:** None

#### `supabase_function_details`
Get details about a specific function.

**Parameters:**
- `functionName` (string, required): Name of the function

## Real-World Usage Examples

### Debugging Document Upload Issues

```typescript
// 1. Check if RLS is enabled on the table
{
  "tool": "supabase_check_rls_status",
  "arguments": { "tableName": "company_os_documents" }
}

// 2. Get RLS policies to see if they're blocking access
{
  "tool": "supabase_get_rls_policies",
  "arguments": { "tableName": "company_os_documents" }
}

// 3. Check if document exists
{
  "tool": "supabase_query",
  "arguments": {
    "sql": "SELECT id, status, created_at FROM company_os_documents WHERE id = $1",
    "params": ["a29be116-c511-484f-b693-c98d9a872550"]
  }
}

// 4. Check edge function logs for errors
{
  "tool": "supabase_function_logs",
  "arguments": {
    "functionName": "generate-embeddings",
    "level": "error",
    "limit": 50
  }
}
```

### Deploying and Monitoring

```typescript
// 1. Deploy with verification
{
  "tool": "supabase_deploy_function",
  "arguments": {
    "functionName": "extract-text",
    "verify": true
  }
}

// 2. Check logs immediately after
{
  "tool": "supabase_function_logs",
  "arguments": {
    "functionName": "extract-text",
    "limit": 20
  }
}
```

### Database Schema Inspection

```typescript
// 1. List all tables
{
  "tool": "supabase_list_tables"
}

// 2. Inspect specific table with sample data
{
  "tool": "supabase_inspect_table",
  "arguments": {
    "tableName": "embeddings",
    "includeData": true
  }
}
```

## How This Would Have Helped

In the document upload debugging scenario, instead of multiple back-and-forth messages:

**Before (Manual):**
1. User: "Can you check the logs?"
2. User: *copies and pastes logs*
3. Assistant: "Can you run this SQL query?"
4. User: *runs query in Supabase dashboard*
5. User: *copies and pastes results*

**With MCP Server:**
1. Assistant directly queries database to check document
2. Assistant checks RLS policies
3. Assistant streams edge function logs in real-time
4. Assistant identifies the issue immediately

**Time saved: Hours → Minutes**

## Development

### Build from source

```bash
git clone https://github.com/supabase-community/mcp-server
cd mcp-server
npm install
npm run build
```

### Run locally

```bash
npm run dev
```

### Testing

Add to your Claude Code config for local testing:

```json
{
  "mcpServers": {
    "supabase-dev": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/supabase-mcp-server",
      "env": {
        "SUPABASE_PROJECT_REF": "your-project-ref",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

## Security Best Practices

1. **Use Read-Only Mode** when debugging or inspecting data
2. **Never commit** service role keys or access tokens to version control
3. **Use environment variables** for all sensitive configuration
4. **Limit permissions** - use anon keys for client operations when possible
5. **Review RLS policies** before enabling write operations

## Troubleshooting

### "exec_sql function not found"

The server requires a database function to execute arbitrary SQL. Create it:

```sql
CREATE OR REPLACE FUNCTION exec_sql(query text, params anyarray DEFAULT ARRAY[]::text[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE query INTO result USING VARIADIC params;
  RETURN result;
END;
$$;
```

### Connection Issues

Ensure your project URL and keys are correct:
- Project ref format: `ckfktnhnnjbnbajgvwyz`
- Service role key starts with: `eyJ`
- Access token starts with: `sbp_`

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT

## Links

- [Model Context Protocol](https://modelcontextprotocol.io)
- [Supabase Documentation](https://supabase.com/docs)
- [Claude Code](https://claude.ai/code)

---

Built with ❤️ by the Supabase community
