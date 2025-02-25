import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { MusicPlatform } from '@prisma/client';


export class UpdateGroupDto {
    @IsString()
    @IsOptional()
    name?: string;
  
    @IsString()
    @IsOptional()
    description?: string;
  
    @IsString()
    @IsOptional()
    imageUrl?: string;
  
    @IsBoolean()
    @IsOptional()
    isPublic?: boolean;
  
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
  
    @IsEnum(MusicPlatform)
    @IsOptional()
    platform?: MusicPlatform;
  }