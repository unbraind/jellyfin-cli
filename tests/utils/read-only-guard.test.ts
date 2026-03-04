import { describe, expect, it } from 'vitest';
import { Command } from 'commander';
import {
  buildReadOnlyError,
  getCommandPath,
  isCommandBlockedInReadOnly,
  isReadOnlyModeEnabled,
} from '../../src/utils/read-only-guard.js';

describe('read-only guard', () => {
  it('detects read-only mode from cli option', () => {
    expect(isReadOnlyModeEnabled(true, undefined)).toBe(true);
    expect(isReadOnlyModeEnabled(false, undefined)).toBe(false);
  });

  it('detects read-only mode from env values', () => {
    expect(isReadOnlyModeEnabled(false, '1')).toBe(true);
    expect(isReadOnlyModeEnabled(false, 'true')).toBe(true);
    expect(isReadOnlyModeEnabled(false, 'YES')).toBe(true);
    expect(isReadOnlyModeEnabled(false, 'on')).toBe(true);
    expect(isReadOnlyModeEnabled(false, '0')).toBe(false);
    expect(isReadOnlyModeEnabled(false, 'no')).toBe(false);
  });

  it('extracts command path from nested command chain', () => {
    const root = new Command('jellyfin-cli');
    const items = new Command('items');
    const refresh = new Command('refresh');

    root.addCommand(items);
    items.addCommand(refresh);

    expect(getCommandPath(refresh)).toBe('items refresh');
  });

  it('allows known read-only commands', () => {
    expect(isCommandBlockedInReadOnly('system info')).toBe(false);
    expect(isCommandBlockedInReadOnly('items list')).toBe(false);
    expect(isCommandBlockedInReadOnly('quickconnect check')).toBe(false);
    expect(isCommandBlockedInReadOnly('livetv channel')).toBe(false);
    expect(isCommandBlockedInReadOnly('setup status')).toBe(false);
    expect(isCommandBlockedInReadOnly('setup configuration')).toBe(false);
    expect(isCommandBlockedInReadOnly('setup startup')).toBe(false);
    expect(isCommandBlockedInReadOnly('syncplay groups')).toBe(false);
  });

  it('blocks common mutating command paths', () => {
    expect(isCommandBlockedInReadOnly('items refresh')).toBe(true);
    expect(isCommandBlockedInReadOnly('users delete')).toBe(true);
    expect(isCommandBlockedInReadOnly('setup')).toBe(true);
    expect(isCommandBlockedInReadOnly('tasks run')).toBe(true);
    expect(isCommandBlockedInReadOnly('tasks running')).toBe(true);
    expect(isCommandBlockedInReadOnly('syncplay join')).toBe(true);
    expect(isCommandBlockedInReadOnly('backup restore')).toBe(true);
    expect(isCommandBlockedInReadOnly('videos merge-versions')).toBe(true);
  });

  it('formats a toon-style read-only error payload', () => {
    const message = buildReadOnlyError('items refresh');

    expect(message).toContain('type: error');
    expect(message).toContain('command: items refresh');
    expect(message).toContain('Command blocked by read-only mode');
  });
});
