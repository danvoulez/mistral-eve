import type { SceneRawRows, SceneScope } from "./scene-types";

// Reader da Dynamic Projection (Parte 3.1 do guia).
//
// Contrato de fronteira: a única coisa que o engine sabe sobre a fonte é
// `readRows(scope) -> SceneRawRows`. A implementação concreta é um CLIENTE HTTP
// puro para `POST <url>/projection` no modo "rows". Ela NÃO toca sqlite, NÃO roda
// python, NÃO conhece os modos legacy — essas peças ficam atrás do seam, no
// runtime da membrana. Aqui é só olho remoto, conforme as travas da Parte 2.3:
// leitura, zero capacidade de escrita.

export interface SceneReaders {
  readRows(scope: SceneScope): Promise<SceneRawRows>;
}

const DEFAULT_TIMEOUT_MS = 8000;

function runtimeTimeoutMs(): number {
  return Number(process.env.DREAM_MACHINE_RUNTIME_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS;
}

/** Base URL do runtime de projeção. Sem isso, o reader degrada para rows vazias. */
export function resolveRuntimeUrl(): string | undefined {
  return process.env.DREAM_MACHINE_RUNTIME_URL?.trim() || undefined;
}

/** Rows vazias com meta marcando fonte ausente (DB ausente → meta/empty rows). */
function emptyRows(): SceneRawRows {
  return {
    logline_acts: [],
    queue: [],
    findings: [],
    shifts: [],
    watermark: { logline_seq: 0, envelope_seq: 0 },
    meta: { logline_db_present: false, envelope_db_present: false },
  };
}

async function postProjectionRows(baseUrl: string, scope: SceneScope): Promise<SceneRawRows> {
  const token = process.env.DREAM_MACHINE_RUNTIME_TOKEN?.trim();
  const url = `${baseUrl.replace(/\/+$/, "")}/projection`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), runtimeTimeoutMs());
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ mode: "rows", scope: scope ?? {} }),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`projection runtime responded ${res.status} ${res.statusText}`);
    }
    const parsed = (await res.json()) as Record<string, unknown>;
    if (typeof parsed.error === "string" && parsed.error) {
      throw new Error(parsed.error);
    }
    const { error: _ignored, ...rows } = parsed;
    return rows as unknown as SceneRawRows;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reader HTTP. Se `DREAM_MACHINE_RUNTIME_URL` não estiver setada, degrada para
 * rows vazias (a cena ainda monta, com warnings de fonte parcial). Erro de rede
 * com URL setada propaga — é falha real, não fonte ausente.
 */
export function createSceneReaders(): SceneReaders {
  return {
    async readRows(scope) {
      const url = resolveRuntimeUrl();
      if (!url) return emptyRows();
      return postProjectionRows(url, scope ?? {});
    },
  };
}
