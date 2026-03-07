import { ResponseCategoryDto } from './category.dto';

export class CreateShopCategoryDto {
  category_id: number[];
}

export class ShopCategoryWithCategoryDto {
  shop_id: number;
  category_id: number;
  category: ResponseCategoryDto;
}
