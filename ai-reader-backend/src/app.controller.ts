import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private configService: ConfigService) {}

  @Get()
  getHello(): string {
    const port = this.configService.get('PORT');
    const nodeEnv = this.configService.get('NODE_ENV');
    
    return `AI智库平台后端运行中 - 端口:${port} - 环境:${nodeEnv}`;
  }
}