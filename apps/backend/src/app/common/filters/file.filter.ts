import { BadRequestException } from '@nestjs/common';
import { Request } from 'express';

export function validateImage(req: Request, file: Express.Multer.File, callback: (error: any, acceptFile: boolean) => void) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
  validateFileType(req, file, allowedTypes, callback);
} 

export function validateFileType(req: Request, file: Express.Multer.File, allowedTypes: string[], callback: (error: any, acceptFile: boolean) => void) {
  
  if (!allowedTypes.includes(file.mimetype)) {
    return callback(new BadRequestException(`File type must be one of: ${allowedTypes.join(', ')}`), false);
  }
  
  callback(null, true);
}
