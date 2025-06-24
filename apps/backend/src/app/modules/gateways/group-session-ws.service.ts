import { WsException } from "@nestjs/websockets";
import { GroupSession, GuestUserSession, isGuestUserSession, Participant, QueuedTrack, ScoredTrack, Track, AuthenticatedUserSession, Vote, isAuthenticatedUserSession, UserSession, mapUserSessionToParticipant } from "@frontend/shared";

export class WsGroupSessionService {

    /**
     * Sets the currently playing track in the session and updates the session's 'nowPlaying' state.
     * @param groupSession The group session to update.
     * @param track The track that is now playing.
     * @param state The state of the track ('playing' or 'paused').
     * @param progressMs The current progress of the track in milliseconds.
     * @param initiatedBy The user who initiated the change.
     * @param clientUpdatedAt The timestamp when the client last updated the track state.
     */
    setNowPlaying(
        groupSession: GroupSession,
        track: Track,
        state: GroupSession['nowPlaying']['state'],
        progressMs: number,
        initiatedBy: string,
        clientUpdatedAt: string,
    ) {
        groupSession.nowPlaying = {
            track,
            state,
            progressMs,
            initiatedBy,
            clientUpdatedAt,
            serverSyncedAt: new Date().toISOString(),
        } as GroupSession['nowPlaying'];
        
        groupSession.timestamps.updatedAt = new Date().toISOString();
    }

    /**
     * Updates the state of the currently playing track in the session.
     * @param groupSession The group session to update.
     * @param state The new state of the track.
     * @param progressMs The new progress of the track.
     * @param clientUpdatedAt The timestamp when the client last updated the track state.
     */
    updateNowPlayingState(
        groupSession: GroupSession,
        state: GroupSession['nowPlaying']['state'],
        progressMs: number,
        clientUpdatedAt: string,
    ) {
        if (!groupSession.nowPlaying) return;

        // Update the track's state and progress
        groupSession.nowPlaying.state = state;
        groupSession.nowPlaying.progressMs = progressMs;
        groupSession.nowPlaying.clientUpdatedAt = clientUpdatedAt;
        groupSession.nowPlaying.serverSyncedAt = new Date().toISOString();

        groupSession.timestamps.updatedAt = new Date().toISOString();
    }

    /**
     * Clears the 'nowPlaying' track from the session.
     * @param groupSession The group session to update.
     */
    clearNowPlaying(groupSession: GroupSession) {
        groupSession.nowPlaying = null;
        groupSession.timestamps.updatedAt = new Date().toISOString();
    }

    addToPlaybackHistory(
        groupSession: GroupSession,
        trackId: string,
        sessionId: string
    ): void {
        if (groupSession.playbackHistory.length >= 10) {
            groupSession.playbackHistory.shift(); 
        }

        groupSession.playbackHistory.push({
            trackId,
            initiatedBy: sessionId,
            playedAt: new Date().toISOString(),
        });

        groupSession.timestamps.updatedAt = new Date().toISOString();
    }
    

    /**
     * Finds a specific track in the queue by its track ID.
     * @param queue The queue of scored tracks.
     * @param trackId The ID of the track to find.
     * @returns The found ScoredTrack or undefined if not found.
     */
    findTrackInQueue(queue: ScoredTrack[], trackId: string): ScoredTrack | undefined {
        return queue.find(scoredTrack => scoredTrack.queuedTrack.trackDetails.id === trackId);
    }

    /**
     * Finds a specific vote in the session for a given track and voter.
     * @param groupSession The group session to search within.
     * @param voterId The ID of the voter.
     * @param trackId The ID of the track.
     * @returns The found Vote or undefined if not found.
     */
    findVote(groupSession: GroupSession, voterId: string, trackId: string): Vote | undefined {
        return groupSession.votes.find(vote => vote.voterId === voterId && vote.trackId === trackId);
    }

    /**
     * Updates the weight of a vote in the group session.
     * @param groupSession The group session to update.
     * @param voterId The ID of the voter.
     * @param trackId The ID of the track.
     * @param voteWeight The new weight for the vote.
     */
    updateVoteWeight(groupSession: GroupSession, voterId: string, trackId: string, voteWeight: number): void {
        groupSession.votes.forEach(vote => {
            if (vote.voterId === voterId && vote.trackId === trackId) {
                vote.weight = voteWeight;
                vote.timeStamp = new Date().toISOString();
            }
        });
    }

    /**
     * Records a new vote for a track by a user in the session.
     * @param groupSession The group session to update.
     * @param voterId The ID of the voter.
     * @param trackId The ID of the track.
     * @param voteWeight The weight of the vote.
     */
    recordTrackVote(groupSession: GroupSession, voterId: string, trackId: string, voteWeight: number) {
        groupSession.votes.push({
            trackId,
            voterId,
            weight: voteWeight,
            timeStamp: new Date().toISOString()
        });
    }

    /**
     * Removes a specific vote from a track in the group session.
     * @param groupSession The group session to update.
     * @param voterId The ID of the voter.
     * @param trackId The ID of the track.
     */
    removeTrackVote(groupSession: GroupSession, voterId: string, trackId: string) {
        groupSession.votes = groupSession.votes.filter(vote => !(vote.trackId === trackId && vote.voterId === voterId));
    }

    /**
     * Adds a user to the group session as a participant.
     * @param groupSession The group session to add the user to.
     * @param userSession The user session of the participant.
     * @throws WsException if the session is full or the participant already exists.
     */
    addParticipantToSession(groupSession: GroupSession, userSession: UserSession) {
        if (this.isSessionFull(groupSession)) {
            throw new WsException('This session has reached the maximum number of participants.');
        }

        const isAdmin = isAuthenticatedUserSession(userSession) && userSession.userId === groupSession.hostAccountId;
        const participant = mapUserSessionToParticipant(userSession, isAdmin);

        // Loop through current participants to check for existing users
        for (let i = 0; i < groupSession.participants.length; i++) {
            const groupParticipant = groupSession.participants[i];

            // Handling authenticated users
            if (isAuthenticatedUserSession(userSession)) {
                if (groupParticipant.role === 'guest') continue;

                // Check if this authenticated user matches the incoming user session
                if (
                    groupParticipant.linkedAccount.provider === userSession.activeAccount.provider &&
                    groupParticipant.linkedAccount.providerAccountUrl === userSession.activeAccount.providerAccountUrl
                ) {
                    // If sessionId matches, return the session (no need to update)
                    if (groupParticipant.sessionId === userSession.sessionId) {
                        return groupSession;
                    } else {
                        // Replace the existing authenticated participant
                        groupSession.participants[i] = participant;
                        groupSession.timestamps.updatedAt = new Date().toISOString();
                        return groupSession;
                    }
                }
            } else {
                if (groupParticipant.role !== 'guest') continue;

                // If guest sessionId matches, return the session (no need to update)
                if (groupParticipant.sessionId === userSession.sessionId) {
                    return groupSession;
                }
            }
        }

        // If no matching participant was found, add the new participant
        groupSession.participants.push(participant);
        groupSession.timestamps.updatedAt = new Date().toISOString();
    }

    /**
     * Removes a participant from the session.
     * @param groupSession The group session to update.
     * @param userSession The user session of the participant to remove.
     * @returns True if the participant was successfully removed, false otherwise.
     */
    removeParticipantFromSession(groupSession: GroupSession, userSession: AuthenticatedUserSession | GuestUserSession): boolean {

        if (this.isUserCoHostInSession(groupSession, userSession.sessionId)) {
            delete groupSession.coHostsAccountId[userSession.sessionId]
        }

        const participantIndex = this.findParticipantIndex(groupSession, userSession);

        if (participantIndex === -1) {
            return false;
        }

        // Remove the participant from the session
        groupSession.participants.splice(participantIndex, 1);
        groupSession.timestamps.updatedAt = new Date().toISOString();

        return true;
    }

    /**
     * Creates a new queued track object to add to the queue.
     * @param trackDetails The details of the track to be queued.
     * @param user The user who is adding the track.
     * @returns A QueuedTrack object.
     */
    createQueuedTrack(trackDetails: Track, user: AuthenticatedUserSession | GuestUserSession) {
        const username = isGuestUserSession(user) ? undefined : user.activeAccount.username;
        const queuedTrack: QueuedTrack = {
            trackDetails,
            addedBy: {
                sessionId: user.sessionId,
                username
            },
            addedAt: new Date().toISOString()
        };
        return queuedTrack;
    }

    private isMatchingParticipant(participant: Participant, userSession: UserSession): boolean {
        if (isAuthenticatedUserSession(userSession)) {
            // If participant is a guest, skip comparison
            if (participant.role === 'guest') return false;

            // Match based on linked account provider and profile URL
            return (
                participant.linkedAccount.provider === userSession.activeAccount.provider &&
                participant.linkedAccount.providerAccountUrl === userSession.activeAccount.providerAccountUrl
            )
        } else {
            // If user is a guest, ensure participant is also a guest and session IDs match
            if (participant.role !== 'guest') return false;

            return participant.sessionId === userSession.sessionId;
        }
    }

    /**
     * Finds the index of a participant in the session based on the user session.
     * @param groupSession The group session to search within.
     * @param userSession The user session to find.
     * @returns The index of the participant, or -1 if not found.
     */
    private findParticipantIndex(
        groupSession: GroupSession,
        userSession: UserSession
    ): number {
        return groupSession.participants.findIndex(participant =>
            this.isMatchingParticipant(participant, userSession)
        );
    }

    /**
     * Checks if a user session is a co-host in the group session.
     * @param groupSession The group session to check.
     * @param sessionId The session ID to check.
     * @returns True if the user is a co-host, false otherwise.
     */
    private isUserCoHostInSession = (groupSession: GroupSession, sessionId: string) =>
        sessionId in groupSession.coHostsAccountId;

    /**
     * Checks if the group session has reached the maximum number of participants.
     * @param groupSession The group session to check.
     * @returns True if the session is full, false otherwise.
     */
    private isSessionFull(groupSession: GroupSession): boolean {
        return groupSession.settings.maxParticipants <= groupSession.participants.length;
    }

    /**
     * Adjusts the scores of the tracks in the queue to ensure that no two consecutive tracks have the same score.
     * It loops through the queue in reverse order and updates the score of the track if its score is lower or equal
     * to the track before it in the queue.
     * 
     * @param queue - The list of `ScoredTrack` objects that represents the current queue of tracks.
     */
    adjustTrackScores(queue: ScoredTrack[]) {
        for (let i = queue.length - 1; i > 0; i--) {
            if (queue[i - 1].score <= queue[i].score) {
                queue[i - 1].score = queue[i].score + 1;
            }
        }
    }

}
