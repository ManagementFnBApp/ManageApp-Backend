import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsString, Min } from 'class-validator';

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

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateShiftUserDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ShiftUserResponseDto {
  id: number;
  shift_id: number;
  shift_name: string;
  user_id: number;
  username: string;
  shop_id: number;
  notes: string | null;
  // Ngày làm việc của assignment (định dạng YYYY-MM-DD)
  date: string;
  created_at: string;
}
