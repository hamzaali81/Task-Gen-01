import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ example: 'Create a budget for a corporate holiday party for 100 people' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
