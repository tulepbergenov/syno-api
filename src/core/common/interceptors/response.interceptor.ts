import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

interface SuccessEnvelope {
  success: boolean;
  data: unknown;
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor<
  unknown,
  SuccessEnvelope
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<unknown>,
  ): Observable<SuccessEnvelope> {
    return next.handle().pipe(
      map((payload: unknown) => ({
        success: true,
        data: payload === undefined ? null : payload,
      })),
    );
  }
}
