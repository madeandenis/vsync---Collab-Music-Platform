import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import qs from 'qs';
import { createLogger } from '../../../common/utils/logger.util';
import { TokenData, UserProfile } from '@frontend/shared';

@Injectable()
export class SpotifyService {

  private readonly logger = createLogger(SpotifyService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  private readonly spotifyAuthorizeUrl = 'https://accounts.spotify.com/authorize';
  private readonly spotifyTokenUrl = 'https://accounts.spotify.com/api/token';
  private readonly spotifyUserProfileUrl = 'https://api.spotify.com/v1/me';

  constructor(
    private readonly configService: ConfigService 
  )
  {
    this.clientId = this.configService.get<string>('SPOTIFY_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('SPOTIFY_CLIENT_SECRET');
    this.redirectUri = this.configService.get<string>('SPOTIFY_REDIRECT_URI');
  }

  generateSpotifyAuthorizationUrl(state: string): string 
  {
    const requiredScopes = [
        'user-read-private',
        'user-read-email',
    ];

    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        scope: requiredScopes.join(' '),
        redirect_uri: this.redirectUri,
        state,
    });

    return `${this.spotifyAuthorizeUrl}?${queryParams.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenData>
  {
    const body = qs.stringify({
      code,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code'
    });

    const headers =  {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (Buffer.from(this.clientId + ':' + this.clientSecret).toString('base64'))
    };

    try
    {
      const response = await axios.post(
        this.spotifyTokenUrl,
        body,
        { headers }
      );

      return response.data as TokenData
    }
    catch(error)
    {
      this.logger.error(error, 'Error exchanging authorization code for access token');
      if (axios.isAxiosError(error))
      {
        throw new HttpException(
          error.response?.data || 'Spotify API error',
          error.response?.status || HttpStatus.BAD_GATEWAY
        )
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    } 
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenData> {

    const body = qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
    });

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
    };

    try 
    {
        const response = await axios.post(
          this.spotifyTokenUrl,
          body, 
          { headers }
        );

        return response.data as TokenData;
    }
    catch (error) 
    {
      this.logger.error(error, 'Error refreshing access token');
      if (axios.isAxiosError(error))
      {
        throw new HttpException(
          error.response?.data || 'Spotify API error',
          error.response?.status || HttpStatus.BAD_GATEWAY
        )
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {

    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    try 
    {
      const response = await axios.get(this.spotifyUserProfileUrl, { headers });

      return response.data as UserProfile;
    }
    catch (error) 
    {
      this.logger.error(error, 'Error fetching user profile');
      if (axios.isAxiosError(error))
      {
        throw new HttpException(
          error.response?.data || 'Spotify API error',
          error.response?.status || HttpStatus.BAD_GATEWAY
        )
      }
      throw new HttpException(
        'Internal Server Error',
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }
}
  
