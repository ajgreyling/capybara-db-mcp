import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getEditorCommand,
  setEditorCommand,
  setEditorExplicitly,
  isEditorExplicitlySet,
  detectEditorFromClientName,
} from '../editor-command.js';

describe('editor-command', () => {
  beforeEach(() => {
    setEditorCommand('cursor');
    setEditorExplicitly(false);
  });

  describe('getEditorCommand / setEditorCommand', () => {
    it('should default to cursor', () => {
      setEditorCommand('cursor');
      expect(getEditorCommand()).toBe('cursor');
    });

    it('should return set value', () => {
      setEditorCommand('code');
      expect(getEditorCommand()).toBe('code');
    });
  });

  describe('isEditorExplicitlySet / setEditorExplicitly', () => {
    it('should return false by default', () => {
      expect(isEditorExplicitlySet()).toBe(false);
    });

    it('should return true when explicitly set', () => {
      setEditorExplicitly(true);
      expect(isEditorExplicitlySet()).toBe(true);
    });
  });

  describe('detectEditorFromClientName', () => {
    it('should map cursor to cursor', () => {
      expect(detectEditorFromClientName('cursor')).toBe('cursor');
      expect(detectEditorFromClientName('Cursor')).toBe('cursor');
      expect(detectEditorFromClientName('cursor-mcp-client')).toBe('cursor');
    });

    it('should map vscode to code', () => {
      expect(detectEditorFromClientName('vscode')).toBe('code');
      expect(detectEditorFromClientName('VS Code')).toBe('code');
      expect(detectEditorFromClientName('Visual Studio Code')).toBe('code');
    });

    it('should return null for unknown clients', () => {
      expect(detectEditorFromClientName('claude-desktop')).toBeNull();
      expect(detectEditorFromClientName('unknown')).toBeNull();
      expect(detectEditorFromClientName('')).toBeNull();
    });
  });
});
