export namespace Events {
    export const Group = {
        QUEUE: 'group_queue',
        QUEUE_CONFIG: 'queue_config',
        UPDATE_QUEUE: 'group_update_queue',
        UPDATE_QUEUE_CONFIG: 'update_queue_config',
        REQUEST_QUEUE_CONFIG: 'request_queue_config',
        SESSION: 'group_session',
        EMIT_SESSION: 'group_emit_session',
    } as const;

    export const Track = {
        NOW_PLAYING: 'track_now_playing',
        PLAY: 'track_play',
        PAUSE: 'track_pause',
        RESUME: 'track_resume',
        SEEK: 'track_seek',
        NEXT: 'track_next',
        PREVIOUS: 'track_previous',
        ADD: 'track_add',
        REMOVE: 'track_remove',
        UPVOTE: 'track_upvote',
        DOWNVOTE: 'track_downvote',
        WITHDRAW_VOTE: 'track_withdraw_vote',
    } as const;

    export const Socket = {
        DISCONNECT: 'disconnect',
        ERROR: 'error',
        CONNECT_ERROR: 'connect_error',
    } as const;
}
