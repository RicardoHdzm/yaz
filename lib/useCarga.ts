import { useEffect } from "react";

// Ejecuta `cargar` al montar, al volver a la app y (opcional) cada `cadaMs`
export function useCarga(cargar: () => unknown, cadaMs?: number) {
  useEffect(() => {
    const t0 = setTimeout(cargar, 0);
    const t = cadaMs ? setInterval(cargar, cadaMs) : undefined;
    const alVolver = () => document.visibilityState === "visible" && cargar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [cargar, cadaMs]);
}
