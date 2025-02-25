import { Controller } from '@nestjs/common';
import { UsersSessionService } from './users-session.service';

@Controller('session')
export class UsersSessionController {
  constructor(private readonly usersSessionService: UsersSessionService) {}
}
