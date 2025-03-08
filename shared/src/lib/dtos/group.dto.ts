import { MusicPlatform, Group as MusicGroup } from "@prisma/client";

export interface CreateGroupDto {
    name: string; 
    description?: string; 
    imageUrl?: string;
    isPublic?: boolean;
    platform: MusicPlatform; 
}

export interface UpdateGroupDto {
    name?: string; 
    description?: string; 
    imageUrl?: string; 
    isPublic?: boolean; 
}

export interface Group extends MusicGroup {}