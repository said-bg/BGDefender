import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import type { Request } from 'express';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { resolveLanguage } from '../../config/request-language';
import {
  buildSafeUploadedFilename,
  imageUploadExtensions,
  matchesDeclaredFileSignature,
  removeUploadedFile,
} from '../../security/upload-security.utils';
import { CollectionsService } from '../services/collections.service';
import { CreateCourseCollectionDto } from '../dto/create-course-collection.dto';
import { UpdateCourseCollectionDto } from '../dto/update-course-collection.dto';

const collectionCoverUploadDirectory = join(
  process.cwd(),
  'uploads',
  'collection-covers',
);

type MulterUploadedFile = {
  mimetype: string;
  originalname: string;
};

type UploadRequest = Pick<Request, 'headers'>;
type FilenameCallback = (error: Error | null, filename: string) => void;
type DestinationCallback = (error: Error | null, destination: string) => void;
type FilterCallback = (error: Error | null, acceptFile: boolean) => void;

interface UploadedCoverFile {
  path: string;
  filename: string;
  mimetype: string;
}

@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get()
  async listPublishedCollections() {
    return this.collectionsService.listPublishedCollections();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async listAdminCollections() {
    return this.collectionsService.listAdminCollections();
  }

  @Post('admin/upload-cover')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _request: UploadRequest,
          _file: MulterUploadedFile,
          callback: DestinationCallback,
        ) => {
          mkdirSync(collectionCoverUploadDirectory, { recursive: true });
          callback(null, collectionCoverUploadDirectory);
        },
        filename: (
          _request: UploadRequest,
          file: MulterUploadedFile,
          callback: FilenameCallback,
        ) => {
          callback(
            null,
            buildSafeUploadedFilename(
              file.originalname,
              'collection-cover',
              file.mimetype,
              imageUploadExtensions,
            ),
          );
        },
      }),
      fileFilter: (
        _request: UploadRequest,
        file: MulterUploadedFile,
        callback: FilterCallback,
      ) => {
        const language = resolveLanguage(
          typeof _request.headers['accept-language'] === 'string'
            ? _request.headers['accept-language']
            : undefined,
        );
        const isImage = /^image\/(jpeg|jpg|png|webp)$/i.test(file.mimetype);

        if (!isImage) {
          callback(
            new BadRequestException(
              language === 'fi'
                ? 'Vain JPG-, PNG- tai WEBP-tiedostot ovat sallittuja'
                : 'Only JPG, PNG, or WEBP files are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadCollectionCover(
    @UploadedFile() file: UploadedCoverFile | undefined,
    @Req() request: Request,
  ) {
    const language = resolveLanguage(
      typeof request.headers['accept-language'] === 'string'
        ? request.headers['accept-language']
        : undefined,
    );

    if (!file) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Kokoelman kansikuvatiedosto vaaditaan'
          : 'A collection cover image file is required',
      );
    }

    if (!matchesDeclaredFileSignature(file.path, file.mimetype)) {
      removeUploadedFile(file.path);
      throw new BadRequestException(
        language === 'fi'
          ? 'Ladatun kuvan sisältö ei vastaa sallittua tiedostomuotoa'
          : 'Uploaded image content does not match an allowed file format',
      );
    }

    const protocol = request.protocol;
    const host = request.get('host');
    const normalizedPath = file.path.split('\\').join('/');
    const publicPath = normalizedPath.split('/uploads/')[1];

    if (!host || !publicPath) {
      throw new BadRequestException(
        language === 'fi'
          ? 'Ladattua tiedostoa ei voitu muuntaa URL-osoitteeksi'
          : 'Failed to resolve uploaded file URL',
      );
    }

    return {
      statusCode: HttpStatus.CREATED,
      url: `${protocol}://${host}/uploads/${publicPath}`,
      filename: file.filename,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async create(@Body() dto: CreateCourseCollectionDto) {
    return this.collectionsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateCourseCollectionDto,
  ) {
    return this.collectionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.collectionsService.delete(id);
  }
}
