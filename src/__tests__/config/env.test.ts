import { getPublicConfig, getServerConfig } from '@/config/env';

describe('Environment Configuration', () => {
  describe('getPublicConfig', () => {
    it('should return public configuration', () => {
      const config = getPublicConfig();
      
      expect(config).toHaveProperty('supabase');
      expect(config).toHaveProperty('app');
      expect(config.supabase).toHaveProperty('url');
      expect(config.supabase).toHaveProperty('anonKey');
      expect(config.app).toHaveProperty('name');
      expect(config.app).toHaveProperty('url');
    });

    it('should have default app name', () => {
      const config = getPublicConfig();
      expect(config.app.name).toBe('EduSphere AI');
    });
  });

  describe('getServerConfig', () => {
    it('should throw error when called in browser context', () => {
      // Simulate browser environment
      const originalWindow = global.window;
      (global as typeof globalThis & { window: Window & typeof globalThis }).window = {} as Window & typeof globalThis;

      expect(() => {
        getServerConfig();
      }).toThrow('getServerConfig() was called in browser context');

      // Restore
      global.window = originalWindow;
    });

    it('should return server configuration in server context', () => {
      // Ensure we're in server context (no window)
      const originalWindow = global.window;
      delete (global as { window?: unknown }).window;

      const config = getServerConfig();
      
      expect(config).toHaveProperty('supabase');
      expect(config).toHaveProperty('database');
      expect(config.supabase).toHaveProperty('serviceRoleKey');
      expect(config.database).toHaveProperty('url');

      // Restore
      global.window = originalWindow;
    });
  });
});
