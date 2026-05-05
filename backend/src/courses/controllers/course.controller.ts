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
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import { diskStorage } from 'multer';
import { join } from 'path';
import { mkdirSync } from 'fs';
import type { Request } from 'express';
import { resolveLanguage } from '../../config/request-language';
import {
  buildSafeUploadedFilename,
  courseMediaUploadExtensions,
  imageUploadExtensions,
  matchesDeclaredFileSignature,
  removeUploadedFile,
} from '../../uploads/upload-security.utils';

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

@Controller('courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

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
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
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
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async getAdminSummary() {
    return await this.courseService.getAdminSummary();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async findAllForAdmin(
    @Query('limit') limit: string = '20',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 20;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.courseService.findAllForAdmin(
      parsedLimit,
      parsedOffset,
    );
    return { data, count };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async findByIdForAdmin(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.courseService.findByIdForAdmin(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async create(@Body() createCourseDto: CreateCourseDto) {
    return await this.courseService.create(createCourseDto);
  }

  @Get()
  async findAll(
    @Query('limit') limit: string = '10',
    @Query('offset') offset: string = '0',
  ) {
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedOffset = parseInt(offset, 10) || 0;
    const [data, count] = await this.courseService.findAll(
      parsedLimit,
      parsedOffset,
    );
    return { data, count };
  }

  @Get(':id')
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return await this.courseService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ) {
    return await this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  @HttpCode(204)
  async delete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.courseService.delete(id);
  }
}
