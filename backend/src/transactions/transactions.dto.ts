import { Transform, Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { TransactionType } from '../generated/prisma/client';

export class CreateTransactionDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  description!: string;
  @IsInt()
  @Min(1)
  @Max(2147483647)
  amount!: number;
  @IsEnum(TransactionType)
  type!: TransactionType;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date!: string;
  @IsUUID()
  categoryId!: string;
}

export class UpdateTransactionDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  description?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  amount?: number;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEnum(TransactionType)
  type?: TransactionType;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsUUID()
  categoryId?: string;
}

export class PeriodDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startDate?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endDate?: string;
}

export class TransactionQueryDto extends PeriodDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page = 1;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
