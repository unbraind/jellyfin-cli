import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ImagesApi } from '../../src/api/images.js';
import { PackagesApi } from '../../src/api/packages.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

function createMockResponse(data: unknown, options: { ok?: boolean; status?: number } = {}) {
  const { ok = true, status = 200 } = options;
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: { get: (n: string) => n === 'content-type' ? 'application/json' : null },
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(typeof data === 'string' ? data : JSON.stringify(data)),
  };
}

describe('ImagesApi', () => {
  let api: ImagesApi;

  beforeEach(() => {
    api = new ImagesApi({ serverUrl: 'http://localhost:8096', apiKey: 'test-key' });
    mockFetch.mockReset();
  });

  describe('getItemImages', () => {
    it('should return item images array', async () => {
      const mockImages = [{ Type: 'Primary', Width: 1920, Height: 1080 }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockImages));
      const result = await api.getItemImages('item-1');
      expect(result).toEqual(mockImages);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Items/item-1/Images',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should handle empty image list', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));
      const result = await api.getItemImages('item-empty');
      expect(result).toEqual([]);
    });
  });

  describe('getItemImage (URL builder)', () => {
    it('should build basic item image URL', () => {
      const url = api.getItemImage('item-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Items/item-1/Images/Primary');
    });

    it('should build item image URL with params', () => {
      const url = api.getItemImage('item-1', 'Backdrop', { maxWidth: 1920, maxHeight: 1080, quality: 90 });
      expect(url).toContain('/Items/item-1/Images/Backdrop');
      expect(url).toContain('maxWidth=1920');
      expect(url).toContain('maxHeight=1080');
      expect(url).toContain('quality=90');
    });

    it('should skip undefined params', () => {
      const url = api.getItemImage('item-1', 'Primary', { maxWidth: undefined, quality: 80 });
      expect(url).not.toContain('maxWidth');
      expect(url).toContain('quality=80');
    });

    it('should handle imageIndex param', () => {
      const url = api.getItemImage('item-1', 'Backdrop', { imageIndex: 1 });
      expect(url).toContain('imageIndex=1');
    });
  });

  describe('deleteItemImage', () => {
    it('should delete item image without index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.deleteItemImage('item-1', 'Primary');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Items/item-1/Images/Primary',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should delete item image with index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.deleteItemImage('item-1', 'Backdrop', 2);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Items/item-1/Images/Backdrop/2',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('setItemImageIndex', () => {
    it('should set item image index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.setItemImageIndex('item-1', 'Backdrop', 0, 1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Items/item-1/Images/Backdrop/0/Index'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('deleteUserImage', () => {
    it('should delete user image without index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.deleteUserImage('user-1', 'Primary');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Users/user-1/Images/Primary',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should delete user image with index', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.deleteUserImage('user-1', 'Primary', 0);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Users/user-1/Images/Primary/0',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('URL builder methods', () => {
    it('should build artist image URL without params', () => {
      const url = api.getArtistImage('artist-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Artists/artist-1/Images/Primary');
    });

    it('should build artist image URL with params', () => {
      const url = api.getArtistImage('artist-1', 'Primary', { maxWidth: 500 });
      expect(url).toContain('/Artists/artist-1/Images/Primary');
      expect(url).toContain('maxWidth=500');
    });

    it('should build genre image URL', () => {
      const url = api.getGenreImage('genre-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Genres/genre-1/Images/Primary');
    });

    it('should build genre image URL with params', () => {
      const url = api.getGenreImage('genre-1', 'Primary', { maxHeight: 300, tag: 'abc123' });
      expect(url).toContain('/Genres/genre-1/Images/Primary');
      expect(url).toContain('maxHeight=300');
      expect(url).toContain('tag=abc123');
    });

    it('should build music genre image URL', () => {
      const url = api.getMusicGenreImage('mg-1', 'Primary');
      expect(url).toBe('http://localhost:8096/MusicGenres/mg-1/Images/Primary');
    });

    it('should build music genre image URL with params', () => {
      const url = api.getMusicGenreImage('mg-1', 'Backdrop', { maxWidth: 1280 });
      expect(url).toContain('maxWidth=1280');
    });

    it('should build person image URL', () => {
      const url = api.getPersonImage('person-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Persons/person-1/Images/Primary');
    });

    it('should build person image URL with params', () => {
      const url = api.getPersonImage('person-1', 'Primary', { maxWidth: 400, maxHeight: 600 });
      expect(url).toContain('maxWidth=400');
      expect(url).toContain('maxHeight=600');
    });

    it('should build studio image URL', () => {
      const url = api.getStudioImage('studio-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Studios/studio-1/Images/Primary');
    });

    it('should build studio image URL with params', () => {
      const url = api.getStudioImage('studio-1', 'Logo', { tag: 'xyztag' });
      expect(url).toContain('tag=xyztag');
    });

    it('should build user image URL', () => {
      const url = api.getUserImage('user-1', 'Primary');
      expect(url).toBe('http://localhost:8096/Users/user-1/Images/Primary');
    });

    it('should build user image URL with params', () => {
      const url = api.getUserImage('user-1', 'Primary', { maxWidth: 200, imageIndex: 0 });
      expect(url).toContain('maxWidth=200');
      expect(url).toContain('imageIndex=0');
    });
  });

  describe('uploadItemImage', () => {
    it('should upload item image successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const data = new Blob(['fake-image-data'], { type: 'image/jpeg' });
      await api.uploadItemImage('item-1', 'Primary', data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Items/item-1/Images'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw on upload failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 });
      const data = new Blob(['bad-data'], { type: 'image/jpeg' });
      await expect(api.uploadItemImage('item-1', 'Primary', data)).rejects.toThrow('Failed to upload image: 400');
    });
  });

  describe('uploadUserImage', () => {
    it('should upload user image successfully', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const data = new Blob(['fake-image'], { type: 'image/jpeg' });
      await api.uploadUserImage('user-1', 'Primary', data);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Users/user-1/Images/Primary'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should throw on user image upload failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const data = new Blob(['bad-data']);
      await expect(api.uploadUserImage('user-1', 'Primary', data)).rejects.toThrow('Failed to upload user image: 500');
    });
  });
});

describe('PackagesApi', () => {
  let api: PackagesApi;

  beforeEach(() => {
    api = new PackagesApi({ serverUrl: 'http://localhost:8096', apiKey: 'test-key' });
    mockFetch.mockReset();
  });

  describe('getPackages', () => {
    it('should return packages list', async () => {
      const mockPackages = [{ name: 'TestPlugin', description: 'A test plugin' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPackages));
      const result = await api.getPackages();
      expect(result).toEqual(mockPackages);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Packages',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('getPackageInfo', () => {
    it('should return single package info', async () => {
      const mockPkg = { name: 'TestPlugin', guid: 'abc-123', versions: [] };
      mockFetch.mockResolvedValueOnce(createMockResponse(mockPkg));
      const result = await api.getPackageInfo('TestPlugin');
      expect(result.name).toBe('TestPlugin');
    });
  });

  describe('installPackage', () => {
    it('should install a package', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.installPackage('TestPlugin', '1.0.0', 'https://repo.example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/Packages/Installed/TestPlugin'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should install a package without version or repository', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.installPackage('TestPlugin');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelPackageInstallation', () => {
    it('should cancel package installation', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      await api.cancelPackageInstallation('install-1');
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Packages/Installing/install-1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('getRepositories', () => {
    it('should return repositories list', async () => {
      const mockRepos = [{ Name: 'Official', Url: 'https://repo.jellyfin.org' }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockRepos));
      const result = await api.getRepositories();
      expect(result).toEqual(mockRepos);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Repositories',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });

  describe('setRepositories', () => {
    it('should set repositories', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 204, headers: { get: () => null }, text: () => Promise.resolve('') });
      const repos = [{ Name: 'Custom', Url: 'https://custom.example.com' }];
      await api.setRepositories(repos);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Repositories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(repos),
        })
      );
    });
  });

  describe('getInstallingPackages', () => {
    it('should return installing packages', async () => {
      const mockInstalling = [{ Name: 'TestPlugin', Status: 'Downloading', Progress: 45 }];
      mockFetch.mockResolvedValueOnce(createMockResponse(mockInstalling));
      const result = await api.getInstallingPackages();
      expect(result).toEqual(mockInstalling);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/Packages/Installing',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should return empty array when no packages installing', async () => {
      mockFetch.mockResolvedValueOnce(createMockResponse([]));
      const result = await api.getInstallingPackages();
      expect(result).toEqual([]);
    });
  });
});
