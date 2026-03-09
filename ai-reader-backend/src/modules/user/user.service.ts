import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';

export interface CreateUserDto {
  username: string;
  password: string;
  nickname?: string;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<Omit<User, 'password'>> {
    const existing = await this.findByUsername(dto.username);
    if (existing) {
      throw new ConflictException('用户名已存在');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      nickname: dto.nickname || dto.username,
    });
    const saved = await this.userRepository.save(user);
    const { password: _, ...result } = saved;
    return result;
  }

  async updateKeywords(userId: string, keywords: string[]): Promise<User> {
    await this.userRepository.update(userId, {
      subscribedKeywords: keywords,
    });
    return this.findById(userId) as Promise<User>;
  }

  async addCollectedArticle(userId: string, articleId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) return null as unknown as User;
    const ids = user.collectedArticleIds || [];
    if (!ids.includes(articleId)) {
      ids.push(articleId);
      await this.userRepository.update(userId, { collectedArticleIds: ids });
    }
    return this.findById(userId) as Promise<User>;
  }

  async removeCollectedArticle(userId: string, articleId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) return null as unknown as User;
    const ids = (user.collectedArticleIds || []).filter((id) => id !== articleId);
    await this.userRepository.update(userId, { collectedArticleIds: ids });
    return this.findById(userId) as Promise<User>;
  }
}
