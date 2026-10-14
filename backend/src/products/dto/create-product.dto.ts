import { IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateProductDto {
	@IsString()
	@MinLength(1)
	@MaxLength(160)
	name!: string;

	@IsOptional()
	@IsString()
	@MaxLength(2000)
	description?: string;

	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	price!: number;

	@IsString()
	@MinLength(1)
	@MaxLength(2048)
	imageUrl!: string;

	@IsString()
	@MinLength(1)
	@MaxLength(80)
	category!: string;
}
