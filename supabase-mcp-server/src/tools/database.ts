import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { QueryParams, TableParams, RLSPolicyParams } from '../types.js';

export class DatabaseTools {
  private client: SupabaseClient;
  private readOnly: boolean;

  constructor(projectUrl: string, serviceRoleKey: string, readOnly = false) {
    this.client = createClient(projectUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.readOnly = readOnly;
  }

  /**
   * Execute a SQL query
   */
  async query(params: QueryParams): Promise<{ data: any[] | null; error: string | null }> {
    try {
      // Safety check for read-only mode
      const sqlUpper = params.sql.trim().toUpperCase();
      const isWriteOperation =
        sqlUpper.startsWith('INSERT') ||
        sqlUpper.startsWith('UPDATE') ||
        sqlUpper.startsWith('DELETE') ||
        sqlUpper.startsWith('DROP') ||
        sqlUpper.startsWith('ALTER') ||
        sqlUpper.startsWith('CREATE') ||
        sqlUpper.startsWith('TRUNCATE');

      if (this.readOnly && isWriteOperation) {
        return {
          data: null,
          error: 'Write operations are disabled in read-only mode',
        };
      }

      const { data, error } = await this.client.rpc('exec_sql', {
        query: params.sql,
        params: params.params || [],
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Inspect a table's structure and optionally sample data
   */
  async inspectTable(params: TableParams): Promise<{
    schema: any[] | null;
    data: any[] | null;
    rowCount: number | null;
    error: string | null;
  }> {
    try {
      // Get table schema
      const { data: schemaData, error: schemaError } = await this.client.rpc('exec_sql', {
        query: `
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position;
        `,
        params: [params.tableName],
      });

      if (schemaError) {
        return { schema: null, data: null, rowCount: null, error: schemaError.message };
      }

      // Get row count
      const { count, error: countError } = await this.client
        .from(params.tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        return { schema: schemaData, data: null, rowCount: null, error: countError.message };
      }

      // Optionally get sample data
      let sampleData = null;
      if (params.includeData) {
        const { data, error: dataError } = await this.client
          .from(params.tableName)
          .select('*')
          .limit(10);

        if (dataError) {
          return {
            schema: schemaData,
            data: null,
            rowCount: count,
            error: `Schema retrieved, but sample data failed: ${dataError.message}`,
          };
        }

        sampleData = data;
      }

      return {
        schema: schemaData,
        data: sampleData,
        rowCount: count,
        error: null,
      };
    } catch (err: any) {
      return { schema: null, data: null, rowCount: null, error: err.message };
    }
  }

  /**
   * Get RLS policies for tables
   */
  async getRLSPolicies(params: RLSPolicyParams): Promise<{ data: any[] | null; error: string | null }> {
    try {
      let query = `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
      `;

      const queryParams: string[] = [];
      if (params.tableName) {
        query += ' WHERE tablename = $1';
        queryParams.push(params.tableName);
      }

      query += ' ORDER BY tablename, policyname;';

      const { data, error } = await this.client.rpc('exec_sql', {
        query,
        params: queryParams,
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * List all tables in the public schema
   */
  async listTables(): Promise<{ data: any[] | null; error: string | null }> {
    try {
      const { data, error } = await this.client.rpc('exec_sql', {
        query: `
          SELECT
            table_name,
            table_type
          FROM information_schema.tables
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `,
        params: [],
      });

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }

  /**
   * Check if RLS is enabled on a table
   */
  async checkRLSStatus(tableName: string): Promise<{ enabled: boolean | null; error: string | null }> {
    try {
      const { data, error } = await this.client.rpc('exec_sql', {
        query: `
          SELECT relrowsecurity as rls_enabled
          FROM pg_class
          WHERE relname = $1;
        `,
        params: [tableName],
      });

      if (error) {
        return { enabled: null, error: error.message };
      }

      if (!data || data.length === 0) {
        return { enabled: null, error: 'Table not found' };
      }

      return { enabled: data[0].rls_enabled, error: null };
    } catch (err: any) {
      return { enabled: null, error: err.message };
    }
  }
}
