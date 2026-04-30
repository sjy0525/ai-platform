import { Body, Controller, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('capture')
  capture(
    @Body()
    body: {
      event: string;
      distinctId?: string;
      source?: string;
      properties?: Record<string, unknown>;
    },
  ) {
    return this.analyticsService.captureEvent(body);
  }
}
