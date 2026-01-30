import { Controller, Get, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { GpsService } from './gps.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('gps')
@Controller('gps')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GpsController {
  constructor(private readonly gpsService: GpsService) {}

  @Get('positions')
  @ApiOperation({ summary: 'Get latest positions for all vehicles' })
  getLatestPositions() {
    return this.gpsService.getLatestPositions();
  }

  @Get('vehicle/:vehicleId/history')
  @ApiOperation({ summary: 'Get GPS history for a vehicle' })
  @ApiQuery({ name: 'hours', required: false, type: Number })
  getVehicleHistory(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Query('hours') hours?: number,
  ) {
    return this.gpsService.getVehicleHistory(vehicleId, hours || 1);
  }
}
