import { Response, Request } from 'express';
import { Controller, Get, Res, Req, Query, HttpStatus, Inject, HttpException, UseGuards } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { generateRandomString } from '../../../common/utils/crypto.util';
import { handleError, respond } from '../../../common/utils/response.util';
import { createLogger } from '../../../common/utils/logger.util';
import { TokenData, UserProfile } from '@frontend/shared';
import { AuthService } from '../../auth/auth.service';
import { MusicPlatform } from '@prisma/client';
import { isValidUrl } from '../../../common/utils/url.util';
import { AccountsService } from '../../accounts/accounts.service';
import { isGuestUserSession, UserSession } from '../../../common/types/session.type';
import { HttpExceptions } from '../../../common/exceptions/http-exception-messages';
import { SessionService } from '../../session/session.service';
import { allowedDomains } from '../../../config/allowed-domains';
import { RegisteredUserGuard } from '../../../common/guards/registered-user.guard';

@Controller('spotify')
export class SpotifyController {

  private readonly logger = createLogger(SpotifyController.name);

  constructor(
    private readonly spotifyService: SpotifyService,
    private readonly accountService: AccountsService,
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Get('login')
  async login(@Res() res: Response, @Req() req: Request, @Query('state') state?: string){

    try
    {
      // 1. CSRF Protection: Prevents unauthorized OAuth requests by verifying the state value.  
      // 2. Session Tracking: Ensures the request and response belong to the same user session.  
      // 3. Redirect Handling: Stores the user's intended destination to redirect them after login.  
      state = state || generateRandomString(16);
      const authUrl = this.spotifyService.generateSpotifyAuthorizationUrl(state)

      req.session.state = state;

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
        this.sessionService.destroySession(req);
        return respond(res).failure(HttpStatus.BAD_REQUEST, authError);
      }
      if(!requestState || requestState !== sessionState){
        this.sessionService.destroySession(req);
        return respond(res).failure(HttpStatus.FORBIDDEN, 'State validation failed');
      }

      const tokenData: TokenData = await this.spotifyService.exchangeCodeForToken(authCode as string);
      const userProfile: UserProfile = await this.spotifyService.fetchUserProfile(tokenData.access_token);
      
      return this.authService.authenticate(
        req,
        MusicPlatform.Spotify,
        tokenData,
        userProfile
      )
      .then(() => {
        this.sessionService.regenerateSession(req);
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

  @UseGuards(RegisteredUserGuard)
  async refreshToken(@Res() res: Response, @Req() req: Request)
  {
    try
    {
      const session = req.session.user;

      if(isGuestUserSession(session)){
        throw HttpExceptions.UNAUTHORIZED;
      }

      const account = session.activeAccount;

      const refreshToken = await this.accountService.getRefreshToken(
        account.provider,
        account.providerAccountId
      );

      if(!refreshToken)
      {
        throw HttpExceptions.REFRESH_TOKEN_NOT_FOUND;
      }

      const tokenData: TokenData = await this.spotifyService.refreshAccessToken(refreshToken);
      session.token.accessToken = tokenData.access_token;
      session.token.expiresAt = tokenData.expires_in
        ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
        : undefined;

      this.sessionService.saveSession(req);

      return respond(res).success(HttpStatus.OK);
    }
    catch(error)
    {
      this.logger.error(error, 'Error during Token refresh');
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
