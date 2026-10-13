import type { NextFunction, Request, Response } from 'express'

/** Error controlado con código de API y estado HTTP. */
export class AppError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next)
  }
}

/**
 * Último middleware: envelope único `{ error: { code, message } }`.
 * Jamás expone stack traces ni detalles internos al cliente.
 */
export function errorHandler(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }
  console.error('Error interno:', err instanceof Error ? err.message : err)
  res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Ocurrió un error inesperado' } })
}
