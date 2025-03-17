import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group, GroupInvite } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async findGroup(id: string): Promise<Group> {
        const group = await this.prisma.group.findUnique({
            where: { id },
        });

        if (!group) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return group;
    }

    async findUserGroup(id: string, userId: string): Promise<Group> {
        const group = await this.findGroup(id);

        if (group.creatorId !== userId) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return group;
    }

    async findAllGroups(): Promise<Group[]> {
        const groups = await this.prisma.group.findMany();
        return groups;
    }
    
    async findUserGroups(userId: string): Promise<Group[]> {
        const groups = await this.prisma.group.findMany({
            where: { creatorId: userId }
        });
        return groups;
    }

    async createGroup(creatorId: string, dto: CreateGroupDto): Promise<Group> {
        return this.prisma.group.create({
            data: {
                ...dto,
                code: this.generateGroupCode(),
                creator: {
                    connect: { id: creatorId }
                },
                isActive: false,
            },
        });
    }

    async deleteGroup(id: string, userId?: string): Promise<void> {
        if(userId)
            await this.findUserGroup(id, userId);
        else
            await this.findGroup(id);
       
        await this.prisma.group.delete({ 
            where: { id }
        });
    }

    async updateGroup(id: string, dto: Partial<UpdateGroupDto>, userId?: string): Promise<Group> {
        if(userId)
            await this.findUserGroup(id, userId);
        else
            await this.findGroup(id);

        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }

    // Not yet used 

    async createGroupInvite(groupId: string, expiresAt: Date): Promise<GroupInvite> {
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return this.prisma.groupInvite.create({
            data: {
                code: this.generateGroupCode(),
                expiresAt,
                groupId,
            },
        });
    }

    async validateInviteCode(code: string): Promise<Group> {
        const invite = await this.prisma.groupInvite.findFirst({
            where: { code, expiresAt: { gt: new Date() } },
            include: { group: true },
        });

        if (!invite) throw new NotFoundException('Invalid or expired invite code');
        return invite.group;
    }

    async updateSessionBackup(groupId: string, sessionData: any): Promise<Group> {
        const group = await this.findGroup(groupId); 
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: { sessionBackup: sessionData },
        });
    }

    public async ensureUniqueGroupName(userId: string, name: string): Promise<void> {
        const existingGroup = await this.prisma.group.findFirst({
            where: {
                creatorId: userId,
                name
            }
        });
        if (existingGroup) {
            throw new ConflictException('A group with this name already exists');
        }
    }

    private generateGroupCode(): string {
        return uuidv4().substring(0, 8).toUpperCase();
    }
}