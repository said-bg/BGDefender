import {
  Body,
  Controller,
  Delete,
  BadRequestException,
  HttpStatus,
  Get,
  HttpCode,
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
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dto/create-course.dto';
import { UpdateCourseDto } from '../dto/update-course.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AdminOrCreatorRoleGuard } from '../../auth/guards/admin-or-creator-role.guard';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { diskStorage } from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import type { Request } from 'express';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { resolveLanguage } from '../../config/request-language';
import type { CourseManagementScope } from '../services/course.service';
import {
  buildSafeUploadedFilename,
  courseMediaUploadExtensions,
  imageUploadExtensions,
  matchesDeclaredFileSignature,
  removeUploadedFile,
} from '../../security/upload-security.utils';

const courseCoverUploadDirectory = join(
  process.cwd(),
  'uploads',
  'course-covers',
);
const courseContentMediaUploadDirectory = join(
  process.cwd(),
  'uploads',
  'course-content-media',
);

interface UploadedCoverFile {
  path: string;
  filename: string;
  mimetype: string;
  originalname?: string;
}

interface UploadedMediaFile {
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

const resolveCourseManagementScope = (
  scope: string | undefined,
): CourseManagementScope =>
  scope === 'review' || scope === 'all' ? 'review' : 'mine';

const clampPaginationValue = (
  rawValue: string | undefined,
  fallback: number,
  max: number,
): number => {
  const parsedValue = Number.parseInt(rawValue ?? '', 10);

  if (Number.isNaN(parsedValue)) {
    return fallback;
  }

  return Math.min(Math.max(parsedValue, 0), max);
};

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post('admin/upload-cover')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _request: UploadRequest,
          _file: MulterUploadedFile,
          callback: DestinationCallback,
        ) => {
          mkdirSync(courseCoverUploadDirectory, { recursive: true });
          callback(null, courseCoverUploadDirectory);
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
              'course-cover',
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
  uploadCourseCover(
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
          ? 'Kansikuvatiedosto vaaditaan'
          : 'A cover image file is required',
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

  @Post('admin/upload-media')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _request: UploadRequest,
          _file: MulterUploadedFile,
          callback: DestinationCallback,
        ) => {
          mkdirSync(courseContentMediaUploadDirectory, { recursive: true });
          callback(null, courseContentMediaUploadDirectory);
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
              'course-media',
              file.mimetype,
              courseMediaUploadExtensions,
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
        const isAllowedFile =
          /^image\/(jpeg|jpg|png|webp|gif)$/i.test(file.mimetype) ||
          /^video\/(mp4|webm|ogg|quicktime)$/i.test(file.mimetype) ||
          file.mimetype === 'application/pdf';

        if (!isAllowedFile) {
          callback(
            new BadRequestException(
              language === 'fi'
                ? 'Vain kuva-, MP4-, WEBM-, OGG-, MOV- tai PDF-tiedostot ovat sallittuja'
                : 'Only image, MP4, WEBM, OGG, MOV, or PDF files are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024,
      },
    }),
  )
  uploadCourseContentMedia(
    @UploadedFile() file: UploadedMediaFile | undefined,
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
          ? 'Mediatiedosto vaaditaan'
          : 'A media file is required',
      );
    }

    if (!matchesDeclaredFileSignature(file.path, file.mimetype)) {
      removeUploadedFile(file.path);
      throw new BadRequestException(
        language === 'fi'
          ? 'Ladatun mediatiedoston sisältö ei vastaa sallittua tiedostomuotoa'
          : 'Uploaded media content does not match an allowed file format',
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

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async getAdminSummary(
    @Query('scope') scope: string | undefined,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return await this.courseService.getAdminSummary(
      currentUser,
      resolveCourseManagementScope(scope),
    );
  }

  @Get('admin/learning-summary')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async getLearningSummary(
    @Query('scope') scope: string | undefined,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return await this.courseService.getLearningSummary(
      currentUser,
      resolveCourseManagementScope(scope),
    );
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async findAllForAdmin(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
    @Query('scope') scope: string | undefined,
    @CurrentUser() currentUser: SafeUser,
  ) {
    const parsedLimit = clampPaginationValue(limit, 20, 100);
    const parsedOffset = clampPaginationValue(offset, 0, 10_000);
    const [data, count] = await this.courseService.findAllForAdmin(
      parsedLimit,
      parsedOffset,
      currentUser,
      resolveCourseManagementScope(scope),
    );
    return { data, count };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async findByIdForAdmin(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return await this.courseService.findByIdForAdmin(id, currentUser);
  }

  @Get('admin/:id/authors')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async findManageableAuthors(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    const data = await this.courseService.findManageableAuthors(id, currentUser);
    return {
      data,
      count: data.length,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return await this.courseService.create(createCourseDto, currentUser);
  }

  @Get()
  async findAll(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = clampPaginationValue(limit, 10, 100);
    const parsedOffset = clampPaginationValue(offset, 0, 10_000);
    const [data, count] = await this.courseService.findAll(
      parsedLimit,
      parsedOffset,
    );
    return { data, count };
  }

  @Get(':identifier')
  async findById(@Param('identifier') identifier: string) {
    return await this.courseService.findById(identifier);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() currentUser: SafeUser,
  ) {
    return await this.courseService.update(id, updateCourseDto, currentUser);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminOrCreatorRoleGuard)
  @HttpCode(204)
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
  ) {
    await this.courseService.delete(id, currentUser);
  }
}
