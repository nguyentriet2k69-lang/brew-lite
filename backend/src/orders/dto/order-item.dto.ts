import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { SIZES, type Size } from '../pricing';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsIn(SIZES)
  size!: Size;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  toppings!: string[];

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}