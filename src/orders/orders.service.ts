import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { EmailService } from '../core/services/mailer.service';
import { Order } from 'src/entities/order.entity';
import { RequestResponse } from 'src/core/interfaces/index.interface';
import { CreateOrderDto, UpdateOrderStatusDto } from 'src/core/dto/orders.dto';
import { JwtUser } from 'src/core/decorators/extract-user.decorator';
import { MessageService } from 'src/messages/message.service';
import { CloudinaryService } from 'src/core/services/cloudinary.service';
// import { NewOrder } from 'src/core/interfaces/orders.interface';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailerService: EmailService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    private messageService: MessageService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async create(
    newOrderDTO: CreateOrderDto,
    jwtUser: JwtUser,
  ): Promise<RequestResponse> {
    try {
      // Find the user by ID and email
      const user = await this.userRepository.findOne({
        where: {
          id: jwtUser.id,
          email: jwtUser.email,
        },
      });

      // Check if the user exists
      if (!user) {
        return {
          result: 'error',
          message: 'User not found!',
          data: null,
        };
      }

      // Save the new order with the image URL
      const newOrder = await this.orderRepository.save({
        ...newOrderDTO,
        user: user.id, // No need for 'as any'
      });

      return {
        result: 'success',
        message: 'Order created successfully',
        data: newOrder,
      };
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error creating order:', error);

      // Throw a specific error message based on the failure
      throw new InternalServerErrorException('Failed to create order');
    }
  }

  /**
   * Upload order image
   * @param file
   * @param orderId
   * @returns Promise<RequestResponse>
   */
  async uploadOrderImage(
    file: Express.Multer.File,
    orderId: string,
  ): Promise<RequestResponse> {
    try {
      if (!file || !file.buffer) {
        throw new BadRequestException('File buffer is not available');
      }

      const fileName = `package-${orderId}-${new Date().getTime()}`;

      // Upload the image to Cloudinary
      const result = await this.cloudinaryService.uploadImage(
        file,
        'orders',
        fileName,
      );

      // Check if the image was uploaded successfully
      if (result && result.secure_url) {
        // Find the order by ID
        const order = await this.orderRepository.findOne({
          where: { id: orderId },
        });

        // Check if the order exists
        if (!order) {
          return {
            result: 'error',
            message: 'Order not found!',
            data: null,
          };
        }

        // Update the order with the image URL
        order.details.package.image = result.secure_url;

        // Save the updated order
        const updatedOrder = await this.orderRepository.save(order);

        // Return the updated order
        return {
          result: 'success',
          message: 'Image uploaded successfully',
          data: updatedOrder,
        };
      } else {
        // Delete the order if the image upload fails
        const deletedOrder = await this.remove(orderId);

        // Return an error message
        return {
          result: 'error',
          message: 'Failed to upload image',
          data: deletedOrder,
        };
      }
    } catch (error) {
      // Log the error for debugging purposes
      console.error('Error uploading image:', error);

      // Throw a specific error message based on the failure
      throw new InternalServerErrorException('Failed to upload image');
    }
  }

  async findAll(): Promise<RequestResponse> {
    try {
      const orders = await this.orderRepository.find(); //{ relations: ['user'] });
      return {
        result: 'success',
        message: 'Orders fetched successfully',
        data: orders,
      };
    } catch (error) {
      throw new Error('Failed to fetch orders: ' + error);
    }
  }

  async findOne(id: string): Promise<RequestResponse> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id },
        // relations: ['user'],
      });

      if (!order) {
        return {
          result: 'error',
          message: 'Order not found!',
          data: null,
        };
      }

      return {
        result: 'success',
        message: 'Order fetched successfully',
        data: order,
      };
    } catch (error) {
      throw new Error('Failed to fetch order: ' + error);
    }
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderStatusDto,
  ): Promise<RequestResponse> {
    try {
      if (updateOrderDto) {
      }

      const result = await this.orderRepository.update(id, updateOrderDto);
      if (result.affected === 0) {
        return {
          result: 'error',
          message: 'Order not found!',
          data: null,
        };
      }

      const updatedOrder = await this.findOne(id);
      return {
        result: 'success',
        message: 'Order updated successfully',
        data: updatedOrder,
      };
    } catch (error) {
      throw new Error('Failed to update order: ' + error);
    }
  }

  async remove(id: string): Promise<RequestResponse> {
    try {
      const result = await this.orderRepository.delete(id);
      if (result.affected === 0) {
        return {
          result: 'error',
          message: 'Order not found!',
          data: null,
        };
      }

      return {
        result: 'success',
        message: 'Order deleted successfully',
        data: null,
      };
    } catch (error) {
      throw new Error('Failed to delete order: ' + error);
    }
  }
}
