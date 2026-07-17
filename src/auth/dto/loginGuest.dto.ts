import { IsNotEmpty } from 'class-validator';

export class LoginGuestDto {
  @IsNotEmpty()
  name!: string;
}
