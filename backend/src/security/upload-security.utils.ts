import { openSync, readSync, closeSync, rmSync } from 'fs';

export const imageUploadExtensions: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const courseMediaUploadExtensions: Record<string, string> = {
  ...imageUploadExtensions,
  'image/gif': '.gif',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/ogg': '.ogg',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
};

export const resourceUploadExtensions: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    '.pptx',
  'text/plain': '.txt',
  'text/csv': '.csv',
};

export const safeAssetUrlPattern =
  /^(https:\/\/[^\s]+|http:\/\/(localhost|127\.0\.0\.1|::1)(:\d+)?\/uploads\/[^\s]+|\/uploads\/[^\s]+|\/assets\/images\/[^\s]+)$/i;

export const sanitizeFilename = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export function buildSafeUploadedFilename(
  originalname: string,
  fallbackName: string,
  mimetype: string,
  extensionMap: Record<string, string>,
) {
  const baseName = sanitizeFilename(
    originalname.replace(/\.[^/.]+$/, '') || fallbackName,
  );
  const extension = extensionMap[mimetype] ?? '';
  const timestamp = Date.now();

  return `${baseName || fallbackName}-${timestamp}${extension}`;
}

export function removeUploadedFile(filePath: string) {
  try {
    rmSync(filePath, { force: true });
  } catch {
    // Ignore cleanup failures so we can still report the original upload error.
  }
}

function readFileHeader(filePath: string, length = 64) {
  const descriptor = openSync(filePath, 'r');

  try {
    const buffer = Buffer.alloc(length);
    const bytesRead = readSync(descriptor, buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    closeSync(descriptor);
  }
}

function startsWithBytes(buffer: Buffer, bytes: number[]) {
  return bytes.every((byte, index) => buffer[index] === byte);
}

function includesAscii(buffer: Buffer, value: string) {
  return buffer.includes(Buffer.from(value, 'ascii'));
}

export function matchesDeclaredFileSignature(
  filePath: string,
  mimetype: string,
) {
  const header = readFileHeader(filePath);

  switch (mimetype) {
    case 'image/jpeg':
    case 'image/jpg':
      return startsWithBytes(header, [0xff, 0xd8, 0xff]);
    case 'image/png':
      return startsWithBytes(
        header,
        [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
      );
    case 'image/webp':
      return (
        header.subarray(0, 4).toString('ascii') === 'RIFF' &&
        header.subarray(8, 12).toString('ascii') === 'WEBP'
      );
    case 'image/gif':
      return (
        header.subarray(0, 6).toString('ascii') === 'GIF87a' ||
        header.subarray(0, 6).toString('ascii') === 'GIF89a'
      );
    case 'application/pdf':
      return header.subarray(0, 5).toString('ascii') === '%PDF-';
    case 'video/mp4':
      return (
        header.subarray(4, 8).toString('ascii') === 'ftyp' &&
        header.subarray(8, 12).toString('ascii') !== 'qt  '
      );
    case 'video/quicktime':
      return (
        header.subarray(4, 8).toString('ascii') === 'ftyp' &&
        header.subarray(8, 12).toString('ascii') === 'qt  '
      );
    case 'video/webm':
      return (
        startsWithBytes(header, [0x1a, 0x45, 0xdf, 0xa3]) &&
        includesAscii(header, 'webm')
      );
    case 'video/ogg':
      return header.subarray(0, 4).toString('ascii') === 'OggS';
    default:
      return false;
  }
}
