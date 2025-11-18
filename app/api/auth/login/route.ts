import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/lib/models/User';
import { comparePassword, createToken } from '@/lib/auth';
import {
  getClientId,
  recordFailedAttempt,
  recordSuccess,
  requiresCaptcha,
  generateCaptcha,
  setCaptchaForClient,
  verifyCaptcha,
} from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password, captchaAnswer } = await request.json();
    const clientId = getClientId(request);

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if CAPTCHA is required
    if (requiresCaptcha(clientId)) {
      if (captchaAnswer === undefined || captchaAnswer === null) {
        const { question, answer } = generateCaptcha();
        setCaptchaForClient(clientId, question, answer);
        return NextResponse.json(
          { error: 'CAPTCHA required', requiresCaptcha: true, captchaQuestion: question },
          { status: 403 }
        );
      }

      if (!verifyCaptcha(clientId, Number(captchaAnswer))) {
        const { question, answer } = generateCaptcha();
        setCaptchaForClient(clientId, question, answer);
        return NextResponse.json(
          { error: 'CAPTCHA incorreto', requiresCaptcha: true, captchaQuestion: question },
          { status: 403 }
        );
      }
    }

    const user = await User.findOne({ username: username.toLowerCase() });

    if (!user) {
      const result = recordFailedAttempt(clientId);
      const response: any = {
        error: 'Invalid credentials',
        attemptsLeft: result.attemptsLeft,
      };

      if (result.requiresCaptcha) {
        const { question, answer } = generateCaptcha();
        setCaptchaForClient(clientId, question, answer);
        response.requiresCaptcha = true;
        response.captchaQuestion = question;
      }

      return NextResponse.json(response, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      const result = recordFailedAttempt(clientId);
      const response: any = {
        error: 'Invalid credentials',
        attemptsLeft: result.attemptsLeft,
      };

      if (result.requiresCaptcha) {
        const { question, answer } = generateCaptcha();
        setCaptchaForClient(clientId, question, answer);
        response.requiresCaptcha = true;
        response.captchaQuestion = question;
      }

      return NextResponse.json(response, { status: 401 });
    }

    // Login successful - clear attempts
    recordSuccess(clientId);

    const token = await createToken({
      username: user.username,
      isAdmin: user.isAdmin,
      nivelAcesso: user.nivelAcesso,
    });

    const response = NextResponse.json({
      user: {
        username: user.username,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        nivelAcesso: user.nivelAcesso,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


