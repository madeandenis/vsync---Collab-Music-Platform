import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { Group, GroupInvite } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GroupsService {
    constructor(private prisma: PrismaService) { }

    async createGroup(creatorId: string, dto: CreateGroupDto): Promise<Group> {
        return this.prisma.group.create({
            data: {
                ...dto,
                code: this.generateGroupCode(),
                creator: {
                    connect: { id: creatorId }
                },
                isActive: true,
            },
        });
    }

    async updateGroup(id: string, creatorId: string, dto: UpdateGroupDto): Promise<Group> {
        const group = await this.prisma.group.findUnique({
            where: { id },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        if (group.creatorId !== creatorId) {
            throw new ForbiddenException('You do not have permission to update this group');
        }

        // Update the group
        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }

    async deleteGroup(id: string, creatorId: string): Promise<void> {
        const group = await this.prisma.group.findUnique({ where: { id, creatorId } });
        if (!group) {
            throw new NotFoundException('Group not found or access denied');
        }

        await this.prisma.group.delete({ where: { id, creatorId } });
    }

    async updateGroupImage(id: string, userId: string, imageUrl: string): Promise<Group> {
        const group = await this.prisma.group.findUnique({
            where: { id },
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        if (group.creatorId !== userId) {
            throw new ForbiddenException('You do not have permission to update this group');
        }

        return this.prisma.group.update({
            where: { id },
            data: { imageUrl }, 
        });
    }

    async getUserGroups(creatorId: string): Promise<Group[]> {
        return await this.prisma.group.findMany({
            where: { creatorId }
        });
    }

    async getGroupById(id: string, creatorId: string): Promise<Group> {
        const group = await this.prisma.group.findFirst({
            where: { id, creatorId },
            include: { creator: true, invites: true },
        });

        if (!group) throw new NotFoundException('Group not found');
        return group;
    }

    async getAllGroups(): Promise<Group[]> {
        return await this.prisma.group.findMany();
    }

    async getGroupByIdAdmin(id: string): Promise<Group> {
        const group = await this.prisma.group.findUnique({
            where: { id },
            include: { creator: true, invites: true },
        });
        if (!group) {
            throw new NotFoundException('Group not found');
        }
        return group;
    }

    async updateGroupAdmin(id: string, dto: UpdateGroupDto): Promise<Group> {
        const group = await this.getGroupByIdAdmin(id);
        return this.prisma.group.update({
            where: { id },
            data: dto,
        });
    }

    async deleteGroupAdmin(id: string): Promise<void> {
        const group = await this.getGroupByIdAdmin(id);
        await this.prisma.group.delete({ where: { id } });
    }

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
        const group = await this.prisma.group.findUnique({ where: { id: groupId } });
        if (!group) {
            throw new NotFoundException('Group not found');
        }

        return this.prisma.group.update({
            where: { id: groupId },
            data: { sessionBackup: sessionData },
        });
    }

    public async ensureGroupNameIsUnique(userId: string, name: string): Promise<void> {
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