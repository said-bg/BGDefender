import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
import { AuthorService } from '../services/author.service';
import { CreateAuthorDto } from '../dto/create-author.dto';
import { UpdateAuthorDto } from '../dto/update-author.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { resolveLanguage } from '../../config/request-language';
import {
  buildSafeUploadedFilename,
  imageUploadExtensions,
  matchesDeclaredFileSignature,
  removeUploadedFile,
} from '../../security/upload-security.utils';

const authorPhotoUploadDirectory = join(
  process.cwd(),
  'uploads',
  'author-photos',
);

interface UploadedAuthorPhotoFile {
  path: string;
  filename: string;
  mimetype: string;
  originalname?: string;
}

type MulterUploadedFile = {
  mimetype: string;
  originalname: string;
};
type UploadRequest = Pick<Request, 'headers'>;
type FilenameCallback = (error: Error | null, filename: string) => void;
type DestinationCallback = (error: Error | null, destination: string) => void;
type FilterCallback = (error: Error | null, acceptFile: boolean) => void;

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Post('admin/upload-photo')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _request: UploadRequest,
          _file: MulterUploadedFile,
          callback: DestinationCallback,
        ) => {
          mkdirSync(authorPhotoUploadDirectory, { recursive: true });
          callback(null, authorPhotoUploadDirectory);
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
              'author-photo',
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
  uploadAuthorPhoto(
    @UploadedFile() file: UploadedAuthorPhotoFile | undefined,
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
          ? 'Tekijan kuvatiedosto vaaditaan'
          : 'An author photo file is required',
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
  async create(@Body() createAuthorDto: CreateAuthorDto) {
    return await this.authorService.create(createAuthorDto);
  }

  @Get()
  async findAll(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.authorService.findAll(
      parsedLimit,
      parsedOffset,
    );
    return { data, count };
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.authorService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ) {
    return await this.authorService.update(id, updateAuthorDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.authorService.delete(id);
  }
}
