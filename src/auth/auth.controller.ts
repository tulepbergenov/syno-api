import {
  Post,
  Req,
  Delete,
  Body,
  Controller,
  Get,
  Param,
  Res,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { Public } from "../common/decorators/public.decorator";
import type { Request, Response } from "express";
import { LoginDto } from "./dto/login.dto";
import type { AuthenticatedRequest } from "../common/interfaces/authenticated-request.interface";
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";

const REFRESH_COOKIE = "refreshToken";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  // ===== WEB (cookie) =====

  @Public()
  @Post("sign-up")
  @ApiOperation({ summary: "Register new user (web)" })
  @ApiResponse({
    status: 201,
    description: "Returns accessToken, sets refreshToken httpOnly cookie",
  })
  @ApiResponse({ status: 409, description: "Email or username already taken" })
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
  @ApiOperation({ summary: "Login (web)" })
  @ApiResponse({
    status: 201,
    description: "Returns accessToken, sets refreshToken httpOnly cookie",
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
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
  @ApiOperation({ summary: "Refresh access token (web, reads cookie)" })
  @ApiResponse({
    status: 201,
    description: "Returns new accessToken, rotates refreshToken",
  })
  @ApiResponse({ status: 401, description: "Invalid or expired refresh token" })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    const tokens = await this.authService.refresh(
      refreshToken,
      this.getMeta(req),
    );
    this.setRefreshCookie(res, tokens.refreshToken);
    return { accessToken: tokens.accessToken };
  }

  @ApiBearerAuth()
  @Post("sign-out")
  @ApiOperation({ summary: "Logout current session (web)" })
  async signOut(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(refreshToken);
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  // ===== MOBILE (body) =====

  @Public()
  @Post("mobile/sign-up")
  @ApiOperation({ summary: "Register new user (mobile)" })
  @ApiResponse({
    status: 201,
    description: "Returns accessToken and refreshToken in body",
  })
  mobileSignUp(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.getMeta(req));
  }

  @Public()
  @Post("mobile/sign-in")
  @ApiOperation({ summary: "Login (mobile)" })
  mobileSignIn(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.getMeta(req));
  }

  @Public()
  @Post("mobile/refresh")
  @ApiOperation({ summary: "Refresh access token (mobile)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { refreshToken: { type: "string" } },
      required: ["refreshToken"],
    },
  })
  mobileRefresh(
    @Body("refreshToken") refreshToken: string,
    @Req() req: Request,
  ) {
    return this.authService.refresh(refreshToken, this.getMeta(req));
  }

  @ApiBearerAuth()
  @Post("mobile/sign-out")
  @ApiOperation({ summary: "Logout current session (mobile)" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { refreshToken: { type: "string" } },
      required: ["refreshToken"],
    },
  })
  mobileSignOut(@Body("refreshToken") refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  // ===== SESSIONS =====

  @ApiBearerAuth()
  @Post("sign-out-all")
  @ApiOperation({ summary: "Logout from all devices" })
  signOutAll(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    res.clearCookie(REFRESH_COOKIE);
    return this.authService.logoutAll(req.user.id);
  }

  @ApiBearerAuth()
  @Get("sessions")
  @ApiOperation({ summary: "Get all active sessions of current user" })
  getSessions(@Req() req: AuthenticatedRequest) {
    return this.authService.getSessions(req.user.id);
  }

  @ApiBearerAuth()
  @Delete("sessions/:id")
  @ApiOperation({ summary: "Revoke specific session by id" })
  revokeSession(@Req() req: AuthenticatedRequest, @Param("id") id: string) {
    return this.authService.revokeSession(req.user.id, id);
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
}
