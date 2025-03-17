import { Controller, Get, NotFoundException, Param, Post, Req, Res, StreamableFile, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { sendHttpErrorResponse, respond } from '../../common/utils/response.util';
import { imageUploadConfig } from './upload.config';
import { createLogger } from '../../common/utils/logger.util';
import { ServerTokenGuard } from '../../common/guards/server-token.guard';
import 'multer';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';

@Controller('upload')
export class UploadController {
  private readonly logger = createLogger(UploadController.name);

  @Post('image')
  @UseGuards(ServerTokenGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadConfig('disk')))
  async uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req: Request, @Res() res: Response) {
    try {
      return respond(res).success(200);
    } catch (error) {
      this.logger.error(error, 'Error during image upload');
      sendHttpErrorResponse(res, error);
    }
  }

  @Get('thumbnail/:groupId')
  async serveImage(@Param('groupId') groupId: string, @Res() res: Response): Promise<void> {
    try {
      const rootPath = process.cwd();
      const uploadsDir = join(rootPath, 'uploads');
      const filePath = join(uploadsDir, `group-${groupId}.webp`);

      if (!existsSync(filePath)) {
        throw new NotFoundException('File not found: ' + filePath);
      }

      res.set('Content-Type', 'image/webp');

      const fileStream = createReadStream(filePath);

      fileStream.on('error', (error) => {
        this.logger.error(error, 'Error streaming file');
        sendHttpErrorResponse(res, error);
      });

      // Pipe the file stream to the response
      fileStream.pipe(res);
    } catch (error) {
      this.logger.error(error, 'Error serving image');
      sendHttpErrorResponse(res, error);
    }
  }
}