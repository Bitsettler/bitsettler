/**
 * API utilities for consistent request/response handling
 * Bridges Result<T> pattern with Next.js API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { Result, resultToResponse, error, ErrorCodes } from '@/lib/result';
import { logger } from '@/lib/logger';

/**
 * Wrapper for API route handlers that use Result<T> pattern
 * Automatically converts Result<T> to NextResponse with proper logging
 */
export function withErrorHandling<T>(
  handler: (request: NextRequest) => Promise<Result<T>>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const endpoint = url.pathname;

    try {
      logger.info(`API ${method} ${endpoint} - Starting`, {
        method,
        endpoint,
        query: Object.fromEntries(url.searchParams)
      });

      const result = await handler(request);
      const duration = Date.now() - startTime;
      
      // Log the result
      if (result.success) {
        logger.logResponse(method, endpoint, 200, duration);
      } else {
        logger.logResponse(method, endpoint, 400, duration, {
          error: result.error,
          code: result.code
        });
      }

      return resultToResponse(result);
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      logger.logResponse(method, endpoint, 500, duration, {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });

      return resultToResponse(
        error<T>(errorMessage, ErrorCodes.INTERNAL_ERROR),
        200,
        500
      );
    }
  };
}

/**
 * Wrapper for API route handlers with params that use Result<T> pattern
 * Automatically converts Result<T> to NextResponse with proper logging
 */
export function withErrorHandlingParams<T, P extends Record<string, string> = Record<string, string>>(
  handler: (request: NextRequest, context: { params: Promise<P> }) => Promise<Result<T>>
) {
  return async (request: NextRequest, context: { params: Promise<P> }): Promise<NextResponse> => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const endpoint = url.pathname;

    try {
      // Await params for logging
      const params = await context.params;
      
      logger.info(`API ${method} ${endpoint} - Starting`, {
        method,
        endpoint,
        query: Object.fromEntries(url.searchParams),
        params: params
      });

      const result = await handler(request, context);
      const duration = Date.now() - startTime;
      
      // Log the result
      if (result.success) {
        logger.logResponse(method, endpoint, 200, duration);
      } else {
        logger.logResponse(method, endpoint, 400, duration, {
          error: result.error,
          code: result.code
        });
      }

      return resultToResponse(result);
    } catch (err) {
      const duration = Date.now() - startTime;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      logger.logResponse(method, endpoint, 500, duration, {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined
      });

      return resultToResponse(
        error<T>(errorMessage, ErrorCodes.INTERNAL_ERROR),
        200,
        500
      );
    }
  };
}

/**
 * Validate required query parameters
 */
export function requireQueryParams(
  searchParams: URLSearchParams, 
  ...params: string[]
): Result<Record<string, string>> {
  const missing: string[] = [];
  const values: Record<string, string> = {};

  for (const param of params) {
    const value = searchParams.get(param);
    if (!value) {
      missing.push(param);
    } else {
      values[param] = value;
    }
  }

  if (missing.length > 0) {
    return error(
      `Missing required parameters: ${missing.join(', ')}`,
      ErrorCodes.MISSING_PARAMETER
    );
  }

  return { success: true, data: values };
}

/**
 * Validate and parse JSON request body
 */
export async function parseRequestBody<T = Record<string, unknown>>(
  request: NextRequest
): Promise<Result<T>> {
  try {
    const body = await request.json();
    return { success: true, data: body as T };
  } catch (err) {
    return error(
      'Invalid JSON in request body',
      ErrorCodes.INVALID_REQUEST
    );
  }
}

/**
 * Validate required body fields
 */
export function requireBodyFields<T extends Record<string, unknown>>(
  body: T,
  ...fields: (keyof T)[]
): Result<T> {
  const missing: string[] = [];

  for (const field of fields) {
    if (body[field] === undefined || body[field] === null) {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    return error(
      `Missing required fields: ${missing.join(', ')}`,
      ErrorCodes.MISSING_PARAMETER
    );
  }

  return { success: true, data: body };
}

/**
 * Create consistent API success response
 */
export function apiSuccess<T>(data: T, message?: string): Result<{
  data: T;
  message?: string;
}> {
  return {
    success: true,
    data: {
      data,
      ...(message && { message })
    }
  };
}

/**
 * Create consistent API error response
 */
export function apiError(
  message: string,
  code?: string
): Result<never> {
  return error(message, code);
}