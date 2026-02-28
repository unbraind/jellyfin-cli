import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { JellyfinApiClient, JellyfinApiError } from '../../src/api/client.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('JellyfinApiClient', () => {
  let client: JellyfinApiClient;

  beforeEach(() => {
    client = new JellyfinApiClient({
      serverUrl: 'http://localhost:8096',
      apiKey: 'test-api-key',
      userId: 'test-user-id',
    });
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should strip trailing slash from server URL', () => {
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096/' });
      expect(c.getBackendUrl()).toBe('http://localhost:8096');
    });

    it('should use default timeout', () => {
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096' });
      expect(c).toBeDefined();
    });

    it('should accept custom timeout', () => {
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096', timeout: 5000 });
      expect(c).toBeDefined();
    });
  });

  describe('getUserId', () => {
    it('should return the user ID', () => {
      expect(client.getUserId()).toBe('test-user-id');
    });
  });

  describe('setUserId', () => {
    it('should update the user ID', () => {
      client.setUserId('new-user-id');
      expect(client.getUserId()).toBe('new-user-id');
    });
  });

  describe('request', () => {
    it('should make a GET request with correct headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ test: 'data' }),
      });

      const result = await client.getPublicSystemInfo();
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8096/System/Info/Public',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-Emby-Token': 'test-api-key',
          }),
        })
      );
    });

    it('should handle 204 No Content response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await client.restartServer();
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should throw JellyfinApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(client.getPublicSystemInfo()).rejects.toThrow(JellyfinApiError);
    });

    it('should throw JellyfinApiError on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getPublicSystemInfo()).rejects.toThrow(JellyfinApiError);
    });
  });

  describe('getPublicSystemInfo', () => {
    it('should fetch public system info', async () => {
      const mockInfo = { ServerName: 'Test Server', Version: '10.8.0' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInfo),
      });

      const result = await client.getPublicSystemInfo();
      expect(result).toEqual(mockInfo);
    });
  });

  describe('getUsers', () => {
    it('should fetch all users', async () => {
      const mockUsers = [{ Id: '1', Name: 'User1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      const result = await client.getUsers();
      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should fetch user by ID', async () => {
      const mockUser = { Id: 'user-1', Name: 'User1' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await client.getUserById('user-1');
      expect(result).toEqual(mockUser);
    });
  });

  describe('getCurrentUser', () => {
    it('should throw error when no user ID is set', async () => {
      const c = new JellyfinApiClient({ serverUrl: 'http://localhost:8096' });
      await expect(c.getCurrentUser()).rejects.toThrow('No user ID set');
    });

    it('should fetch current user', async () => {
      const mockUser = { Id: 'test-user-id', Name: 'Test User' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const result = await client.getCurrentUser();
      expect(result).toEqual(mockUser);
    });
  });

  describe('getItems', () => {
    it('should fetch items with user ID', async () => {
      const mockItems = { Items: [], TotalRecordCount: 0 };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockItems),
      });

      const result = await client.getItems();
      expect(result).toEqual(mockItems);
    });
  });

  describe('getItem', () => {
    it('should fetch item by ID', async () => {
      const mockItem = { Id: 'item-1', Name: 'Test Item' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockItem),
      });

      const result = await client.getItem('item-1');
      expect(result).toEqual(mockItem);
    });
  });

  describe('getSessions', () => {
    it('should fetch all sessions', async () => {
      const mockSessions = [{ Id: 'session-1', UserName: 'User1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockSessions),
      });

      const result = await client.getSessions();
      expect(result).toEqual(mockSessions);
    });
  });

  describe('getLibraries', () => {
    it('should fetch all libraries', async () => {
      const mockLibraries = [{ Name: 'Movies', ItemId: 'lib-1' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLibraries),
      });

      const result = await client.getLibraries();
      expect(result).toEqual(mockLibraries);
    });
  });

  describe('getHealth', () => {
    it('should fetch health status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('Healthy'),
      });

      const result = await client.getHealth();
      expect(result).toBe('Healthy');
    });
  });
});

describe('JellyfinApiError', () => {
  it('should create error with message', () => {
    const error = new JellyfinApiError('Test error');
    expect(error.message).toBe('Test error');
    expect(error.name).toBe('JellyfinApiError');
  });

  it('should create error with status code', () => {
    const error = new JellyfinApiError('Test error', 404);
    expect(error.statusCode).toBe(404);
  });

  it('should create error with details', () => {
    const error = new JellyfinApiError('Test error', 404, { detail: 'Not found' });
    expect(error.details).toEqual({ detail: 'Not found' });
  });
});
