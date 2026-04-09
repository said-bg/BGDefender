import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { UserPlan, UserRole } from '../../entities/user.entity';

export class UpdateAdminUserDto {
  @IsOptional()
  @IsEnum(UserPlan)
  plan?: UserPlan;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
