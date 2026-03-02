import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function mockOk(data: unknown, status = 200) {
  return {
    ok: true, status, statusText: 'OK',
    headers: { get: (n: string) => n === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(status === 204 ? '' : JSON.stringify(data)),
  };
}
function mockText(text: string, status = 200) {
  return {
    ok: true, status, statusText: 'OK',
    headers: { get: (n: string) => n === 'content-type' ? 'text/plain' : null },
    json: () => Promise.resolve(text),
    text: () => Promise.resolve(text),
  };
}
function mockNoContent() {
  return { ok: true, status: 204, statusText: 'No Content', headers: { get: () => null }, text: () => Promise.resolve('') };
}

describe('JellyfinApiClient - New Features v11 (Branding & System Config)', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', apiKey: 'test-key', userId: 'user-1' });
    mockFetch.mockReset();
  });
  afterEach(() => { vi.clearAllMocks(); });

  // -----------------------------------------------------------------------
  // getBrandingCss
  // -----------------------------------------------------------------------
  describe('getBrandingCss', () => {
    it('calls GET /Branding/Css', async () => {
      mockFetch.mockResolvedValueOnce(mockText('body { color: red; }'));
      await client.getBrandingCss();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Branding/Css');
      expect(mockFetch.mock.calls[0][1]).toMatchObject({ method: 'GET' });
    });

    it('returns CSS string', async () => {
      const css = 'body { background: #111; color: #fff; }';
      mockFetch.mockResolvedValueOnce(mockText(css));
      const result = await client.getBrandingCss();
      expect(result).toBe(css);
    });

    it('handles empty CSS response (returns undefined)', async () => {
      mockFetch.mockResolvedValueOnce(mockText(''));
      const result = await client.getBrandingCss();
      // Empty response body returns undefined (base client skips empty text)
      expect(result == null || result === '').toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // getSplashscreenUrl
  // -----------------------------------------------------------------------
  describe('getSplashscreenUrl', () => {
    it('returns URL without making a fetch call', async () => {
      const url = await client.getSplashscreenUrl();
      expect(url).toBe('http://localhost:8096/Branding/Splashscreen');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('includes base URL', async () => {
      const c2 = new JellyfinApiClient({ serverUrl: 'https://jellyfin.example.com', apiKey: 'k' });
      const url = await c2.getSplashscreenUrl();
      expect(url).toContain('jellyfin.example.com');
      expect(url).toContain('/Branding/Splashscreen');
    });
  });

  // -----------------------------------------------------------------------
  // deleteSplashscreen
  // -----------------------------------------------------------------------
  describe('deleteSplashscreen', () => {
    it('calls DELETE /Branding/Splashscreen', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.deleteSplashscreen();
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/Branding/Splashscreen');
      expect(opts).toMatchObject({ method: 'DELETE' });
    });

    it('resolves without data', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const result = await client.deleteSplashscreen();
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // updateBrandingConfiguration
  // -----------------------------------------------------------------------
  describe('updateBrandingConfiguration', () => {
    it('calls POST /System/Configuration/Branding', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateBrandingConfiguration({ LoginDisclaimer: 'Test disclaimer' });
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/System/Configuration/Branding');
      expect(opts).toMatchObject({ method: 'POST' });
    });

    it('sends LoginDisclaimer in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateBrandingConfiguration({ LoginDisclaimer: 'Please read terms' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.LoginDisclaimer).toBe('Please read terms');
    });

    it('sends CustomCss in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateBrandingConfiguration({ CustomCss: 'body { margin: 0; }' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.CustomCss).toBe('body { margin: 0; }');
    });

    it('sends SplashscreenEnabled flag', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateBrandingConfiguration({ SplashscreenEnabled: true });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.SplashscreenEnabled).toBe(true);
    });

    it('resolves without data', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const result = await client.updateBrandingConfiguration({});
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // updateServerConfiguration (existing, ensure still works)
  // -----------------------------------------------------------------------
  describe('updateServerConfiguration', () => {
    it('calls POST /System/Configuration', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateServerConfiguration({ EnableCaseSensitiveItemIds: true } as Record<string, unknown>);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/System/Configuration');
      expect(opts).toMatchObject({ method: 'POST' });
    });

    it('sends config in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateServerConfiguration({ IsStartupWizardCompleted: false } as Record<string, unknown>);
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.IsStartupWizardCompleted).toBe(false);
    });

    it('resolves without data', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const result = await client.updateServerConfiguration({});
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // updateNamedConfiguration (existing, ensure still works)
  // -----------------------------------------------------------------------
  describe('updateNamedConfiguration', () => {
    it('calls POST /System/Configuration/{key}', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateNamedConfiguration('network', { EnableUpnP: false });
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain('/System/Configuration/network');
      expect(opts).toMatchObject({ method: 'POST' });
    });

    it('sends data in body', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateNamedConfiguration('encoding', { HardwareAccelerationType: 'nvenc' });
      const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(body.HardwareAccelerationType).toBe('nvenc');
    });

    it('supports arbitrary key names', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      await client.updateNamedConfiguration('myCustomSection', { key: 'value' });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/System/Configuration/myCustomSection');
    });

    it('resolves without data', async () => {
      mockFetch.mockResolvedValueOnce(mockNoContent());
      const result = await client.updateNamedConfiguration('test', {});
      expect(result).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // getBranding (ensure existing method still works)
  // -----------------------------------------------------------------------
  describe('getBranding', () => {
    it('calls GET /Branding/Configuration', async () => {
      mockFetch.mockResolvedValueOnce(mockOk({ LoginDisclaimer: 'Welcome' }));
      await client.getBranding();
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain('/Branding/Configuration');
    });

    it('returns branding options', async () => {
      const branding = { LoginDisclaimer: 'Test server', CustomCss: null, SplashscreenEnabled: false };
      mockFetch.mockResolvedValueOnce(mockOk(branding));
      const result = await client.getBranding();
      expect(result.LoginDisclaimer).toBe('Test server');
      expect(result.SplashscreenEnabled).toBe(false);
    });
  });
});
