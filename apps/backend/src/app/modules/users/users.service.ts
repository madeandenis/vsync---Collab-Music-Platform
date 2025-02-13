import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { SelectOptions } from '../../common/types/select-options.type';

@Injectable()
export class UsersService {
    constructor(private readonly prismaService: PrismaService){}

    async createUser(email: string)
    {
        return await this.prismaService.user.create({
            data: { email }
        })
    }

    async createGuestUser(sessionId: string)
    {
        return await this.prismaService.guestUser.create({
            data: { sessionId }
        });
    }

    async upsertUser(email: string, selectOptions?: SelectOptions<User>)
    {
        return await this.prismaService.user.upsert({
            where: {
                email
            },
            update: {
                updatedAt: new Date(),
            },
            create: {
                email,
            },
            select: selectOptions
        });
    }

    async deleteGuestUser(sessionId: string)
    {
        return await this.prismaService.guestUser.deleteMany({
            where: {
                sessionId
            }
        });
    }
}
