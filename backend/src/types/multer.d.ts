declare module 'multer' {
  import type { Request } from 'express';

  export type FileFilterCallback = (
    error: Error | null,
    acceptFile: boolean,
  ) => void;

  export type DiskStorageCallback = (
    error: Error | null,
    destination: string,
  ) => void;

  export type MulterFile = {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size?: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
  };

  export type DiskStorageOptions = {
    destination?: (
      request: Request,
      file: MulterFile,
      callback: DiskStorageCallback,
    ) => void;
    filename?: (
      request: Request,
      file: MulterFile,
      callback: DiskStorageCallback,
    ) => void;
  };

  export type StorageEngine = {
    _handleFile: (
      request: Request,
      file: MulterFile,
      callback: (error?: Error | null, info?: Partial<MulterFile>) => void,
    ) => void;
    _removeFile: (
      request: Request,
      file: MulterFile,
      callback: (error: Error | null) => void,
    ) => void;
  };

  export function diskStorage(options: DiskStorageOptions): StorageEngine;
}
