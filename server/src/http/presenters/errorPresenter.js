export function toPublicError(error) {
  return {
    code: error?.code ?? "INTERNAL_ERROR",
    message: error?.message ?? "The server could not complete the request.",
    details: error?.details ?? [],
  };
}

export function toValidationError(errors = []) {
  return {
    code: "INVALID_ENCOUNTER",
    message: "The encounter setup is invalid.",
    details: errors.map((error) => ({ field: "encounter", code: error.code, message: error.message })),
  };
}
