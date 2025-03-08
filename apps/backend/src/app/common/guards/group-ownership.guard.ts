import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { GroupsService } from '../../modules/groups/groups.service';
import { UserSession } from '../interfaces/user-session.interface';

@Injectable()
export class GroupOwnershipGuard implements CanActivate {
  constructor(private readonly groupsService: GroupsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const groupId = request.params.groupId;
    const user = request.session.user as UserSession; 

    await this.groupsService.findUserGroup(groupId, user.userId);

    return true;
  }
}