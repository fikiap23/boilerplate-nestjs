import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'superadmin@example.com',
    description: 'Email',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Superadmin123!',
    description: 'Password',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
