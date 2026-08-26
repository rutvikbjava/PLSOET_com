import { getAdminClient, isAdminClientAvailable } from '@/lib/supabase/admin';

describe('Supabase Admin Client', () => {
  describe('getAdminClient', () => {
    it('should throw error when called in browser context', () => {
      // Simulate browser environment
      const originalWindow = global.window;
      (global as typeof globalThis & { window: Window & typeof globalThis }).window = {} as Window & typeof globalThis;

      expect(() => {
        getAdminClient();
      }).toThrow('getAdminClient() was called in browser context');

      // Restore
      global.window = originalWindow;
    });

    it('should throw error when service role key is not configured', () => {
      // Ensure we're in server context
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      // Remove service role key
      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => {
        getAdminClient();
      }).toThrow('SUPABASE_SERVICE_ROLE_KEY is not configured');

      // Restore
      if (originalKey) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
      }
      global.window = originalWindow;
    });
  });

  describe('isAdminClientAvailable', () => {
    it('should return false in browser context', () => {
      const originalWindow = global.window;
      (global as typeof globalThis & { window: Window & typeof globalThis }).window = {} as Window & typeof globalThis;

      expect(isAdminClientAvailable()).toBe(false);

      global.window = originalWindow;
    });

    it('should return false when service role key is not set', () => {
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(isAdminClientAvailable()).toBe(false);

      if (originalKey) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey;
      }
      global.window = originalWindow;
    });
  });
});
