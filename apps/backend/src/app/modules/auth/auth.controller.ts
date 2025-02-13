import { Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response, Request } from 'express';
import { handleError, respond } from '../../common/utils/response.util';
import { SessionService } from '../session/session.service';
import { createLogger } from '../../common/utils/logger.util';
import { UsersService } from '../users/users.service';
import { MusicPlatform } from '@prisma/client';
import { isGuestUserSession } from '../../common/types/session.type';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';

@Controller('auth')
export class AuthController {
  
  private readonly logger = createLogger(AuthController.name);
  
  constructor(
    private readonly userService: UsersService,
    private readonly sessionService: SessionService
  ) { }
  
  @Post('logout')
  async logout(@Req() req: Request, @Res() res: Response)
  {
    const sessionId = req.sessionID;
    
    if (!sessionId)
    {
      return respond(res).failure(HttpStatus.BAD_REQUEST, 'No session to destroy');
    }

    try
    {
      const session = req.session.user;

      if(isGuestUserSession(session))
      {
        await this.userService.deleteGuestUser(sessionId);
      }

      this.sessionService.destroySession(req);
      res.clearCookie('connect.sid') // session cookie

      return respond(res).success(HttpStatus.OK);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during logout process');
      handleError(res, error);
    }
  }

  @Get('login/:provider')
  @UseGuards(RegisteredUserGuard)
  async login(@Req() req: Request, @Res() res: Response, @Param('provider') provider: string) {
    const validProvider = await this.getValidProvider(provider);
    if (!validProvider) {
      return respond(res).failure(HttpStatus.BAD_REQUEST, 'Unsupported music provider');
    }

    return res.redirect(this.providerRoutes[validProvider].login);
  }

  @Get('refresh-token/:provider')
  async refreshToken(@Req() req: Request, @Res() res: Response, @Param('provider') provider: string)
  {
    const validProvider = await this.getValidProvider(provider);
    if (!validProvider) {
      return respond(res).failure(HttpStatus.BAD_REQUEST, 'Unsupported music provider');
    }

    return res.redirect(this.providerRoutes[validProvider].refreshToken);
  } 

  private readonly providerMap = new Map<string, MusicPlatform>(
    Object.values(MusicPlatform).map(platform => [platform.toLowerCase(), platform])
  );
  private readonly providerRoutes = {
    [MusicPlatform.Spotify]: {
      login: '/api/spotify/login',
      refreshToken: '/api/spotify/refresh-token',
    },
  };

  private getValidProvider(provider: string): MusicPlatform | null {
    return this.providerMap.get(provider.toLowerCase()) || null;
  }
}
