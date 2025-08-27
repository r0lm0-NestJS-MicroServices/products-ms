import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }
  create(createProductDto: CreateProductDto) {


    return this.product.create({
      data: createProductDto
    });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const totalPages = await this.product.count({ where: { available: true } });
    const lastPage = Math.ceil(totalPages / limit);
    const currentPage = page > lastPage ? lastPage : page;

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: { available: true }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: lastPage,

      }
    }
  }

  async findOne(id: number) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID must be a number');
    }
    const product = await this.product.findUnique({
      where: {
        id: numericId,
        available: true
      }
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {

      const { id: _, ...data } = updateProductDto;

      await this.findOne(id);

      return this.product.update({
        where: { id: id },
        data: data
      });
    } catch (error) {
      throw new NotFoundException('Product not found');
    }

  }

  async remove(id: number) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID must be a number');
    }

    await this.findOne(numericId); // Verificar que existe

    const product = await this.product.update({
      where: { id: numericId },
      data: { available: false }
    });
    return product;

    // return this.product.delete({
    //   where: { id: numericId }
    // });
  }
}
