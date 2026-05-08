import { Public } from "@core/common/decorators/public.decorator";
import type { AuthenticatedRequest } from "@core/common/interfaces/authenticated-request.interface";
import {
  ApiErrorResponse,
  ApiWrappedResponse,
} from "@core/common/swagger/api-response.decorator";
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { SessionsService } from "./sessions.service";
import {
  AccessTokenDto,
  LogoutResponseDto,
  RefreshTokenDto,
  SessionDto,
  TokenPairDto,
} from "./dto/auth-swagger.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(
    private authService: AuthService,
    private sessionsService: SessionsService,
  ) {}

  // ===== WEB (cookie) =====

  @Public()
  @Post("sign-up")
  @ApiOperation({
    summary: "Register new user (web)",
    description:
      "Creates a user, opens a session, returns accessToken in body and sets refreshToken as an httpOnly cookie.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "User registered. Refresh token is set in cookie.",
    type: AccessTokenDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(409, "Email or username already taken")
  async signUp(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.register(dto, this.getMeta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @Post("sign-in")
  @ApiOperation({
    summary: "Login (web)",
    description:
      "Authenticates by email and password, returns accessToken in body and sets refreshToken as an httpOnly cookie.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "User authenticated. Refresh token is set in cookie.",
    type: AccessTokenDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(401, "Invalid credentials")
  async signIn(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(dto, this.getMeta(req));
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @Public()
  @ApiCookieAuth("refreshToken")
  @Post("refresh")
  @ApiOperation({
    summary: "Refresh access token (web)",
    description:
      "Reads refreshToken from cookie, rotates it and returns a fresh accessToken.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "Access token refreshed. Refresh token is rotated in cookie.",
    type: AccessTokenDto,
  })
  @ApiErrorResponse(401, "Invalid or expired refresh token")
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromCookies(req);
    const tokens = await this.authService.refresh(
      refreshToken,
      this.getMeta(req),
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @ApiBearerAuth()
  @ApiCookieAuth("refreshToken")
  @Post("sign-out")
  @ApiOperation({
    summary: "Logout current session (web)",
    description:
      "Deletes the current session by refreshToken cookie and clears the cookie.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "Current session closed.",
    type: LogoutResponseDto,
  })
  @ApiErrorResponse(401, "Unauthorized")
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromCookies(req);
    await this.sessionsService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  // ===== MOBILE (body) =====

  @Public()
  @Post("mobile/sign-up")
  @ApiOperation({
    summary: "Register new user (mobile)",
    description:
      "Creates a user and returns both accessToken and refreshToken in response body.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "User registered and mobile token pair returned.",
    type: TokenPairDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(409, "Email or username already taken")
  mobileSignUp(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getMeta(req));
  }

  @Public()
  @Post("mobile/sign-in")
  @ApiOperation({
    summary: "Login (mobile)",
    description:
      "Authenticates by email and password and returns both accessToken and refreshToken in response body.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "User authenticated and mobile token pair returned.",
    type: TokenPairDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(401, "Invalid credentials")
  mobileSignIn(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getMeta(req));
  }

  @Public()
  @Post("mobile/refresh")
  @ApiOperation({
    summary: "Refresh access token (mobile)",
    description:
      "Rotates refreshToken from request body and returns a fresh token pair.",
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiWrappedResponse({
    status: 201,
    description: "Mobile token pair refreshed.",
    type: TokenPairDto,
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(401, "Invalid or expired refresh token")
  mobileRefresh(
    @Body("refreshToken") refreshToken: string,
    @Req() req: Request,
  ) {
    return this.authService.refresh(refreshToken, this.getMeta(req));
  }

  @ApiBearerAuth()
  @Post("mobile/sign-out")
  @ApiOperation({
    summary: "Logout current session (mobile)",
    description: "Deletes the mobile session associated with refreshToken.",
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiWrappedResponse({
    status: 201,
    description: "Current mobile session closed.",
  })
  @ApiErrorResponse(400, "Validation failed")
  @ApiErrorResponse(401, "Unauthorized")
  mobileSignOut(@Body("refreshToken") refreshToken: string) {
    return this.sessionsService.logout(refreshToken);
  }

  // ===== SESSIONS =====

  @ApiBearerAuth()
  @Post("sign-out-all")
  @ApiOperation({
    summary: "Logout from all devices",
    description:
      "Deletes all active sessions of the authenticated user except the current one identified by refreshToken cookie.",
  })
  @ApiWrappedResponse({
    status: 201,
    description: "All other sessions closed.",
  })
  @ApiErrorResponse(401, "Unauthorized")
  signOutAll(@Req() req: AuthenticatedRequest) {
    const refreshToken = this.getRefreshTokenFromCookies(req);
    return this.sessionsService.logoutAllExceptCurrent(
      req.user.id,
      refreshToken,
    );
  }

  @ApiBearerAuth()
  @Get("sessions")
  @ApiOperation({
    summary: "Get active sessions",
    description:
      "Returns all active sessions for the authenticated user ordered by creation date descending.",
  })
  @ApiWrappedResponse({
    status: 200,
    description: "Active sessions returned.",
    type: SessionDto,
    isArray: true,
  })
  @ApiErrorResponse(401, "Unauthorized")
  getSessions(@Req() req: AuthenticatedRequest) {
    const refreshToken = this.getRefreshTokenFromCookies(req);
    return this.sessionsService.getSessions(req.user.id, refreshToken);
  }

  @ApiBearerAuth()
  @Delete("sessions/:id")
  @ApiOperation({
    summary: "Revoke session",
    description:
      "Deletes one session by id. Only sessions owned by the authenticated user can be revoked.",
  })
  @ApiParam({
    name: "id",
    example: "0f7a9a21-8e2b-4f83-9e87-9f2d4b0f2db3",
    description: "Session id to revoke.",
  })
  @ApiWrappedResponse({
    status: 200,
    description: "Session revoked.",
  })
  @ApiErrorResponse(401, "Unauthorized")
  revokeSession(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.sessionsService.revokeSession(req.user.id, id);
  }

  // ===== HELPERS =====

  private setRefreshCookie(res: Response, token: string) {
    res.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/api/auth",
    });
  }

  private getMeta(req: Request) {
    return {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    };
  }

  private getRefreshTokenFromCookies(req: Request) {
    const cookies = req.cookies as Record<string, unknown> | undefined;
    const value = cookies?.[REFRESH_COOKIE];
    return typeof value === "string" ? value : "";
  }
}
