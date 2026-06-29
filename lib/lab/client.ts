import type { EffectClass } from "@/lib/projections/scene-types";

// Seam HTTP para o Lab (a autoridade institucional). Espelha a fronteira do
// reader de projeção (Parte 2.4 do guia): a Eve PROPÕE; o Lab ADMITE. A
// consequência mora fora — aqui só despachamos a intenção de efeito.
//
// Como o Lab é um runtime externo (igual ao Envelope/SPINE, ausente neste
// checkout), sem DREAM_MACHINE_LAB_URL o despacho degrada honestamente: a
// intenção NÃO é despachada e dizemos isso — nunca fingimos consequência.

export type EffectIntent = {
  intent: string;
  reason?: string;
  effect_class: EffectClass;
  args?: Record<string, unknown>;
  source_projection_hash?: string;
};

export type EffectDispatchResult =
  | { dispatched: true; receipt: unknown }
  | { dispatched: false; reason: string };

const DEFAULT_TIMEOUT_MS = 8000;

export function resolveLabUrl(): string | undefined {
  return process.env.DREAM_MACHINE_LAB_URL?.trim() || undefined;
}

export async function dispatchEffect(intent: EffectIntent): Promise<EffectDispatchResult> {
  const baseUrl = resolveLabUrl();
  if (!baseUrl) {
    return {
      dispatched: false,
      reason: "Lab seam não configurado (DREAM_MACHINE_LAB_URL ausente); intenção aprovada mas não despachada.",
    };
  }

  const token = process.env.DREAM_MACHINE_LAB_TOKEN?.trim();
  const url = `${baseUrl.replace(/\/+$/, "")}/effect`;
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    Number(process.env.DREAM_MACHINE_LAB_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
  );
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(intent),
      signal: controller.signal,
    });
    // URL setada mas falhou = falha real (a Eve aprovou, não aconteceu) → propaga.
    if (!res.ok) {
      throw new Error(`Lab respondeu ${res.status} ${res.statusText}`);
    }
    const receipt = (await res.json()) as unknown;
    return { dispatched: true, receipt };
  } finally {
    clearTimeout(timer);
  }
}
