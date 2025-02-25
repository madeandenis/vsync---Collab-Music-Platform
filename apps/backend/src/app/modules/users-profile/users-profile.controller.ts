import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { RegisteredUserGuard } from '../../common/guards/registered-user.guard';
import { handleError, respond } from '../../common/utils/response.util';
import { Request, Response } from 'express';
import { UserSession } from '../../common/interfaces/user-session.interface';
import { MusicPlatform } from '@prisma/client';

@Controller('user-profile')
export class UsersProfileController {

  @UseGuards(RegisteredUserGuard)
  @Get()
  public async getProfile(@Req() req: Request, @Res() res: Response)
  {
    try 
    {
      const user = req.session.user as UserSession;
      const validProvider = await this.getValidProvider(user.activeAccount.provider);

      return res.redirect(this.profileRoutes[validProvider]);
    }
    catch (error)
    {
      handleError(res, error)
    }
  }

  private readonly providerMap = new Map<string, MusicPlatform>(
    Object.values(MusicPlatform).map(platform => [platform.toLowerCase(), platform])
  );
  private readonly profileRoutes = {
    [MusicPlatform.Spotify]: '/api/spotify/profile'
  };

  private getValidProvider(provider: string): MusicPlatform | null {
    return this.providerMap.get(provider.toLowerCase()) || null;
  }
}
