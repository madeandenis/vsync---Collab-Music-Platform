import { WsException } from "@nestjs/websockets";
import { GroupSession, mapUserToMember, Vote } from "../../common/interfaces/group-session.interface";
import { AuthSocket } from "../../common/interfaces/socket-session.interface";
import { GuestUserSession, isGuestUserSession, UserSession } from "../../common/interfaces/user-session.interface";
import { QueuedTrack } from "../cache/services/track-queue.service";
import { Track } from "@frontend/shared";

export class WsGroupSessionService 
{

    findUserVote(groupSession: GroupSession, client: AuthSocket)
    {
        const clientSessionID = client.sessionID;

        return groupSession.votingHistory.find(vote => vote.voterId === clientSessionID);
    }

    recordTrackVote(groupSession: GroupSession, trackId: string, voteWeight, client: AuthSocket)
    {
        const clientSessionID = client.sessionID;

        groupSession.votingHistory.push({
            trackId,
            voterId: clientSessionID,
            weight: voteWeight, 
            timeStamp: new Date().toISOString()
        })
    }

    addClientToSession(groupSession: GroupSession, client: AuthSocket)
    {
        const clientSessionID = client.sessionID;

        if(this.isSessionFull(groupSession))
        {
            throw new WsException('This session has reached the maximum number of participants.');
        }

        if(this.memberAlreadyExists(groupSession, clientSessionID))
        {
            return groupSession;
        }

        const user = client.session?.user;
        const member = mapUserToMember(user);

        groupSession.metadata.membersCount++;
        groupSession.members.push(member);
        groupSession.metadata.lastUpdated = new Date().toISOString();
    }

    removeClientFromSession(groupSession: GroupSession, client: AuthSocket)
    {
        const clientSessionID = client.sessionID;

        const memberIndex = this.findMemberIndex(groupSession, clientSessionID);
        if(memberIndex === -1)
        {
            throw new WsException(`Client is not part of the current group session.`);
        }

        groupSession.metadata.membersCount--;
        groupSession.members.splice(memberIndex, 1);
        groupSession.metadata.lastUpdated = new Date().toISOString();
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