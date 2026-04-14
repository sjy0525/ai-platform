import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  event: string;

  @Column({ length: 100, default: 'anonymous' })
  distinctId: string;

  @Column({ length: 50, default: 'admin' })
  source: string;

  @Column({ type: 'json', nullable: true })
  properties: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
