import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AccountDTO } from './dto/accunt.dto';
import { Account, MusicPlatform } from '@prisma/client';
import { SelectOptions } from '../../common/types/select-options.type';

@Injectable()
export class AccountsService {

    constructor(private readonly prismaService: PrismaService) {}
    
    async getRefreshToken(provider: MusicPlatform, providerAccountId: string)
    {
        return (await (this.getAccount(provider, providerAccountId, { refreshToken: true }))).refreshToken
    }

    async getAccount(provider: MusicPlatform, providerAccountId: string, select?: SelectOptions<Account>)
    {
        return await this.prismaService.account.findUnique({
            where: {
                provider,
                providerAccountId
            } 
        })
    }

    async createAccount(accountDto: AccountDTO)
    {
        return await this.prismaService.account.create({
            data: {
                user: {
                    connect: {
                        id: accountDto.userId
                    }
                },
                sessionId: accountDto.sessionId,
                provider: accountDto.provider,
                providerAccountId: accountDto.providerAccountId,
                username: accountDto.username,
                avatarUrl: accountDto.avatarUrl,
                refreshToken: accountDto.refreshToken,
            }
        })
    }

    async upsertAccount(accountDto: AccountDTO)
    {
        return await this.prismaService.account.upsert({
            where: {
                provider: accountDto.provider,
                providerAccountId: accountDto.providerAccountId
            },
            update: {
                username: accountDto.username,
                avatarUrl: accountDto.avatarUrl,
                refreshToken: accountDto.refreshToken
            },
            create: {
                user: {
                    connect: {
                        id: accountDto.userId
                    }
                },
                sessionId: accountDto.sessionId,
                provider: accountDto.provider,
                providerAccountId: accountDto.providerAccountId,
                username: accountDto.username,
                avatarUrl: accountDto.avatarUrl,
                refreshToken: accountDto.refreshToken,
            }
        })
    }

}
