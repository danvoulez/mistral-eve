import { defineTool } from "eve/tools";
import { z } from "zod";
import { SCENE_OPS } from "@/lib/projections/scene-types";
import { runProjection } from "@/lib/projections/run";

// Navega a ladder (item 9 do transplante). A partir de uma projeção aberta
// (parent_projection_hash), aplica um movimento: drill/group/filter/ascend/
// descend/compare/back/etc. O alvo de drill/descend vai em selection.focus.
//
// LIMITAÇÃO HONESTA (Parte 5 do guia, item 15): hoje a navegação RECALCULA a
// cena a partir do reader; o parent_projection_hash é registrado em
// parent_projection_hashes mas NÃO é usado para reabrir o parent exato por
// lookup. "back por hash" e ladder persistente dependem do registry (item 6).

const scopeSchema = z
  .object({
    ledger: z.string().optional(),
    process: z.string().optional(),
    process_id: z.string().optional(),
    content_hash: z.string().optional(),
    stream_id: z.string().optional(),
  })
  .default({})
  .describe("Escopo da cena (mesmo da projeção pai, por padrão).");

export default defineTool({
  description:
    "Navega uma Dynamic Projection já aberta: aplica um movimento de ladder (drill, group, filter, ascend, descend, compare, back, explain_loss, refresh) a partir de um projection_hash pai. Read-only — nunca muta ledger. Use scene.open via build_projection para abrir a primeira visão.",
  inputSchema: z.object({
    parent_projection_hash: z.string().describe("O projection_hash da projeção de onde você está navegando."),
    op: z.enum(SCENE_OPS).describe("O movimento. Use build_projection para scene.open."),
    goal: z.string().optional().describe("Objetivo opcional; re-guia a saliência."),
    scope: scopeSchema,
    selection: z
      .object({
        filter: z.string().optional().describe("Cláusulas: 'stuck', 'risk=L4', 'waiting_on=human' (separadas por vírgula)."),
        group_by: z.string().optional().describe("Dimensão de agrupamento: process_id|state|waiting_on|risk|who."),
        focus: z.string().optional().describe("Alvo de drill/descend: id ou instance do item."),
      })
      .optional(),
    limit: z.number().int().positive().max(50).optional(),
  }),
  async execute({ parent_projection_hash, op, goal, scope, selection, limit }) {
    return runProjection({ op, goal, scope, parent_projection_hash, selection, limit });
  },
});
