import { z } from 'zod';

/**
 * Configuration for the Supabase MCP server
 */
export interface SupabaseConfig {
  projectRef: string;
  accessToken: string;
  serviceRoleKey?: string;
  anonKey?: string;
  readOnly?: boolean;
}

/**
 * Database query parameters
 */
export const QuerySchema = z.object({
  sql: z.string().describe('SQL query to execute'),
  params: z.array(z.any()).optional().describe('Query parameters for prepared statements'),
});

/**
 * Table inspection parameters
 */
export const TableSchema = z.object({
  tableName: z.string().describe('Name of the table to inspect'),
  includeData: z.boolean().optional().describe('Include sample data (limit 10 rows)'),
});

/**
 * Edge function deployment parameters
 */
export const DeployFunctionSchema = z.object({
  functionName: z.string().describe('Name of the edge function'),
  verify: z.boolean().optional().describe('Verify deployment after deploying'),
});

/**
 * Edge function logs parameters
 */
export const FunctionLogsSchema = z.object({
  functionName: z.string().optional().describe('Filter logs by function name'),
  limit: z.number().optional().default(50).describe('Number of log entries to return'),
  level: z.enum(['info', 'error', 'warn', 'debug']).optional().describe('Filter by log level'),
});

/**
 * RLS policy inspection parameters
 */
export const RLSPolicySchema = z.object({
  tableName: z.string().optional().describe('Filter policies by table name'),
});

/**
 * Storage bucket operations
 */
export const StorageListSchema = z.object({
  bucketName: z.string().describe('Name of the storage bucket'),
  path: z.string().optional().default('').describe('Path within the bucket'),
  limit: z.number().optional().default(100).describe('Max files to return'),
});

/**
 * Migration status parameters
 */
export const MigrationStatusSchema = z.object({
  pending: z.boolean().optional().describe('Show only pending migrations'),
});

export type QueryParams = z.infer<typeof QuerySchema>;
export type TableParams = z.infer<typeof TableSchema>;
export type DeployFunctionParams = z.infer<typeof DeployFunctionSchema>;
export type FunctionLogsParams = z.infer<typeof FunctionLogsSchema>;
export type RLSPolicyParams = z.infer<typeof RLSPolicySchema>;
export type StorageListParams = z.infer<typeof StorageListSchema>;
export type MigrationStatusParams = z.infer<typeof MigrationStatusSchema>;
