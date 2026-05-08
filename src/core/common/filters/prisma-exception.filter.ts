import { Prisma } from "@generated/prisma/client";
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "DATABASE_ERROR";
    let message = "Database error";

    switch (exception.code) {
      case "P2002": {
        status = HttpStatus.CONFLICT;

        interface DriverAdapterError {
          cause?: {
            constraint?: {
              fields?: string[];
            };
          };
        }

        const driverError = exception.meta?.driverAdapterError as
          | DriverAdapterError
          | undefined;
        const fields = driverError?.cause?.constraint?.fields;
        const target = exception.meta?.target as string[] | undefined;
        const field = fields?.[0] ?? target?.[0] ?? "field";

        code = "UNIQUE_CONSTRAINT";
        message = `${field} already exists`;
        break;
      }
      case "P2025": {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "Record not found";
        break;
      }
      case "P2003": {
        status = HttpStatus.BAD_REQUEST;
        code = "FOREIGN_KEY_CONSTRAINT";
        message = "Related record not found";
        break;
      }
    }

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }
}
