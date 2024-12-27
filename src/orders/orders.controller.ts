import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { RequestResponse } from 'src/core/interfaces/index.interface';
import { CreateOrderDto, UpdateOrderStatusDto } from 'src/core/dto/orders.dto';
import {
  ExtractUser,
  JwtUser,
} from 'src/core/decorators/extract-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Get()
  findAll(): Promise<RequestResponse> {
    return this.ordersService.findAll();
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<RequestResponse> {
    const order = await this.ordersService.findOne(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() createOrderDto: CreateOrderDto,
    @ExtractUser() user: JwtUser,
  ): Promise<RequestResponse> {
    return this.ordersService.create(createOrderDto, user);
  }

  @Patch(':id')
  async updateOrder(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderStatusDto,
  ): Promise<RequestResponse> {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string): Promise<RequestResponse> {
    return this.ordersService.remove(id);
  }
}
