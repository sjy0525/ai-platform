import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../../entities/analytics-event.entity';

export interface CaptureAnalyticsEventDto {
  event: string;
  distinctId?: string;
  source?: string;
  properties?: Record<string, unknown>;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly analyticsRepository: Repository<AnalyticsEvent>,
  ) {}

  async captureEvent(dto: CaptureAnalyticsEventDto) {
    if (!dto.event?.trim()) {
      return null;
    }

    const event = this.analyticsRepository.create({
      event: dto.event.trim(),
      distinctId: dto.distinctId?.trim() || 'anonymous',
      source: dto.source?.trim() || 'web_app',
      properties: dto.properties || null,
    });

    return this.analyticsRepository.save(event);
  }

  async captureEventSafely(dto: CaptureAnalyticsEventDto) {
    try {
      await this.captureEvent(dto);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Skipping analytics event "${dto.event}": ${message}`);
    }
  }
}
