import { GroupsService } from './groups.service';
import { Request, Response } from 'express';
import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe, Req, Res, HttpStatus, UseGuards, UsePipes, ValidationPipe, ConflictException, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UserSession } from '../../common/interfaces/user-session.interface';
import { handleError, respond } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { imageUploadConfig } from '../upload/upload.config';
import { UploadService } from '../upload/upload.service';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { GroupOwnershipGuard } from '../../common/guards/group-ownership.guard';

@Controller('groups')
export class GroupsController {

  private readonly logger = createLogger(GroupsController.name);
  private readonly thumbnailResourceUrl;

  constructor(
    private readonly groupsService: GroupsService,
    private readonly uploadService: UploadService,
    private readonly configService: ConfigService
  ) 
  {
    const host = this.configService.get<string>('HOST');
    const port = this.configService.get<number>('API_PORT');
    const prefix = 'api'
    const nodeEnvironment = this.configService.get<string>('NODE_ENV');
    const secure = nodeEnvironment === 'production';
    const basePath = `${secure ? 'https' : 'http'}://${host}:${port}`;
    this.thumbnailResourceUrl = `${basePath}/${prefix}/upload/thumbnail`;
  }

  @Post()
  @UseGuards(RegisteredUserGuard) 
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as UserSession).userId;

      await this.groupsService.ensureGroupNameIsUnique(userId, dto.name);
      const group = await this.groupsService.createGroup(userId, dto);

      return respond(res).success(HttpStatus.CREATED, group);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Get()
  @UseGuards(RegisteredUserGuard)
  async getUserGroups(@Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as UserSession).userId;
      const groups = await this.groupsService.getUserGroups(userId);

      return respond(res).success(HttpStatus.OK, groups);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Get(':groupId')
  @UseGuards(RegisteredUserGuard)
  async getGroupById(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as UserSession).userId;
      const group = await this.groupsService.getGroupById(userId, groupId);

      return respond(res).success(HttpStatus.OK, group);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Put(':groupId')
  @UseGuards(RegisteredUserGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async updateGroup(
    @Param('groupId', ParseUUIDPipe) groupId: string, @Body() dto: UpdateGroupDto,
    @Req() req: Request, @Res() res: Response
  ) {
    try {
      const userId = (req.session.user as UserSession).userId;
      const updatedGroup = await this.groupsService.updateGroup(groupId, userId, dto);

      return respond(res).success(HttpStatus.OK, updatedGroup);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Delete(':groupId')
  @UseGuards(RegisteredUserGuard)
  async deleteGroup(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as UserSession).userId;
      await this.groupsService.deleteGroup(userId, groupId);

      return respond(res).success(HttpStatus.NO_CONTENT);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Post(':groupId/upload-thumbnail')
  @UseGuards(RegisteredUserGuard, GroupOwnershipGuard)
  @UseInterceptors(FileInterceptor('file', imageUploadConfig('memory')))
  async uploadGroupImage(@Param('groupId', ParseUUIDPipe) groupId: string, @UploadedFile() file: Express.Multer.File, @Req() req: Request, @Res() res: Response) {
    try {
      const userId = (req.session.user as UserSession).userId;

      if (!file) {
        throw new BadRequestException('File is required and cannot be empty');
      }

      const filename = `group-${groupId}.webp`;
      const imageBuffer = await sharp(file.buffer)
        .resize(180, 180, { fit: 'cover' })
        .toFormat('webp', { quality: 80 })
        .toBuffer()
        .catch((error) => {
          throw new BadRequestException('Invalid image file');
        });

      await this.uploadService.uploadImage(imageBuffer, filename);
      const updatedGroup = await this.groupsService.updateGroupImage(groupId, userId, `${this.thumbnailResourceUrl}/${groupId}`);

      return respond(res).success(HttpStatus.OK, updatedGroup);
    } catch (error) {
      this.logger.error(error, 'Error during group image upload');
      handleError(res, error);
    }
  }

  /**
   *  Admin endpoints
  */
  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllGroupsAdmin(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.session.user as UserSession;
      const groups = await this.groupsService.getAllGroups();

      return respond(res).success(HttpStatus.OK, groups);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Get('admin/:groupId')
  @UseGuards(AdminGuard)
  async getGroupByIdAdmin(@Param('groupId', ParseUUIDPipe) groupId: string, @Req() req: Request, @Res() res: Response) {
    try {
      const user = req.session.user as UserSession;
      const group = await this.groupsService.getGroupByIdAdmin(groupId);

      return respond(res).success(HttpStatus.OK, group);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Put('admin/:groupId')
  @UseGuards(AdminGuard)
  async updateGroupAdmin(
    @Param('groupId', ParseUUIDPipe) groupId: string, @Body() dto: UpdateGroupDto,
    @Res() res: Response
  ) {
    try {
      const updatedGroup = await this.groupsService.updateGroupAdmin(groupId, dto);

      return respond(res).success(HttpStatus.OK, updatedGroup);
    }
    catch (error) {
      handleError(res, error);
    }
  }

  @Delete('admin/:groupId')
  @UseGuards(AdminGuard)
  async deleteGroupAdmin(@Param('groupId', ParseUUIDPipe) groupId: string, @Res() res: Response) {
    try {
      await this.groupsService.deleteGroupAdmin(groupId);

      return respond(res).success(HttpStatus.NO_CONTENT);
    }
    catch (error) {
      handleError(res, error);
    }
  }

}
