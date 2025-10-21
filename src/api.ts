import { CodeSandbox, SandboxInfo } from "@codesandbox/sdk";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

enum Format {
  V1,
  V2
}

const schema = z.object({
  codeSandboxToken: z.string(),
  dr: z.string(),
  tp: z.string(),
  type: z.enum(["tp", "at"]).default("tp")
});

async function getUrl({ id, title }: SandboxInfo, format: Format) {
  const resp = await fetch("https://codesandbox.io/api/v1/sandboxes/" + id);
  const data = (await resp.json()) as { data: { alias: string } };

  const sandboxTitle = title?.trim();

  const question =
    format === Format.V2
      ? sandboxTitle?.split(".").at(-1)?.split("-").at(0)
      : sandboxTitle?.split(".").at(-1);

  return {
    url: `https://codesandbox.io/p/sandbox/${data.data.alias}`,
    question: Number(question)
  };
}

function getTpId(format: Format, dr: string, tp: string, i: number) {
  return format === Format.V1 ? `DR${dr}-TP${tp}.${i}` : `TP${tp}.${i}-DR${dr}`;
}

function getAtId(dr: string, i: number) {
  return `AT.${i}-DR${dr}`;
}

const api = new Hono().post(
  "/sandboxes",
  zValidator("json", schema),
  async c => {
    const { codeSandboxToken, dr, tp, type } = c.req.valid("json");

    const tpNumber = Number(tp);
    const drNumber = Number(dr);

    const format = tpNumber > 1 || drNumber > 2 ? Format.V2 : Format.V1;

    const sdk = new CodeSandbox(codeSandboxToken);
    const sandboxes: SandboxInfo[] = [];

    for (let i = 1; i <= 16; i++) {
      const id = type === "at" ? getAtId(dr, i) : getTpId(format, dr, tp, i);

      try {
        const sandbox = await sdk.sandboxes.get(id);

        if (sandbox.privacy !== "public") {
          return c.json(
            {
              error: `A atividade ${id} não é pública`
            },
            400
          );
        }

        sandboxes.push(sandbox);
      } catch {
        if (type === "tp" || i === 1) {
          return c.json(
            {
              error: `A atividade ${id} não foi encontrada`
            },
            400
          );
        }

        break;
      }
    }

    const sandboxesInfo = await Promise.all(
      sandboxes.map(l => getUrl(l, format))
    );

    return c.json({
      sandboxes: sandboxesInfo
    });
  }
);

export type Api = typeof api;

export default api;
