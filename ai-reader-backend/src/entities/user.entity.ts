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
  @Column({ type: 'json', nullable: true })
  subscribedKeywords: string[] | null;

  /** 收藏的文章 ID 列表，JSON 存储 */
  @Column({ type: 'json', nullable: true })
  collectedArticleIds: string[] | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
