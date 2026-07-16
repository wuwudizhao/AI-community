import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import {
  FORUM_CATEGORY_FILTERS,
  POST_CATEGORY_VALUES,
  type ForumCategoryFilter,
  type PostCategoryValue,
} from '@liftoff/shared-types';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreatePostDto {
  @IsString()
  @IsIn(POST_CATEGORY_VALUES)
  category!: PostCategoryValue;

  @Transform(trim)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  title?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(50_168)
  @Matches(/[^\s\u200B-\u200D\uFEFF]/)
  contentMarkdown!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @Transform(({ value }: { value: unknown }) => {
    if (!Array.isArray(value)) return value;
    return (value as unknown[]).map((tag) => (typeof tag === 'string' ? tag.trim() : tag));
  })
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(30, { each: true })
  @Matches(/[^\s\u200B-\u200D\uFEFF]/, { each: true })
  tags: string[] = [];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class PostsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize = 20;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  @Matches(/[^\s\u200B-\u200D\uFEFF]/)
  q?: string;

  @IsOptional()
  @IsIn(['latest'])
  sort = 'latest' as const;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  @Matches(/[^\s\u200B-\u200D\uFEFF]/)
  tag?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsIn(FORUM_CATEGORY_FILTERS)
  category?: ForumCategoryFilter;
}
