import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'builder@example.com', maxLength: 254 })
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ minLength: 10, maxLength: 128 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: '密码必须包含小写字母' })
  @Matches(/[A-Z]/, { message: '密码必须包含大写字母' })
  @Matches(/[0-9]/, { message: '密码必须包含数字' })
  password!: string;

  @ApiProperty({ pattern: '^[a-zA-Z0-9_]{3,24}$' })
  @Matches(/^[a-zA-Z0-9_]{3,24}$/, { message: '用户名只能包含字母、数字和下划线，长度 3-24' })
  username!: string;

  @ApiProperty({ minLength: 1, maxLength: 40 })
  @IsString()
  @Length(1, 40)
  displayName!: string;
}

export class VerifyEmailDto {
  @IsString()
  @MinLength(20)
  @MaxLength(256)
  token!: string;
}

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  currentPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[a-z]/, { message: '密码必须包含小写字母' })
  @Matches(/[A-Z]/, { message: '密码必须包含大写字母' })
  @Matches(/[0-9]/, { message: '密码必须包含数字' })
  newPassword!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  confirmPassword!: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(254)
  email!: string;
}
