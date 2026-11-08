export function isConflictError(error: string | null | undefined) {
  return Boolean(
    error &&
    /ya fue separado|ya existe|ya fue liberado|ya fue liberada|no está activa|supera el saldo|venta.*pertenecer/i.test(
      error,
    ),
  );
}

export const conflictMessage =
  "Otro usuario actualizó este palco. Los datos se actualizaron; revisa el saldo e inténtalo de nuevo.";
