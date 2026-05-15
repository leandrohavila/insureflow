import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@insureflow.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin@2026!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'insureflow', description: 'Slug do tenant' })
  @IsString()
  @IsNotEmpty()
  tenantSlug!: string;
}
