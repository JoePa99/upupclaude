#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { DatabaseTools } from './tools/database.js';
import { FunctionTools } from './tools/functions.js';
import {
  QuerySchema,
  TableSchema,
  DeployFunctionSchema,
  FunctionLogsSchema,
  RLSPolicySchema,
  type SupabaseConfig,
} from './types.js';

/**
 * Supabase MCP Server
 * Provides Model Context Protocol tools for interacting with Supabase projects
 */
class SupabaseMCPServer {
  private server: Server;
  private config: SupabaseConfig;
  private dbTools: DatabaseTools;
  private fnTools: FunctionTools;

  constructor() {
    // Load configuration from environment variables
    this.config = {
      projectRef: process.env.SUPABASE_PROJECT_REF || '',
      accessToken: process.env.SUPABASE_ACCESS_TOKEN || '',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      anonKey: process.env.SUPABASE_ANON_KEY,
      readOnly: process.env.SUPABASE_READ_ONLY === 'true',
    };

    if (!this.config.projectRef) {
      throw new Error('SUPABASE_PROJECT_REF environment variable is required');
    }

    if (!this.config.accessToken && !this.config.serviceRoleKey) {
      throw new Error('Either SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY is required');
    }

    const projectUrl = `https://${this.config.projectRef}.supabase.co`;

    // Initialize tools
    this.dbTools = new DatabaseTools(
      projectUrl,
      this.config.serviceRoleKey,
      this.config.readOnly
    );

    this.fnTools = new FunctionTools(
      this.config.projectRef,
      this.config.readOnly
    );

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = [
        // Database tools
        {
          name: 'supabase_query',
          description: 'Execute a SQL query on the Supabase database. Supports SELECT, INSERT, UPDATE, DELETE, and other SQL operations.',
          inputSchema: {
            type: 'object',
            properties: QuerySchema.shape,
            required: ['sql'],
          },
        },
        {
          name: 'supabase_inspect_table',
          description: 'Inspect a table schema and optionally retrieve sample data. Shows column names, types, constraints, and row count.',
          inputSchema: {
            type: 'object',
            properties: TableSchema.shape,
            required: ['tableName'],
          },
        },
        {
          name: 'supabase_list_tables',
          description: 'List all tables in the public schema.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'supabase_get_rls_policies',
          description: 'Get Row Level Security (RLS) policies for tables. Shows policy names, commands, roles, and conditions.',
          inputSchema: {
            type: 'object',
            properties: RLSPolicySchema.shape,
          },
        },
        {
          name: 'supabase_check_rls_status',
          description: 'Check if RLS is enabled on a specific table.',
          inputSchema: {
            type: 'object',
            properties: {
              tableName: { type: 'string', description: 'Name of the table to check' },
            },
            required: ['tableName'],
          },
        },

        // Edge function tools
        {
          name: 'supabase_deploy_function',
          description: 'Deploy an edge function to Supabase. Requires Supabase CLI to be installed and authenticated.',
          inputSchema: {
            type: 'object',
            properties: DeployFunctionSchema.shape,
            required: ['functionName'],
          },
        },
        {
          name: 'supabase_function_logs',
          description: 'Retrieve logs from edge functions. Can filter by function name, log level, and limit results.',
          inputSchema: {
            type: 'object',
            properties: FunctionLogsSchema.shape,
          },
        },
        {
          name: 'supabase_list_functions',
          description: 'List all edge functions in the project.',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'supabase_function_details',
          description: 'Get detailed information about a specific edge function.',
          inputSchema: {
            type: 'object',
            properties: {
              functionName: { type: 'string', description: 'Name of the edge function' },
            },
            required: ['functionName'],
          },
        },
      ];

      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Database tools
          case 'supabase_query': {
            const params = QuerySchema.parse(args);
            const result = await this.dbTools.query(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_inspect_table': {
            const params = TableSchema.parse(args);
            const result = await this.dbTools.inspectTable(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_list_tables': {
            const result = await this.dbTools.listTables();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_get_rls_policies': {
            const params = RLSPolicySchema.parse(args);
            const result = await this.dbTools.getRLSPolicies(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_check_rls_status': {
            const { tableName } = args as { tableName: string };
            const result = await this.dbTools.checkRLSStatus(tableName);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          // Edge function tools
          case 'supabase_deploy_function': {
            const params = DeployFunctionSchema.parse(args);
            const result = await this.fnTools.deployFunction(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_function_logs': {
            const params = FunctionLogsSchema.parse(args);
            const result = await this.fnTools.getFunctionLogs(params, this.config.accessToken);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_list_functions': {
            const result = await this.fnTools.listFunctions(this.config.accessToken);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'supabase_function_details': {
            const { functionName } = args as { functionName: string };
            const result = await this.fnTools.getFunctionDetails(functionName, this.config.accessToken);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: error.message }, null, 2),
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Supabase MCP server running on stdio');
  }
}

// Start the server
const server = new SupabaseMCPServer();
server.run().catch(console.error);
