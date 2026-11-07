"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * `false` no servidor e durante a hidratação; `true` depois, no navegador.
 * Útil para componentes que renderizam diferente no cliente (evita
 * "Hydration failed") sem precisar de setState dentro de um useEffect.
 */
export const useIsClient = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
