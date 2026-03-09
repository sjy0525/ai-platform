import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ default: '' })
  nickname: string;

  @Column({ default: '' })
  avatar: string;

  /** 订阅的关键词列表，JSON 存储 */
  @Column({ type: 'json', default: '[]' })
  subscribedKeywords: string[];

  /** 收藏的文章 ID 列表，JSON 存储 */
  @Column({ type: 'json', default: '[]' })
  collectedArticleIds: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
