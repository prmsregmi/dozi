/**
 * Base API client configuration
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Get the API base URL from environment or default
 */
export function getApiBaseUrl(): string {
  // Use environment variable or default to localhost
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
}

/**
 * Create configured axios instance
 */
export function createApiClient(supabaseClient?: SupabaseClient): AxiosInstance {
  const client = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
  });

  // Request interceptor for auth and logging
  client.interceptors.request.use(
    async (config) => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);

      // Add auth token if supabase client is provided
      if (supabaseClient) {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (session?.access_token) {
          config.headers.Authorization = `Bearer ${session.access_token}`;
        }
      }

      return config;
    },
    (error) => {
      console.error('[API] Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response) => {
      console.log(`[API] ${response.status} ${response.config.url}`);
      return response;
    },
    async (error: AxiosError) => {
      if (error.response) {
        // Handle 401 - token expired or not yet loaded
        const config = error.config;
        if (error.response.status === 401 && supabaseClient && config && !(config as any)._retry) {
          (config as any)._retry = true;

          const {
            data: { session },
          } = await supabaseClient.auth.refreshSession();

          if (session) {
            config.headers.Authorization = `Bearer ${session.access_token}`;
            return client.request(config);
          }
        }

        console.error(
          `[API] Error ${error.response.status}:`,
          error.response.data || error.message
        );
      } else if (error.request) {
        console.error('[API] No response received:', error.message);
      } else {
        console.error('[API] Request setup error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return client;
}

/**
 * Default API client instance (without auth)
 * Import and call initApiClient() with supabase client to enable auth
 */
export let apiClient = createApiClient();

/**
 * Initialize API client with Supabase for authentication
 * Call this once in your app with the supabase client instance
 */
export function initApiClient(supabaseClient: SupabaseClient): void {
  apiClient = createApiClient(supabaseClient);
}
