export class KaikoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class DomainError extends KaikoError {
  constructor(message: string, code = "DOMAIN_ERROR", details?: unknown) {
    super(message, code, 422, details);
  }
}

export class AuthorizationError extends KaikoError {
  constructor(message = "No tienes permisos para realizar esta acción.") {
    super(message, "FORBIDDEN", 403);
  }
}

export class NotFoundError extends KaikoError {
  constructor(message = "No se encontró el recurso solicitado.") {
    super(message, "NOT_FOUND", 404);
  }
}

export class InfrastructureError extends KaikoError {
  constructor(message: string, details?: unknown) {
    super(message, "INFRASTRUCTURE_ERROR", 500, details);
  }
}
