// Simple in-memory rate limiting for login attempts
// In production, consider using Redis or a proper rate limiting library

interface LoginAttempt {
  count: number;
  lastAttempt: number;
  requiresCaptcha: boolean;
  captchaAnswer?: number;
  captchaQuestion?: string;
}

const loginAttempts = new Map<string, LoginAttempt>();

const MAX_ATTEMPTS = 3; // Number of failed attempts before requiring CAPTCHA
const RESET_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds

export function getClientId(request: { headers: Headers }): string {
  // Try to get IP from headers (works with most proxies)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || 'unknown';
  return ip;
}

export function recordFailedAttempt(clientId: string): { requiresCaptcha: boolean; attemptsLeft: number } {
  const now = Date.now();
  const attempt = loginAttempts.get(clientId);

  if (!attempt || now - attempt.lastAttempt > RESET_TIME) {
    // Reset or create new attempt record
    loginAttempts.set(clientId, {
      count: 1,
      lastAttempt: now,
      requiresCaptcha: false,
    });
    return { requiresCaptcha: false, attemptsLeft: MAX_ATTEMPTS - 1 };
  }

  attempt.count += 1;
  attempt.lastAttempt = now;
  attempt.requiresCaptcha = attempt.count >= MAX_ATTEMPTS;

  loginAttempts.set(clientId, attempt);

  return {
    requiresCaptcha: attempt.requiresCaptcha,
    attemptsLeft: Math.max(0, MAX_ATTEMPTS - attempt.count),
  };
}

export function recordSuccess(clientId: string): void {
  loginAttempts.delete(clientId);
}

export function requiresCaptcha(clientId: string): boolean {
  const attempt = loginAttempts.get(clientId);
  return attempt?.requiresCaptcha || false;
}

export function generateCaptcha(): { question: string; answer: number } {
  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const answer = num1 + num2;
  const question = `${num1} + ${num2}`;
  return { question, answer };
}

export function setCaptchaForClient(clientId: string, question: string, answer: number): void {
  const attempt = loginAttempts.get(clientId);
  if (attempt) {
    attempt.captchaQuestion = question;
    attempt.captchaAnswer = answer;
    loginAttempts.set(clientId, attempt);
  }
}

export function verifyCaptcha(clientId: string, userAnswer: number): boolean {
  const attempt = loginAttempts.get(clientId);
  if (!attempt || !attempt.captchaAnswer) {
    return false;
  }
  return attempt.captchaAnswer === userAnswer;
}

// Cleanup old attempts periodically
setInterval(() => {
  const now = Date.now();
  for (const [clientId, attempt] of loginAttempts.entries()) {
    if (now - attempt.lastAttempt > RESET_TIME) {
      loginAttempts.delete(clientId);
    }
  }
}, 60 * 1000); // Cleanup every minute

