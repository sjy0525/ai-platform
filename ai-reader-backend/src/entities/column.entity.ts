import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tech_columns')
export class TechColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** 专栏名称，如"前端进阶"、"AI编程前沿" */
  @Column({ length: 100 })
  name: string;

  /** 关联关键词，用于实时拉取文章 */
  @Column({ length: 100 })
  keyword: string;

  /** 专栏简介 */
  @Column({ length: 200, default: '' })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
