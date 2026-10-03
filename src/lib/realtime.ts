// Coalesce event realtime menjadi 1x router.refresh() — jangan refresh setiap perubahan row.
export function debounce<F extends (...args: never[]) => void>(
  fn: F,
  delayMs: number,
): ((...args: Parameters<F>) => void) & { cancel: () => void } {
  let id: ReturnType<typeof setTimeout> | undefined;
  const wrapped = (...args: Parameters<F>) => {
    if (id !== undefined) clearTimeout(id);
    id = setTimeout(() => {
      id = undefined;
      fn(...args);
    }, delayMs);
  };
  wrapped.cancel = () => {
    if (id !== undefined) {
      clearTimeout(id);
      id = undefined;
    }
  };
  return wrapped;
}
