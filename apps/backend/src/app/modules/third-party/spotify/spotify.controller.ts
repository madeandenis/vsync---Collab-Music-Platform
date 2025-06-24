import { Response, Request } from 'express';
import { Controller, Get, Res, Req, Query, HttpStatus, UseGuards, UnauthorizedException, NotFoundException, Post } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { generateRandomString } from '../../../common/utils/crypto.util';
import { sendHttpErrorResponse, respond } from '../../../common/utils/response.util';
import { createLogger } from '../../../common/utils/logger.util';
import { GuestUserSession, isGuestUserSession, TokenData, UserProfile, AuthenticatedUserSession } from '@frontend/shared';
import { AuthService } from '../../auth/auth.service';
import { MusicPlatform } from '@prisma/client';
import { isValidUrl, splitUrl } from '../../../common/utils/url.util';
import { AccountsService } from '../../accounts/accounts.service';
import { allowedDomains } from '../../../config/allowed-domains';
import { RegisteredUserGuard } from '../../../common/guards/registered-user.guard';
import { SpotifyUserGuard } from '../../../common/guards/spotify-user.guard';
import { UsersSessionService } from '../../users-session/users-session.service';
import { TokenExpirationGuard } from '../../../common/guards/token-expiration.guard';
import { ConfigService } from '@nestjs/config';
import { report } from 'process';

@Controller('spotify')
export class SpotifyController {

  private readonly logger = createLogger(SpotifyController.name);
  private clientBaseUrl;  

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly accountService: AccountsService,
    private readonly authService: AuthService,
    private readonly usersSessionService: UsersSessionService,
    private readonly configService: ConfigService
  ) {
    const nodeEnvironment = configService.get<string>('NODE_ENV');
    const secure = nodeEnvironment === 'production';
    const host = this.configService.get<string>('HOST');
    const client_port = this.configService.get<string>('CLIENT_PORT');
    this.clientBaseUrl = `${secure ? 'https' : 'http'}://${host}:${client_port}`;
  }

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
      sendHttpErrorResponse(res, error);
    }
  }

  // TODO - handle and redirect on auth error to client side
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
        return this.handleFailedAuthentication(res, 'Invalid query parameters');
      }

      const sessionState = req.session.state; 
      
      req.session.state = '';

      if(authError)
      {
        this.usersSessionService.destroySession(req);
        return this.handleFailedAuthentication(res, 'Invalid query parameters');
      }
      if(!requestState || requestState !== sessionState){
        this.usersSessionService.destroySession(req);
        return this.handleFailedAuthentication(res, 'State validation failed');
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
      .catch((error) => this.handleFailedAuthentication(res, error, false))
    }
    catch (error)
    {
      this.logger.error(error, 'Error during Spotify callback');
      sendHttpErrorResponse(res, error);
    }    
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard)
  @Get('access-token')
  async refreshToken(@Res() res: Response, @Req() req: Request)
  {
    try
    {
      const session: AuthenticatedUserSession | GuestUserSession = req.session.user;

      if(isGuestUserSession(session)){
        throw new UnauthorizedException('You are not authorized to access this resource. Please log in.');
      }
      const { accessToken, expiresAt } = session.token;

      if (!accessToken || !expiresAt) {
        throw new UnauthorizedException('Invalid session token. Please reauthenticate.');
      }

      const expiresAtDate = new Date(session.token.expiresAt);
      const now = new Date();
  
      if (expiresAtDate <= now) {
        throw new UnauthorizedException('Token has expired. Please refresh token.');
      }
  
      return respond(res).success(HttpStatus.OK, accessToken);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during Token refresh');
      sendHttpErrorResponse(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard)
  @Post('refresh/access-token')
  async refreshAccessToken(@Res() res: Response, @Req() req: Request)
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
      sendHttpErrorResponse(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard, TokenExpirationGuard)
  @Get('profile')
  async getProfile(@Res() res: Response, @Req() req: Request) 
  {
    try
    {
      const user = req.session.user as AuthenticatedUserSession;
      const accessToken = user.token.accessToken;

      const userProfile = await this.spotifyService.fetchUserProfile(accessToken);
      return respond(res).success(HttpStatus.OK, userProfile);
    }
    catch (error)
    {
      this.logger.error(error, 'Error during profile fetch');
      sendHttpErrorResponse(res, error);
    }
  }

  @UseGuards(RegisteredUserGuard, SpotifyUserGuard, TokenExpirationGuard)
  @Get('playlists')
  async getPlaylists(@Res() res: Response, @Req() req: Request) 
  {
    try
    {
      const user = req.session.user as AuthenticatedUserSession;
      const accessToken = user.token.accessToken;

      const playlists = await this.spotifyService.fetchUserPlaylists(accessToken);
      return respond(res).success(HttpStatus.OK, playlists);
    }
    catch (error)
    {
      this.logger.error(error, 'Error during playlists fetch');
      sendHttpErrorResponse(res, error);
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
      const user = req.session.user as AuthenticatedUserSession;
      const accessToken = user.token.accessToken;
      const tracks = await this.spotifyService.searchTracks(accessToken, query);

      return respond(res).success(HttpStatus.OK, tracks);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during tracks search');
      sendHttpErrorResponse(res, error);
    }
  }

  private redirectTo(res: Response, state: string)
  {
    if(isValidUrl(state))
    {
      state = splitUrl(state).path;
    }

    if (allowedDomains.includes(state)) {
      if(state.startsWith('/api'))
      {
        return res.redirect(state);
      }
      else
      {
        return res.redirect(`${this.clientBaseUrl}${state}`);
      }
    }

    return res.redirect(`${this.clientBaseUrl}/home`);
  }

  private handleFailedAuthentication(res: Response, error: unknown, reportError = true)
  {
    let errorMessage = 'Authentication failed'

    if (reportError) { 
      if (error instanceof Error) {
          errorMessage = error.message;
      } else if (typeof error === 'string') {
          errorMessage = error;
      } else {
          errorMessage = 'Unknown authentication error';
      }
  }
    
    const redirectUrl = `${this.clientBaseUrl}/login?err=${encodeURIComponent(errorMessage)}`;
    this.logger.error(`Redirecting to: ${redirectUrl}`); 
    
    return res.redirect(redirectUrl);
  }
 
}
