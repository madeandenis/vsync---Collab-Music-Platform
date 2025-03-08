import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { handleError, respond } from '../../common/utils/response.util';
import { GroupsSesionService } from './groups-session.service';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { GroupOwnershipGuard } from '../../common/guards/group-ownership.guard';
import { UserSession } from '../../common/interfaces/user-session.interface';
import { GroupSession } from '../../common/interfaces/group-session.interface';
import { createLogger } from '../../common/utils/logger.util';
import { GroupsService } from '../groups/groups.service';

@Controller('groups/:groupId/session')
@UseGuards(RegisteredUserGuard)
export class GroupsSesionController {

  private readonly logger = createLogger(GroupsSesionController.name);

  constructor(
    private readonly groupsService: GroupsService,
    private readonly groupsSessionService: GroupsSesionService
  ) { }

  @Post('start')
  @UseGuards(GroupOwnershipGuard)
  public async startGroupSession(@Res() res: Response, @Req() req: Request, @Param('groupId', ParseUUIDPipe) groupId: string) {
    try {
      const user = req.session.user as UserSession;
      
      await this.groupsSessionService.createGroupSession(groupId, user);
      await this.groupsService.updateGroup(
        groupId,
        user.userId,
        { isActive: true }
      )

      return respond(res).success(HttpStatus.CREATED);
    } catch (error) {
      this.logger.error(error, 'Start session error')
      handleError(res, error);
    }
  }

  @Get('status')
  @UseGuards(GroupOwnershipGuard)
  public async getGroupSessionStatus(@Res() res: Response, @Param('groupId', ParseUUIDPipe) groupId: string) {
    try {
      const session: GroupSession = await this.groupsSessionService.cache.get(groupId);

      if (!session) {
        return respond(res).failure(HttpStatus.NOT_FOUND, 'No active session found for this group');
      }

      return respond(res).success(HttpStatus.OK, session);
    } catch (error) {
      this.logger.error(error, 'Status session error')
      handleError(res, error);
    }
  }

  @Post('stop')
  @UseGuards(GroupOwnershipGuard)
  public async stopGroupSession(@Res() res: Response, @Req() req: Request, @Param('groupId', ParseUUIDPipe) groupId: string) {
    try {
      const user = req.session.user as UserSession;

      await this.groupsSessionService.endGroupSession(groupId);
      await this.groupsService.updateGroup(
        groupId,
        user.userId,
        { isActive: false }
      )

      return respond(res).success(HttpStatus.NO_CONTENT);
    } catch (error) {
      this.logger.error(error, 'Stop session error')
      handleError(res, error);
    }
  }
}
