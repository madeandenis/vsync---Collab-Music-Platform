import { AddTrackPayload, GroupSession, QueuedTrack, ScoredTrack, SeekPayload, Track, TrackStateChangePayload } from '@frontend/shared';
import { MusicPlatform } from '@prisma/client';
import { z } from 'zod';

// --- Validation Helpers ---
const DateStringSchema = z.string().refine(val => !isNaN(Date.parse(val)), {
  message: 'Invalid date format, expected ISO 8601 string.',
});

// --- Track Related Schemas ---
const ArtistSchema = z.object({
  id: z.string(),
  name: z.string(),
});

const AlbumSchema = z.object({
  id: z.string(),
  name: z.string(),
  images: z.array(z.object({ url: z.string().url() })).optional(),
  imageUrl: z.string().optional(),
});

export const TrackSchema: z.ZodType<Track> = z.object({
  id: z.string(),
  name: z.string(),
  album: AlbumSchema,
  artists: z.array(ArtistSchema),
  href: z.string().url(),
  preview_url: z.string().url().nullable().optional(),
  video_url: z.string().url().nullable().optional(),
  duration_ms: z.number(),
  platform: z.enum([MusicPlatform.Spotify, MusicPlatform.YoutubeMusic]),
}).strict() as z.ZodType<Track>;

// --- Payload Schemas ---
export const TrackStateChangePayloadSchema: z.ZodType<TrackStateChangePayload> = z.object({
  trackId: z.string(),
  progressMs: z.number().min(0),
  clientUpdatedAt: DateStringSchema,
}).strict() as z.ZodType<TrackStateChangePayload>;

export const SeekPayloadSchema: z.ZodType<SeekPayload> = z.object({
  trackId: z.string(),
  seekPosition: z.number().min(0),
  clientUpdatedAt: DateStringSchema,
}).strict() as z.ZodType<SeekPayload>;

export const AddTrackPayloadSchema: z.ZodType<AddTrackPayload> = z.object({
  track: TrackSchema,
  score: z.number().min(0).max(10),
}).strict() as z.ZodType<AddTrackPayload>;

// --- Queue Related Schemas ---

export const QueuedTrackSchema: z.ZodType<QueuedTrack> = z.object({
  trackDetails: TrackSchema,
  addedBy: z.object({
    sessionId: z.string(),
    username: z.string().optional(),
  }),
  addedAt: DateStringSchema,
}).strict() as z.ZodType<QueuedTrack>;

export const ScoredTrackSchema: z.ZodType<ScoredTrack> = z.object({
  queuedTrack: QueuedTrackSchema,
  score: z.number(),
}).strict() as z.ZodType<ScoredTrack>;

export const QueueSchema = z.array(ScoredTrackSchema);

// --- Group Session Schema Composites ---

const BaseParticipantSchema = z.object({
  sessionId: z.string(),
  username: z.string(),
  avatarUrl: z.string().url().optional(),
  voteCount: z.number().min(0),
  joinTime: DateStringSchema,
});

const AuthenticatedParticipantSchema = BaseParticipantSchema.extend({
  role: z.enum(['admin', 'authenticated']),
  linkedAccount: z.object({
    provider: z.nativeEnum(MusicPlatform),
    providerAccountUrl: z.string().url(),
  }),
});

const GuestParticipantSchema = BaseParticipantSchema.extend({
  role: z.literal('guest'),
  linkedAccount: z.undefined().optional(),
});

export const ParticipantSchema = z.union([
  AuthenticatedParticipantSchema,
  GuestParticipantSchema,
]);

const VoteSchema = z.object({
  trackId: z.string(),
  voterId: z.string(),
  weight: z.number(),
  timeStamp: DateStringSchema,
});

const PlaybackHistoryItemSchema = z.object({
  trackId: z.string(),
  initiatedBy: z.string(),
  playedAt: DateStringSchema,
});

const NowPlayingSchema = z.object({
  track: TrackSchema,
  state: z.enum(['playing', 'paused']),
  progressMs: z.number(),
  initiatedBy: z.string(),
  clientUpdatedAt: z.string(),
  serverSyncedAt: z.string(),
});

const SessionTimestampsSchema = z.object({
  createdAt: DateStringSchema,
  updatedAt: DateStringSchema,
});

const SessionSettingsSchema = z.object({
  maxParticipants: z.number().min(1),
  votingMode: z.enum(['upvote-only', 'upvote-downvote']),
  queueMode: z.enum(['collaborative', 'host-only']),
  playbackMode: z.enum(['equal', 'hierarchical']),
  isVoteSystemEnabled: z.boolean(),
  isQueueReorderingEnabled: z.boolean(),
});

export const GroupSessionSchema: z.ZodType<GroupSession> = z.object({
  groupId: z.string(),
  platform: z.nativeEnum(MusicPlatform),
  visibility: z.enum(['public', 'private']),

  hostAccountId: z.string(),
  coHostsAccountId: z.record(z.string(), z.enum(['admin', 'authenticated'])),
  
  participants: z.array(ParticipantSchema),

  votes: z.array(VoteSchema),
  playbackHistory: z.array(PlaybackHistoryItemSchema),
  
  nowPlaying: NowPlayingSchema,
  
  timestamps: SessionTimestampsSchema,
  settings: SessionSettingsSchema,
}).strict() as z.ZodType<GroupSession>;

