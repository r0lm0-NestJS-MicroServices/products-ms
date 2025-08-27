import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
    @IsPositive()
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    page?: number = 1;

    @IsPositive()
    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    limit?: number = 10;
}