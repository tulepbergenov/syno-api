import { applyDecorators, Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";

type WrappedResponseOptions = {
  status: number;
  description: string;
  type?: Type<unknown>;
  isArray?: boolean;
};

export function ApiWrappedResponse(options: WrappedResponseOptions) {
  const dataSchema = options.type
    ? options.isArray
      ? { type: "array", items: { $ref: getSchemaPath(options.type) } }
      : { $ref: getSchemaPath(options.type) }
    : { nullable: true };

  return applyDecorators(
    ...(options.type ? [ApiExtraModels(options.type)] : []),
    ApiResponse({
      status: options.status,
      description: options.description,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: dataSchema,
        },
      },
    }),
  );
}

export function ApiErrorResponse(status: number, description: string) {
  return ApiResponse({
    status,
    description,
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: false },
        error: {
          type: "object",
          properties: {
            code: { type: "string", example: "ERROR" },
            message: {
              oneOf: [
                { type: "string", example: description },
                {
                  type: "array",
                  items: { type: "string" },
                  example: [description],
                },
              ],
            },
          },
        },
      },
    },
  });
}
