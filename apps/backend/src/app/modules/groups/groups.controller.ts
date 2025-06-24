import { GroupsService } from './groups.service';
import { Request, Response } from 'express';
import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe, Req, Res, HttpStatus, UseGuards, UsePipes, ValidationPipe, ConflictException, UseInterceptors, UploadedFile, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { sendHttpErrorResponse, respond } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadConfig } from '../upload/upload.config';
import { UploadService } from '../upload/upload.service';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { GroupOwnershipGuard } from '../../common/guards/group-ownership.guard';
import { GuestUserSession, isAuthenticatedUserSession, AuthenticatedUserSession } from '@frontend/shared';

@Controller('groups')
export class GroupsController {

  private readonly logger = createLogger(GroupsController.name);
  private readonly thumbnailResourceUrl;

  constructor(
    private readonly groupsService: GroupsService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService
  ) {
    const host = this.configService.get<string>('HOST');
    const port = this.configService.get<number>('API_PORT');
    const prefix = 'api'
    const nodeEnvironment = this.configService.get<string>('NODE_ENV');
    const secure = nodeEnvironment === 'production';
    const basePath = `${secure ? 'https' : 'http'}://${host}:${port}`;
    this.thumbnailResourceUrl = `${basePath}/${prefix}/upload/thumbnail`;
  }

  /**
   * User groups endpoints
   */

  @Get()
  @UseGuards(RegisteredUserGuard)
  async getUserGroups(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;
      const groups = await this.groupsService.findUserGroups(userId);

      return respond(res).success(HttpStatus.OK, groups);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }

  @Get(':groupId')
  @UseGuards(RegisteredUserGuard)
  async getUserGroup(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;
      const group = await this.groupsService.findUserGroup(groupId, userId);

      return respond(res).success(HttpStatus.OK, group);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }

  @Post()
  @UseGuards(RegisteredUserGuard)
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;

      await this.groupsService.ensureUniqueGroupName(userId, dto.name);
      const group = await this.groupsService.createGroup(userId, dto);

      return respond(res).success(HttpStatus.CREATED, group);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }

  @Put(':groupId')
  @UseGuards(RegisteredUserGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true })) // TODO - add to all
  async updateUserGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string, @Body() dto: UpdateGroupDto,
    @Req() req: Request, @Res() res: Response
  ) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;
      const updatedGroup = await this.groupsService.updateGroup(groupId, dto, userId);

      return respond(res).success(HttpStatus.OK, updatedGroup);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }

  @Delete(':groupId')
  @UseGuards(RegisteredUserGuard)
  async deleteUserGroup(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;
      await this.groupsService.deleteGroup(groupId, userId);

      return respond(res).success(HttpStatus.NO_CONTENT);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }

  @Post(':groupId/upload-thumbnail')
  @UseGuards(RegisteredUserGuard, GroupOwnershipGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadConfig('memory')))
  async uploadGroupImage(@Param('groupId', ParseUUIDPipe) groupId: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as AuthenticatedUserSession).userId;

      if (!file) {
        throw new BadRequestException('File is required and cannot be empty');
      }

      const filename = `group-${groupId}.webp`;
      const imageBuffer = await sharp(file.buffer)
        .resize(180, 180, { fit: 'cover' })
        .toFormat('webp', { quality: 80 })
        .toBuffer()
        .catch((error) => {
          this.logger.error(error, 'Image processing error');
          throw new BadRequestException('Invalid image file');
        });

      await this.uploadService.uploadImage(imageBuffer, filename);
      const updatedGroup = await this.groupsService.updateGroup(
        groupId,
        { imageUrl: `${this.thumbnailResourceUrl}/${groupId}` },
        userId,
      );

      return respond(res).success(HttpStatus.OK, updatedGroup);
    } catch (error) {
      this.logger.error(error, 'Error during group image upload');
      sendHttpErrorResponse(res, error);
    }
  }

  /**
   * Public endpoints 
   */

  @Get(':groupId/public')
  async getPublicGroup(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user: AuthenticatedUserSession | GuestUserSession = req.session.user;
      const userId = isAuthenticatedUserSession(user) ? user.userId : undefined;
      
      const group = await this.groupsService.findGroup(groupId);

      if (!group.isPublic && group.creatorId !== userId) // if user is owner surpass the error
      {
        throw new ForbiddenException('This group is private. Please request an invitation code from the group administrator to join.');
      }

      return respond(res).success(HttpStatus.OK, group);
    }
    catch (error) {
      sendHttpErrorResponse(res, error);
    }
  }
}
