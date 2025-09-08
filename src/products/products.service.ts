import { BadRequestException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from '@prisma/client';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

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
      throw new RpcException('ID must be a number' + id);
    }
    const product = await this.product.findUnique({
      where: {
        id: numericId,
        available: true
      }
    });
    if (!product) {
      throw new RpcException({ message: 'Product not found # ' + id, status: HttpStatus.NOT_FOUND });
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
      throw new RpcException('Product not found # ' + id);
    }

  }

  async remove(id: number) {
    const numericId = Number(id);
    if (isNaN(numericId)) {
      throw new RpcException('ID must be a number' + id);
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


  async validateProducts(ids: number[] | { ids: number[] }) {
    // Manejar tanto array directo como objeto con propiedad ids
    let idsArray: number[];

    if (Array.isArray(ids)) {
      idsArray = ids;
    } else if (ids && typeof ids === 'object' && 'ids' in ids) {
      idsArray = ids.ids;
    } else {
      throw new RpcException({
        message: 'IDs must be an array or an object with ids property',
        status: HttpStatus.BAD_REQUEST
      });
    }

    // Validar que idsArray sea un array y no esté vacío
    console.log('IDs recibidos:', idsArray);
    if (!Array.isArray(idsArray) || idsArray.length === 0) {
      throw new RpcException({
        message: 'IDs must be a non-empty array',
        status: HttpStatus.BAD_REQUEST
      });
    }

    // Validar que todos los IDs sean números válidos
    const invalidIds = idsArray.filter(id => isNaN(Number(id)) || Number(id) <= 0);
    if (invalidIds.length > 0) {
      throw new RpcException({
        message: 'All IDs must be valid positive numbers',
        status: HttpStatus.BAD_REQUEST
      });
    }

    const products = await this.product.findMany({
      where: {
        id: { in: idsArray },
        available: true // Solo productos disponibles
      }
    });

    if (products.length !== idsArray.length) {
      throw new RpcException({
        message: 'Some products are not available',
        status: HttpStatus.BAD_REQUEST
      });
    }

    return products;
  }
}

