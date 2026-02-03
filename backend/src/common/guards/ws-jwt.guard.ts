import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  id: string;
  email: string;
}

interface WsClient {
  handshake: {
    auth: { token?: string };
    headers: { authorization?: string };
  };
  user?: JwtPayload;
}

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    try {
      const client = context.switchToWs().getClient<WsClient>();
      const authToken = client.handshake.auth?.token;
      const headerToken =
        client.handshake.headers?.authorization?.split(' ')[1];
      const token = authToken || headerToken;

      if (!token) {
        throw new UnauthorizedException('Missing authentication token');
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      client.user = payload;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
