import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService<T> implements OnModuleDestroy {
  protected prefix: string = '';

  constructor(@InjectRedis() protected readonly client: Redis) { }

  onModuleDestroy(): void {
    this.client.disconnect();
  }

  async get(key: string): Promise<T | null> {
    const value = await this.client.get(`${this.prefix}:${key}`);
    return value ? JSON.parse(value) : null; 
  }

  async has(key: string): Promise<boolean> {
    const value = await this.client.get(`${this.prefix}:${key}`);
    return value !== null; 
  }

  async set(key: string, value: T): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.client.set(`${this.prefix}:${key}`, serializedValue);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(`${this.prefix}:${key}`);
  }

  async setWithExpiry(key: string, value: T, expiry: number): Promise<void> {
    const serializedValue = JSON.stringify(value);
    await this.client.set(`${this.prefix}:${key}`, serializedValue, 'EX', expiry);
  }
}