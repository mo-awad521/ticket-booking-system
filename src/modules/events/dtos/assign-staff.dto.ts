import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignStaffDto {
  @IsUUID('4')
  @IsNotEmpty()
  staffId: string;
}
