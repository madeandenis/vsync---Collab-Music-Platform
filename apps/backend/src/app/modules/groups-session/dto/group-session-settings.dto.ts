import {
  IsOptional,
  IsIn,
} from 'class-validator';

export class GroupSettingsDto {
  @IsOptional()
  maxParticipants?: number;

  @IsOptional()
  @IsIn(['upvote-only', 'upvote-downvote'])
  votingSystem?: 'upvote-only' | 'upvote-downvote';

  @IsOptional()
  @IsIn(['collaborative', 'host-only'])
  queueManagement?: 'collaborative' | 'host-only';

  @IsOptional()
  @IsIn(['equal', 'hierarchical'])
  playbackControl?: 'equal' | 'hierarchical';
}
