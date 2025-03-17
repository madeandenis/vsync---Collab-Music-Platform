import { WsException } from "@nestjs/websockets";
import { AuthSocket } from "../../common/interfaces/socket-session.interface";
import { GroupSession, GuestUserSession, isGuestUserSession, mapUserToMember, QueuedTrack, Track, UserSession, Vote } from "@frontend/shared";

export class WsGroupSessionService 
{

    findVote(groupSession: GroupSession, voterId: string, trackId: string): Vote
    {
        return groupSession.votingHistory.find(vote => vote.voterId === voterId && vote.trackId === trackId);
    }

    updateVoteWeight(groupSession: GroupSession, voterId: string, trackId: string, voteWeight: number): void
    {
        groupSession.votingHistory.forEach(vote => {
            if(vote.voterId === voterId && vote.trackId === trackId)
            {
                vote.weight = voteWeight;
                vote.timeStamp = new Date().toISOString();
            }
        });
    }

    recordTrackVote(groupSession: GroupSession, voterId: string, trackId: string, voteWeight: number)
    {
        groupSession.votingHistory.push({
            trackId,
            voterId,
            weight: voteWeight, 
            timeStamp: new Date().toISOString()
        })
    }

    addClientToSession(groupSession: GroupSession, socket: AuthSocket)
    {
        const clientSessionID = socket.data.sessionID;

        if(this.isSessionFull(groupSession))
        {
            throw new WsException('This session has reached the maximum number of participants.');
        }

        if(this.memberAlreadyExists(groupSession, clientSessionID))
        {
            return groupSession;
        }

        const user = socket.data.session?.user;
        const member = mapUserToMember(user);

        groupSession.metadata.membersCount++;
        groupSession.members.push(member);
        groupSession.metadata.lastUpdated = new Date().toISOString();
    }

    removeMemberFromSession(groupSession: GroupSession, socket: AuthSocket): boolean
    {
        const sessionID = socket.data.sessionID;

        const memberIndex = this.findMemberIndex(groupSession, sessionID);
        if(memberIndex === -1)
        {
            return false; // if client was never added to the session (eg. failed connection atempt)
        }

        groupSession.metadata.membersCount--;
        groupSession.members.splice(memberIndex, 1);
        groupSession.metadata.lastUpdated = new Date().toISOString();

        return true;
    }

    createQueuedTrack(trackDetails: Track, user: UserSession | GuestUserSession)
    {
        const username = isGuestUserSession(user) ? undefined : user.activeAccount.username;        
        return {
            trackDetails,
            addedBy: {
                sessionId: user.sessionId,
                username
            },
            addedAt: new Date().toISOString()
        } as QueuedTrack
    }

    private memberAlreadyExists(groupSession: GroupSession, clientSessionID: string): boolean
    {
        return groupSession.members.some(member => member.sessionId === clientSessionID);
    }

    private findMemberIndex(groupSession: GroupSession, clientSessionID: string): number
    {
        return groupSession.members.findIndex(member => member.sessionId === clientSessionID);
    }

    private isSessionFull(groupSession: GroupSession): boolean {
        const maxParticipants = groupSession.maxParticipants;
        return maxParticipants !== undefined && groupSession.metadata.membersCount >= maxParticipants;
    }
}