import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import qs from 'qs';
import { createLogger } from '../../../common/utils/logger.util';
import { Playlist, TokenData, Track, UserProfile } from '@frontend/shared';
import { MusicPlatform } from '@prisma/client';

@Injectable()
export class SpotifyService {

  private readonly logger = createLogger(SpotifyService.name);

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;

  private readonly spotifyAuthorizeUrl = 'https://accounts.spotify.com/authorize';
  private readonly spotifyTokenUrl = 'https://accounts.spotify.com/api/token';
  private readonly spotifyUserProfileUrl = 'https://api.spotify.com/v1/me';
  private readonly spotifySearchUrl = 'https://api.spotify.com/v1/search';
  private readonly spotifyPlaylistsUrl = 'https://api.spotify.com/v1/me/playlists';

  private readonly requiredScopes = [
    'user-read-private',
    'user-read-email',
    'user-modify-playback-state',
    'user-read-playback-state',
    'streaming' 
];

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
    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: this.clientId,
        scope: this.requiredScopes.join(' '),
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
      this.handleSpotifyError(error, 'exchanging authorization code for access token');
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
      this.handleSpotifyError(error, 'refreshing access token');
    }
  }

  async fetchUserProfile(accessToken: string): Promise<UserProfile> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };

    try 
    {
      const response = await axios.get(this.spotifyUserProfileUrl, { headers });

      return {...response.data, platform: MusicPlatform.Spotify} as UserProfile;
    }
    catch (error) 
    {
      this.handleSpotifyError(error, 'fetching user profile');
    }
  }

  
  async fetchUserPlaylists(accessToken: string): Promise<Playlist> 
  {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };
  
    try 
    {
      const response = await axios.get(this.spotifyPlaylistsUrl, { headers });
  
      return response.data.items;
    }
    catch (error) 
    {
      this.handleSpotifyError(error, 'fetching user playlists');
    }
  }
  

  async searchTracks(accessToken: string, query: string): Promise<Track[]>
  {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
    };
    const params = {
      q: query,
      type: 'track',
    }

    try 
    {
      const response = await axios.get(
        this.spotifySearchUrl,
        { headers, params }
      );

      return this.mapSpotifyTrackResponse(response.data);
    }
    catch (error) 
    {
      this.handleSpotifyError(error, 'searching tracks');
    }
  }

  private handleSpotifyError(error: any, action: string) {
    this.logger.error(error, `Error ${action}`);
    if (axios.isAxiosError(error)) {
      throw new HttpException(
        error.response?.data || 'Spotify API error',
        error.response?.status || HttpStatus.BAD_GATEWAY
      );
    }
    throw new HttpException(
      'Internal Server Error',
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  private mapSpotifyTrackResponse(response: any): Track[] {
    return response.tracks.items.map((track: any) => ({
        id: track.id,
        name: track.name,
        album: track.album
            ? {
                  id: track.album.id,
                  name: track.album.name,
                  images: track.album.images || [],
                  imageUrl: track.album.images?.[0]?.url || null
              }
            : undefined,
        artists: track.artists.map((artist: any) => ({
            id: artist.id,
            name: artist.name
        })),
        href: track.href,
        preview_url: track.preview_url,
        video_url: null, 
        duration_ms: track.duration_ms,
        platform: MusicPlatform.Spotify 
    }));
  }
}
  
