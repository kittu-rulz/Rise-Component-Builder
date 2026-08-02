import { describe, expect, test } from 'vitest';
import { formatExportedFileSize, getExportedFileSize } from '../../js/export.js';

describe('export file size reporting', () => {
  test('getExportedFileSize reports the UTF-8 byte length', () => {
    expect(getExportedFileSize('abcd')).toBe(4);
    expect(getExportedFileSize('')).toBe(0);
    // Multi-byte characters must count their real byte length, not character length.
    expect(getExportedFileSize('café')).toBe(5);
  });

  test('formatExportedFileSize renders bytes, kilobytes, and megabytes', () => {
    expect(formatExportedFileSize(0)).toBe('0 B');
    expect(formatExportedFileSize(512)).toBe('512 B');
    expect(formatExportedFileSize(1536)).toBe('1.5 KB');
    expect(formatExportedFileSize(13398)).toBe('13.1 KB');
    expect(formatExportedFileSize(2 * 1024 * 1024)).toBe('2.00 MB');
  });

  test('formatExportedFileSize handles invalid input gracefully', () => {
    expect(formatExportedFileSize(-1)).toBe('Unknown size');
    expect(formatExportedFileSize(NaN)).toBe('Unknown size');
    expect(formatExportedFileSize(undefined)).toBe('Unknown size');
  });
});
