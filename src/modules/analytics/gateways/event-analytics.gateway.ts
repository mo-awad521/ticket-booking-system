import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../guards/ws-jwt.guard';
import { EventStatsDto } from '../dtos/event-stats.dto';

@WebSocketGateway({
  namespace: '/analytics',
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
    credentials: true,
  },
})
export class EventAnalyticsGateway {
  @WebSocketServer()
  private readonly server: Server;

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join-event')
  handleJoin(
    @MessageBody() eventId: string,
    @ConnectedSocket() client: Socket,
  ): { event: string; data: { eventId: string; timestamp: Date } } {
    void client.join(eventId);
    return { event: 'joined', data: { eventId, timestamp: new Date() } };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave-event')
  handleLeave(
    @MessageBody() eventId: string,
    @ConnectedSocket() client: Socket,
  ): { event: string; data: { eventId: string } } {
    void client.leave(eventId);
    return { event: 'left', data: { eventId } };
  }

  emitCheckIn(eventId: string, stats: EventStatsDto): void {
    this.server.to(eventId).emit('event-checkin-update', stats);
  }
}
