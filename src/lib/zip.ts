/**
 * Professional ZIP extraction pipeline — adapted from reference project.
 *
 * Design goals:
 *  - Non-blocking: uses fflate's async unzip so large archives never freeze UI.
 *  - Safe: detects archives by magic bytes and sanitizes paths (CWE-22).
 *  - Bounded: enforces size/entry limits to refuse decompression-bombs.
 *  - Correct: classifies each entry as text or binary.
 */
import { unzip } from 'fflate';

export interface StoredFile {
  path: string;
  name: string;
  content: string;
  isBinary: boolean;
  size: number;
  mime: string;
}

export const ZIP_LIMITS = {
  maxCompressedBytes: 200 * 1024 * 1024,
  maxEntries: 20000,
  maxTotalUncompressed: 1024 * 1024 * 1024,
  maxFileBytes: 50 * 1024 * 1024,
} as const;

export class ExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExtractionError';
  }
}

const ZIP_SIGNATURES: ReadonlyArray<readonly [number, number, number, number]> = [
  [0x50, 0x4b, 0x03, 0x04],
  [0x50, 0x4b, 0x05, 0x06],
  [0x50, 0x4b, 0x07, 0x08],
];

export function isZipBytes(bytes: Uint8Array): boolean {
  if (bytes.length < 4) return false;
  for (const sig of ZIP_SIGNATURES) {
    if (bytes[0] === sig[0] && bytes[1] === sig[1] && bytes[2] === sig[2] && bytes[3] === sig[3]) {
      return true;
    }
  }
  return false;
}

export function sanitizeEntryPath(raw: string): string | null {
  if (typeof raw !== 'string' || raw.length === 0) return null;
  const normalized = raw.replace(/\\/g, '/').replace(/[\u0000\r\t]/g, '');
  if (normalized.startsWith('/') || /^[a-z]:/i.test(normalized)) return null;

  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    const clean = segment.trim();
    if (clean === '' || clean === '.') continue;
    if (clean === '..') return null;
    if (/[<>:"|?*]/.test(clean)) return null;
    segments.push(clean);
  }

  if (segments.length === 0) return null;
  return segments.join('/');
}

const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'bmp', 'ico', 'tiff',
  'mp3', 'mp4', 'webm', 'mov', 'wav', 'ogg', 'flac', 'aac', 'm4a',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'pdf', 'zip', 'rar', '7z', 'gz', 'tar', 'bz2', 'xz',
  'exe', 'dll', 'so', 'dylib', 'bin', 'class', 'jar', 'wasm',
  'psd', 'ai', 'sketch', 'dat',
]);

const MIME_MAP: Record<string, string> = {
  html: 'text/html', htm: 'text/html', css: 'text/css',
  js: 'text/javascript', mjs: 'text/javascript', cjs: 'text/javascript',
  jsx: 'text/javascript', ts: 'text/typescript', tsx: 'text/typescript',
  json: 'application/json', md: 'text/markdown', txt: 'text/plain',
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp',
};

function extOf(name: string): string {
  const dot = name.lastIndexOf('.');
  if (dot < 0 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

function hasBinaryExtension(name: string): boolean {
  return BINARY_EXTENSIONS.has(extOf(name));
}

function looksBinary(bytes: Uint8Array): boolean {
  const sample = bytes.length > 8192 ? bytes.subarray(0, 8192) : bytes;
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) return true;
  }
  return false;
}

function decodeText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function mimeFor(name: string): string {
  return MIME_MAP[extOf(name)] || 'application/octet-stream';
}

export function toStoredFile(path: string, bytes: Uint8Array): StoredFile {
  const name = path.split('/').pop() || path;
  const decoded = decodeText(bytes);
  const isBinary = hasBinaryExtension(name) || decoded === null || looksBinary(bytes);
  return {
    path,
    name,
    content: isBinary ? '// ملف ثنائي — لا يمكن عرضه كنص' : (decoded || ''),
    isBinary,
    size: bytes.length,
    mime: mimeFor(name),
  };
}

function extractRaw(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  return new Promise((resolve, reject) => {
    try {
      unzip(bytes, (err, data) => {
        if (err) {
          reject(new ExtractionError('الأرشيف تالف أو بصيغة غير مدعومة.'));
          return;
        }
        resolve(data);
      });
    } catch {
      reject(new ExtractionError('تعذّر قراءة الأرشيف المضغوط.'));
    }
  });
}

export interface ExtractOutcome {
  files: StoredFile[];
  skipped: number;
}

export async function extractZipArchive(bytes: Uint8Array): Promise<ExtractOutcome> {
  if (bytes.length > ZIP_LIMITS.maxCompressedBytes) {
    throw new ExtractionError('حجم الملف المضغوط يتجاوز الحد المسموح به (200 ميجابايت).');
  }

  const raw = await extractRaw(bytes);
  const keys = Object.keys(raw);

  if (keys.length > ZIP_LIMITS.maxEntries) {
    throw new ExtractionError(`الأرشيف يحتوي على عدد هائل من العناصر (${keys.length}) ويُرجَّح أنه غير آمن.`);
  }

  const files: StoredFile[] = [];
  let skipped = 0;
  let totalUncompressed = 0;

  for (const rawPath of keys) {
    const isDirMarker = rawPath.endsWith('/');
    const cleanPath = sanitizeEntryPath(rawPath);

    if (!cleanPath) {
      skipped += 1;
      continue;
    }
    if (isDirMarker) continue;

    const data = raw[rawPath];
    if (!data) { skipped += 1; continue; }
    if (data.length > ZIP_LIMITS.maxFileBytes) { skipped += 1; continue; }

    totalUncompressed += data.length;
    if (totalUncompressed > ZIP_LIMITS.maxTotalUncompressed) {
      throw new ExtractionError('الحجم غير المضغوط للأرشيف يتجاوز الحد الآمن (1 جيجابايت).');
    }

    files.push(toStoredFile(cleanPath, data));
  }

  if (files.length === 0) {
    throw new ExtractionError('الأرشيف فارغ أو لا يحتوي على ملفات صالحة.');
  }

  return { files, skipped };
}

export function ancestors(path: string): string[] {
  const parts = path.split('/');
  const result: string[] = [];
  let acc = '';
  for (let i = 0; i < parts.length - 1; i++) {
    acc = acc ? `${acc}/${parts[i]}` : parts[i];
    result.push(acc);
  }
  return result;
}
