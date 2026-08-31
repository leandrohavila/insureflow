import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'maria@corretoraavila.com.br' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: 'Maria Silva' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Corretora' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ type: [String], description: 'IDs dos roles (perfis)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleIds!: string[];

  @ApiProperty({ type: [String], description: 'IDs das empresas (BUs)' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  businessUnitIds!: string[];

  @ApiPropertyOptional({ description: 'Empresa principal ao criar' })
  @IsOptional()
  @IsString()
  primaryBusinessUnitId?: string;
}

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  initials?: string;
}

export class SetUserStatusDto {
  @ApiProperty()
  @IsBoolean()
  isActive!: boolean;
}

export class ChangeUserPasswordDto {
  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class SetUserRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  roleIds!: string[];
}

export class SetUserBusinessUnitsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  businessUnitIds!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  primaryBusinessUnitId?: string | null;
}
