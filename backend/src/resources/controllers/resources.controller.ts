import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import type { Request } from 'express';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminRoleGuard } from '../../auth/guards/admin-role.guard';
import type { SafeUser } from '../../auth/types/safe-user.type';
import { resolveLanguage } from '../../config/request-language';
import { CreateAdminResourceDto } from '../dto/create-admin-resource.dto';
import { CreateMyResourceDto } from '../dto/create-my-resource.dto';
import { ListResourcesDto } from '../dto/list-resources.dto';
import { ResourcesService } from '../services/resources.service';
import {
  buildSafeUploadedFilename,
  resourceUploadExtensions,
} from '../../uploads/upload-security.utils';

const resourcesUploadDirectory = join(process.cwd(), 'uploads', 'resources');

interface UploadedResourceFile {
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

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get('admin')
  @UseGuards(AdminRoleGuard)
  async listAdminResources(@Query() query: ListResourcesDto) {
    return this.resourcesService.listAdminResources(query);
  }

  @Post('admin')
  @UseGuards(AdminRoleGuard)
  async createAdminResource(
    @Body() dto: CreateAdminResourceDto,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.resourcesService.createAdminResource(
      dto,
      currentUser.id,
      resolveLanguage(acceptLanguage),
    );
  }

  @Delete('admin/:id')
  @UseGuards(AdminRoleGuard)
  async deleteAdminResource(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    await this.resourcesService.deleteAdminResource(
      id,
      resolveLanguage(acceptLanguage),
    );
  }

  @Get('me')
  async listMyResources(@CurrentUser() currentUser: SafeUser) {
    return this.resourcesService.listMyResources(currentUser.id);
  }

  @Post('me')
  async createMyResource(
    @Body() dto: CreateMyResourceDto,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    return this.resourcesService.createMyResource(
      dto,
      currentUser.id,
      resolveLanguage(acceptLanguage),
    );
  }

  @Delete('me/:id')
  async deleteMyResource(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage?: string,
  ) {
    await this.resourcesService.deleteMyResource(
      id,
      currentUser.id,
      resolveLanguage(acceptLanguage),
    );
  }

  @Get(':id/download')
  async downloadResource(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: SafeUser,
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Res() response: Response,
  ) {
    const download = await this.resourcesService.getResourceDownload(
      id,
      currentUser,
      resolveLanguage(acceptLanguage),
    );

    response.setHeader('Content-Type', download.mimeType);
    return response.download(download.filePath, download.filename);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (
          _request: UploadRequest,
          _file: MulterUploadedFile,
          callback: DestinationCallback,
        ) => {
          mkdirSync(resourcesUploadDirectory, { recursive: true });
          callback(null, resourcesUploadDirectory);
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
              'resource',
              file.mimetype,
              resourceUploadExtensions,
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
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'application/msword' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          file.mimetype === 'application/vnd.ms-excel' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.mimetype === 'application/vnd.ms-powerpoint' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
          file.mimetype === 'text/plain' ||
          file.mimetype === 'text/csv';

        if (!isAllowedFile) {
          callback(
            new BadRequestException(
              language === 'fi'
                ? 'Vain PDF-, Word-, Excel-, PowerPoint-, TXT- tai CSV-tiedostot ovat sallittuja'
                : 'Only PDF, Word, Excel, PowerPoint, TXT, or CSV files are allowed',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 15 * 1024 * 1024,
      },
    }),
  )
  uploadResource(
    @UploadedFile() file: UploadedResourceFile | undefined,
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
          ? 'Resurssitiedosto vaaditaan'
          : 'A resource file is required',
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
      url: `${protocol}://${host}/uploads/${publicPath}`,
      filename: file.filename,
      mimeType: file.mimetype,
    };
  }
}
