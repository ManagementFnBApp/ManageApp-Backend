import { IsInt, Min } from 'class-validator';

export class CreateRedemptionDto {
  @IsInt()
  @Min(1)
  customer_id: number;

  @IsInt()
  @Min(1)
  merchandise_id: number;
}

export class RedemptionResponseDto {
  id: number;
  customer_id: number;
  merchandise_id: number;
  shop_id: number;
  point_spent: number;
  remaining_points: number;
  redemption_date: string;
}

export class RedemptionHistoryDto {
  id: number;
  customer_id: number;
  customer_name: string | null;
  merchandise_id: number;
  merchandise_name: string;
  shop_id: number;
  point_spent: number;
  redemption_date: string;
}
