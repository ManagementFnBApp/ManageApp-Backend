import { IsArray, IsInt } from 'class-validator';
import { ResponseCategoryDto } from './category.dto';

export class CreateShopCategoryDto {
  @IsArray()
  @IsInt({ each: true })
  category_id: number[];
}

export class ShopCategoryWithCategoryDto {
  shop_id: number;
  category_id: number;
  category: ResponseCategoryDto;
}
