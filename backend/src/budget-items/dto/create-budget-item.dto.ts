import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBudgetItemDto {
  @ApiProperty({ example: 'Venue' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Grand ballroom rental for 200 guests' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'USD' })
  @IsString()
  @IsNotEmpty()
  currency: string;
}
