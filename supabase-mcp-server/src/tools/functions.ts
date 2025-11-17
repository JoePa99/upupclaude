import { exec } from 'child_process';
import { promisify } from 'util';
import type { DeployFunctionParams, FunctionLogsParams } from '../types.js';

const execAsync = promisify(exec);

export class FunctionTools {
  private projectRef: string;
  private readOnly: boolean;

  constructor(projectRef: string, readOnly = false) {
    this.projectRef = projectRef;
    this.readOnly = readOnly;
  }

  /**
   * Deploy an edge function
   */
  async deployFunction(params: DeployFunctionParams): Promise<{ success: boolean; output: string; error: string | null }> {
    if (this.readOnly) {
      return {
        success: false,
        output: '',
        error: 'Function deployment is disabled in read-only mode',
      };
    }

    try {
      const verifyFlag = params.verify ? '--verify' : '';
      const command = `supabase functions deploy ${params.functionName} ${verifyFlag}`;

      const { stdout, stderr } = await execAsync(command, {
        cwd: process.cwd(),
        timeout: 120000, // 2 minute timeout
      });

      return {
        success: true,
        output: stdout + (stderr ? `\nWarnings: ${stderr}` : ''),
        error: null,
      };
    } catch (err: any) {
      return {
        success: false,
        output: err.stdout || '',
        error: err.message + (err.stderr ? `\n${err.stderr}` : ''),
      };
    }
  }

  /**
   * Get edge function logs
   * Uses Supabase Management API
   */
  async getFunctionLogs(params: FunctionLogsParams, accessToken: string): Promise<{
    logs: any[] | null;
    error: string | null;
  }> {
    try {
      const url = new URL(`https://api.supabase.com/v1/projects/${this.projectRef}/functions/logs`);

      if (params.functionName) {
        url.searchParams.append('function_name', params.functionName);
      }
      if (params.limit) {
        url.searchParams.append('limit', params.limit.toString());
      }
      if (params.level) {
        url.searchParams.append('level', params.level);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          logs: null,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return { logs: data, error: null };
    } catch (err: any) {
      return { logs: null, error: err.message };
    }
  }

  /**
   * List all edge functions
   */
  async listFunctions(accessToken: string): Promise<{
    functions: any[] | null;
    error: string | null;
  }> {
    try {
      const url = `https://api.supabase.com/v1/projects/${this.projectRef}/functions`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          functions: null,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return { functions: data, error: null };
    } catch (err: any) {
      return { functions: null, error: err.message };
    }
  }

  /**
   * Get function details
   */
  async getFunctionDetails(functionName: string, accessToken: string): Promise<{
    details: any | null;
    error: string | null;
  }> {
    try {
      const url = `https://api.supabase.com/v1/projects/${this.projectRef}/functions/${functionName}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          details: null,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = await response.json();
      return { details: data, error: null };
    } catch (err: any) {
      return { details: null, error: err.message };
    }
  }
}
