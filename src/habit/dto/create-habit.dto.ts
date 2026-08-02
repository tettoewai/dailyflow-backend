import { ParseJson } from '@/common/decorators/parse-json.decorator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  DayOfWeek,
  FrequencyType,
  HabitUnit,
} from '../../../generated/prisma/enums';

export class CreateHabitDto {
  @ApiProperty({ description: 'Habit title', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title!: string;

  @ApiProperty({
    description: 'Habit description',
    maxLength: 255,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiProperty({ description: 'Habit icon', maxLength: 50 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  icon!: string;

  @ApiProperty({
    description: 'Habit color (hex or CSS color)',
    example: '#6C5CE7',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  color!: string;

  @ApiProperty({
    description: 'Frequency type',
    enum: FrequencyType,
    default: FrequencyType.DAILY,
  })
  @IsEnum(FrequencyType)
  @IsOptional()
  frequencyType?: FrequencyType;

  @ApiProperty({
    description: 'Target count per period',
    default: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  target?: number;

  @ApiProperty({
    description: 'Unit of measurement',
    enum: HabitUnit,
    default: HabitUnit.TIMES,
  })
  @IsEnum(HabitUnit)
  @IsOptional()
  unit?: HabitUnit;

  @ApiProperty({
    description: 'Custom schedule (JSON string)',
    example: '{"days":[1,3,5],"weeks":[1,3],"monthDay":15}',
    required: false,
  })
  @IsJSON()
  @IsOptional()
  @MaxLength(1000)
  @ParseJson('Invalid JSON format for customSchedule')
  customSchedule?: Record<string, any>;

  @ApiProperty({
    description: 'Selected days for weekly habits',
    enum: DayOfWeek,
    isArray: true,
    required: false,
  })
  @IsArray()
  @IsEnum(DayOfWeek, { each: true })
  @IsOptional()
  selectedDays?: DayOfWeek[];

  @ApiProperty({ description: 'Category ID', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Tag IDs', type: [String], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
