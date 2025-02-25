import { Response, Request } from 'express';
import { Controller, Get, Res, Req, Query, HttpStatus, UseGuards, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { generateRandomString } from '../../../common/utils/crypto.util';
import { handleError, respond } from '../../../common/utils/response.util';
import { createLogger } from '../../../common/utils/logger.util';
import { TokenData, UserProfile } from '@frontend/shared';
import { AuthService } from '../../auth/auth.service';
import { MusicPlatform } from '@prisma/client';
import { isValidUrl } from '../../../common/utils/url.util';
import { AccountsService } from '../../accounts/accounts.service';
import { allowedDomains } from '../../../config/allowed-domains';
import { RegisteredUserGuard } from '../../../common/guards/registered-user.guard';
import { SpotifyUserGuard } from '../../../common/guards/spotify-user.guard';
import { UsersSessionService } from '../../users-session/users-session.service';
import { isGuestUserSession, UserSession } from '../../../common/interfaces/user-session.interface';
import { TokenExpirationGuard } from '../../../common/guards/token-expiration.guard';

@Controller('spotify')
export class SpotifyController {

  private readonly logger = createLogger(SpotifyController.name);

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly accountService: AccountsService,
    private readonly authService: AuthService,
    private readonly usersSessionService: UsersSessionService,
  ) {}

  @Get('login')
  async login(@Res() res: Response, @Req() req: Request, @Query('state') state?: string){

    try
    {
      // 1. CSRF Protection: Prevents unauthorized OAuth requests by verifying the state value.  
      // 2. Session Tracking: Ensures the request and response belong to the same user session.  
      // 3. Redirect Handling: Stores the user's intended destination to redirect them after login.  
      // TODO - accept only same-site request with a custom state
      state = state || generateRandomString(16);
      const authUrl = this.spotifyService.generateSpotifyAuthorizationUrl(state)

      // prevent session fixation
      await this.usersSessionService.regenerateSession(req);
      req.session.state = state;
      await this.usersSessionService.saveSession(req);

      return res.redirect(authUrl) // # changed to redirect
    }
    catch(error)
    {
      this.logger.error(error, 'Error during Spotify login');
      handleError(res, error);
    }
  }

  @Get('callback')
  async callback(@Res() res: Response, @Req() req: Request)
  {
    try
    {
      const {
        state: requestState, 
        code: authCode,
        error: authError
      } = req.query;

      if (typeof requestState !== 'string' || typeof authCode !== 'string') {
        return respond(res).failure(HttpStatus.BAD_REQUEST, 'Invalid query parameters');
      }

      const sessionState = req.session.state; 
      
      req.session.state = '';

      if(authError)
      {
        this.usersSessionService.destroySession(req);
        return respond(res).failure(HttpStatus.BAD_REQUEST, authError);
      }
      if(!requestState || requestState !== sessionState){
        this.usersSessionService.destroySession(req);
        return respond(res).failure(HttpStatus.FORBIDDEN, 'State validation failed');
      }

      const tokenData: TokenData = await this.spotifyService.exchangeCodeForToken(authCode as string);
      const userProfile: UserProfile = await this.spotifyService.fetchUserProfile(tokenData.access_token);
      
      await this.usersSessionService.regenerateSession(req);
      return this.authService.authenticate(
        req,
        MusicPlatform.Spotify,
        tokenData,
        userProfile
      )
      .then(() => {
        this.redirectTo(res, sessionState)
      })
      .catch((error) => this.handleFailedAuthentication(res, error))
    }
    catch (error)
    {
      this.logger.error(error, 'Error during Spotify callback');
      handleError(res, error);
    }    
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard)
  @Get('refresh-token')
  async refreshToken(@Res() res: Response, @Req() req: Request)
  {
    try
    {
      const session = req.session.user;

      if(isGuestUserSession(session)){
        throw new UnauthorizedException('You are not authorized to access this resource. Please log in.');
      }

      const account = session.activeAccount;

      const refreshToken = await this.accountService.getRefreshToken(
        account.provider,
        account.providerAccountId
      );

      if(!refreshToken)
      {
        throw new NotFoundException('The refresh token could not be found. Please re-authenticate.');
      }

      const tokenData: TokenData = await this.spotifyService.refreshAccessToken(refreshToken);
      session.token.accessToken = tokenData.access_token;
      session.token.expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : undefined;

      await this.usersSessionService.saveSession(req);

      return respond(res).success(HttpStatus.OK);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during Token refresh');
      handleError(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard, TokenExpirationGuard)
  @Get('profile')
  async getProfile(@Res() res: Response, @Req() req: Request) 
  {
    try
    {
      const user = req.session.user as UserSession;
      const accessToken = user.token.accessToken;

      const userProfile = await this.spotifyService.fetchUserProfile(accessToken);
      return respond(res).success(HttpStatus.OK, userProfile);
    }
    catch (error)
    {
      this.logger.error(error, 'Error during profile fetch');
      handleError(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard, TokenExpirationGuard)
  @Get('playlists')
  async getPlaylists(@Res() res: Response, @Req() req: Request) 
  {
    try
    {
      const user = req.session.user as UserSession;
      const accessToken = user.token.accessToken;

      const playlists = await this.spotifyService.fetchUserPlaylists(accessToken);
      return respond(res).success(HttpStatus.OK, playlists);
    }
    catch (error)
    {
      this.logger.error(error, 'Error during playlists fetch');
      handleError(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard, TokenExpirationGuard)
  @Get('search')
  public async searchTracks(@Req() req: Request, @Res() res: Response, @Query('q') query: string)
  {
    if(!query)
    {
      return respond(res).failure(HttpStatus.BAD_REQUEST, 'Query parameter is required')
    }

    try
    {
      const user = req.session.user as UserSession;
      const accessToken = user.token.accessToken;
      const tracks = this.spotifyService.searchTracks(accessToken, query);

      return respond(res).success(HttpStatus.OK, tracks);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during tracks search');
      handleError(res, error);
    }
  }

  private redirectTo(res: Response, state: string)
  {
    const url = isValidUrl(state) && allowedDomains.some(domain => state.startsWith(domain))
      ? state
      : '/home';
    return res.redirect(url);
  }

  private handleFailedAuthentication(res: Response, error: unknown)
  {
    this.logger.error(error, 'Authentication failed');
    return respond(res).failure(HttpStatus.INTERNAL_SERVER_ERROR, 'Authentication failed');
  }

}
