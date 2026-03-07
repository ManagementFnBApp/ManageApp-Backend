import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

// ==============================
// Shift template DTOs
// ==============================

export class CreateShiftDto {
  @IsString()
  shift_name: string;
}

export class ShiftResponseDto {
  id: number;
  shift_name: string;
}

// ==============================
// ShiftUser DTOs
// ==============================

export class AssignShiftDto {
  @IsInt()
  @Min(1)
  shift_id: number;

  @IsInt()
  @Min(1)
  user_id: number;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;
}

export class UpdateShiftUserDto {
  @IsOptional()
  @IsDateString()
  start_time?: string;

  @IsOptional()
  @IsDateString()
  end_time?: string;
}

export class ShiftUserResponseDto {
  id: number;
  shift_id: number;
  shift_name: string;
  user_id: number;
  username: string;
  shop_id: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  deactivated_at: string | null;
}
