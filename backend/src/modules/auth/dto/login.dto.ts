import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @IsString()
  @MinLength(4, { message: 'Senha deve ter pelo menos 4 caracteres' })
  senha: string;
}
