import { Controller, Delete, Get, HttpStatus, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { handleError, respond } from '../../common/utils/response.util';
import { GroupsSesionService } from './groups-session.service';
import { Throttle } from '@nestjs/throttler';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { GroupOwnershipGuard } from '../../common/guards/group-ownership.guard';
import { GroupsSessionCache } from '../cache/services/groups-session-cache.service';
import { UserSession } from '../../common/interfaces/user-session.interface';

@Controller('groups-sesion')
@UseGuards(RegisteredUserGuard)
export class GroupsSesionController {
  constructor(
    private readonly groupsSessionService: GroupsSesionService,
    private readonly groupsSessionCache: GroupsSessionCache
  ) {}

  @Post(':groupId')
  @UseGuards(GroupOwnershipGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } }) 
  public async createGroupSession(@Res() res: Response, @Req() req: Request, @Param('groupId', ParseUUIDPipe) groupId: string)
  {
    try {
      const user = req.session.user as UserSession;
      const groupSession = await this.groupsSessionService.createGroupSession(groupId, user);

      return respond(res).success(HttpStatus.CREATED, groupSession);
    } 
    catch(error)
    {
      handleError(error, res)
    }
  }

  @Get(':groupId')
  @UseGuards(GroupOwnershipGuard)
  public async getGroupSession(@Res() res: Response, @Param('groupId', ParseUUIDPipe) groupId: string)
  {
    try {
      const session = await this.groupsSessionCache.get(groupId);
      
      if (!session)
      {
        return respond(res).failure(HttpStatus.NOT_FOUND, 'No active session found for this group');
      }

      return respond(res).success(HttpStatus.OK, session);
    } 
    catch(error)
    {
      handleError(error, res)
    }
  }
  
  @Delete(':groupId')
  @UseGuards(GroupOwnershipGuard)
  @Throttle({ default: { limit: 5, ttl: 60 } }) 
  public async endGroupSession(@Res() res: Response, @Param('groupId', ParseUUIDPipe) groupId: string)
  {
    try
     {
      await this.groupsSessionService.endGroupSession(groupId);

      return respond(res).success(HttpStatus.NO_CONTENT);
    } 
    catch(error)
    {
      handleError(error, res)
    }
  }
}
