import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('articles')
export class Article {
  @PrimaryColumn()
  id: string;

  @Column()
  title: string;

  @Column({ default: '' })
  author: string;

  @Column({ default: 0 })
  hot: number;

  @Column()
  url: string;

  @Column({ default: '' })
  mobileUrl: string;

  /** 来源平台：juejin, zhihu, csdn 等 */
  @Column({ default: '' })
  source: string;

  /** 标签/分类，用于热榜分区 */
  @Column({ default: '' })
  tag: string;

  @CreateDateColumn()
  createdAt: Date;
}
