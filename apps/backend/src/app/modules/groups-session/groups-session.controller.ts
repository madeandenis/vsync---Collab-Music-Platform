import { Controller, Get, HttpStatus, Param, ParseUUIDPipe, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { sendHttpErrorResponse, respond } from '../../common/utils/response.util';
import { GroupsSesionService } from './groups-session.service';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { GroupOwnershipGuard } from '../../common/guards/group-ownership.guard';
import { createLogger } from '../../common/utils/logger.util';
import { GroupsService } from '../groups/groups.service';
import { GroupSession, UserSession } from '@frontend/shared';

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
        { isActive: true },
        user.userId,
      )

      return respond(res).success(HttpStatus.CREATED);
    } catch (error) {
      this.logger.error(error, 'Start session error')
      sendHttpErrorResponse(res, error);
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
      sendHttpErrorResponse(res, error);
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
        { isActive: false },
        user.userId,
      )

      return respond(res).success(HttpStatus.NO_CONTENT);
    } catch (error) {
      this.logger.error(error, 'Stop session error')
      sendHttpErrorResponse(res, error);
    }
  }
}
