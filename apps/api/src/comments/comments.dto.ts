import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateCommentDto {
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @Matches(/[^\s\u200B-\u200D\uFEFF]/)
  content!: string;
  @IsOptional()
  @IsString()
  @MaxLength(64)
  replyToCommentId?: string;
}

export class CommentsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) pageSize = 20;
  @IsOptional() @IsIn(['oldest', 'latest']) sort: 'oldest' | 'latest' = 'oldest';
}
