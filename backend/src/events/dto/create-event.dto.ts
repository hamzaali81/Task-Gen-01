import { IsString, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({ example: 'Annual Company Gala' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
