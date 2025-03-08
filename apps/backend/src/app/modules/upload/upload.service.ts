import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { SuccessResponse } from '@frontend/shared';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  private readonly x_server_token;
  private readonly basePath;
  
  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('HOST');
    const port = this.configService.get<number>('API_PORT');
    const nodeEnvironment = this.configService.get<string>('NODE_ENV');
    const secure = nodeEnvironment === 'production';
    this.x_server_token = this.configService.get<string>('X_SERVER_TOKEN');
    this.basePath = `${secure ? 'https' : 'http'}://${host}:${port}`;
  }


  async uploadImage(fileBuffer: Buffer, filename: string) {
    const formData = new FormData();

    formData.append('file', fileBuffer, {filename});

    try {
      const headers = {
        'x-server-token': this.x_server_token,
      };
      await axios.post(`${this.basePath}/api/upload/image`, formData, { headers });
    } catch (error) {
      this.handleAxiosError(error);
    }
  }

  private handleAxiosError(error: any) {
    this.logger.error(error, 'Error during image upload');
    if (axios.isAxiosError(error)) {
      throw new HttpException(
        error.response?.data || 'Upload service error',
        error.response?.status || HttpStatus.BAD_GATEWAY
      );
    }
    throw new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }
}