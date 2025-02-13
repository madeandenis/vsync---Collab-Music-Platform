import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../../common/utils/logger.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private logger = createLogger(PrismaService.name);
    
    async onModuleInit() {
        try
        {
            await this.$connect();
            this.logger.info('✅ Successfully connected to the database')
        } 
        catch (error)
        {
            this.logger.error(error, '🆘 Error connecting to the database:')
        }
    }
    async onModuleDestroy() {
        try
        {
            await this.$disconnect();
        } 
        catch (error)
        {
            this.logger.error(error, '🆘 Error disconnecting from the database:')
        }
    }
}
