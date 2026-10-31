import { planAvailable } from "./engine";
import type { Catalog, Workspace } from "./types";
export function catalogFromWorkspace(w: Workspace): Catalog {
  return {
    sample: w.demo,
    plans: w.plans
      .filter(
        (p) =>
          planAvailable(p, w.clock) &&
          w.products.some((x) => x.id === p.productId),
      )
      .map((p) => {
        const product = w.products.find((x) => x.id === p.productId)!;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          interval: p.interval,
          minQuantity: p.minQuantity,
          canPause: p.canPause,
          canClose: p.canClose,
          loyalty: p.loyalty,
          step: p.step,
          cap: p.cap,
          productName: product.name,
          variants: product.variants,
        };
      }),
  };
}
