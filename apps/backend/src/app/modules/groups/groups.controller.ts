import { GroupsService } from './groups.service';
import { Request, Response } from 'express';
import { Controller, Get, Post, Body, Param, Put, Delete, ParseUUIDPipe, Req, Res, HttpStatus, UseGuards, UsePipes, ValidationPipe, ConflictException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { UserSession } from '../../common/interfaces/user-session.interface';
import { handleError, respond } from '../../common/utils/response.util';
import { createLogger } from '../../common/utils/logger.util';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';

@Controller('groups')
export class GroupsController {

  private readonly logger = createLogger(GroupsController.name);
  
  constructor(private readonly groupsService: GroupsService) { }

  @Post()
  @UseGuards(RegisteredUserGuard) 
  async createGroup(@Body() dto: CreateGroupDto, @Req() req: Request, @Res() res: Response) {
    try
    {
      const userId = (req.session.user as UserSession).userId;

      await this.groupsService.ensureGroupNameIsUnique(userId, dto.name);
      const group = await this.groupsService.createGroup(userId, dto);

      return respond(res).success(HttpStatus.CREATED, group);
    }  
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Get()
  @UseGuards(RegisteredUserGuard)
  async getUserGroups(@Req() req: Request, @Res() res: Response) {
    try 
    {
      const userId = (req.session.user as UserSession).userId;
      const groups = await this.groupsService.getUserGroups(userId);
    
      return respond(res).success(HttpStatus.OK, groups);
    }
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Get(':id')
  @UseGuards(RegisteredUserGuard)
  async getGroupById(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) 
  {
    try 
    {
      const userId = (req.session.user as UserSession).userId;
      const group = await this.groupsService.getGroupById(userId, id);

      return respond(res).success(HttpStatus.OK, group);
    } 
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Put(':id')
  @UseGuards(RegisteredUserGuard)
  @UsePipes(new ValidationPipe({ forbidNonWhitelisted: true }))
  async updateGroup(
    @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGroupDto,
    @Req() req: Request, @Res() res: Response
  )
  {
    try 
    {
      const userId = (req.session.user as UserSession).userId;
      const updatedGroup = await this.groupsService.updateGroup(userId, id, dto);
    
      return respond(res).success(HttpStatus.OK, updatedGroup);
    }
    catch(error)
    {
      console.error(error);  
      handleError(res, error);
    }
  }

  @Delete(':id')
  @UseGuards(RegisteredUserGuard)
  async deleteGroup(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response)
  {
    try
    {
      const userId = (req.session.user as UserSession).userId;
      await this.groupsService.deleteGroup(userId, id);
    
      return respond(res).success(HttpStatus.NO_CONTENT);
    }
    catch(error)
    {
      handleError(res, error);
    }
  }

  /**
   *  Admin endpoints
  */

  @Get('admin/all')
  @UseGuards(AdminGuard)
  async getAllGroupsAdmin(@Req() req: Request, @Res() res: Response) {
    try 
    {
      const user = req.session.user as UserSession;
      const groups = await this.groupsService.getAllGroups();
    
      return respond(res).success(HttpStatus.OK, groups);
    }
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  async getGroupByIdAdmin(@Param('id', ParseUUIDPipe) id: string, @Req() req: Request, @Res() res: Response) 
  {
    try 
    {
      const user = req.session.user as UserSession;
      const group = await this.groupsService.getGroupByIdAdmin(id);
    
      return respond(res).success(HttpStatus.OK, group);
    } 
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Put('admin/:id')
  @UseGuards(AdminGuard)
  async updateGroupAdmin(
    @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateGroupDto,
    @Res() res: Response
  )
  {
    try 
    {
      const updatedGroup = await this.groupsService.updateGroupAdmin(id, dto);
    
      return respond(res).success(HttpStatus.OK, updatedGroup);
    }
    catch(error)
    {
      handleError(res, error);
    }
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  async deleteGroupAdmin(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response)
  {
    try
    {
      await this.groupsService.deleteGroupAdmin(id);
    
      return respond(res).success(HttpStatus.NO_CONTENT);
    }
    catch(error)
    {
      handleError(res, error);
    }
  }

}
