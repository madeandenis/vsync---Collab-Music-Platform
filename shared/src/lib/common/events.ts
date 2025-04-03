export const Events = {
    Group: {
        Queue: 'group_queue',
        UpdateQueue: 'group_update_queue',
        Session: 'group_session',
    },
    Track: {
        Add: 'track_add',
        Remove: 'track_remove',
        UpVote: 'track_upvote',
        DownVote: 'track_downvote',
        WithdrawVote: 'track_withdraw_vote'
    },
    Socket: {
        Disconnect: 'disconnect',
        Error: 'error',
        ConnectError: 'connect_error',
    },
};
