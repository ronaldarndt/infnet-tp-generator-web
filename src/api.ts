import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { CodeSandboxApi, Sandbox, SandboxPrivacy } from "./utils/api";

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

async function getUrl({ id, title }: Sandbox, format: Format) {
  const resp = await fetch("https://codesandbox.io/api/v1/sandboxes/" + id);
  const { data } = (await resp.json()) as { data: { alias: string } };

  const sandboxTitle = title?.trim();

  const question =
    format === Format.V2
      ? sandboxTitle?.split(".").at(-1)?.split("-").at(0)
      : sandboxTitle?.split(".").at(-1);

  return {
    url: `https://codesandbox.io/p/sandbox/${data.alias}`,
    question: Number(question)
  };
}

function filterSandboxTitle(
  title: string | undefined,
  type: "tp" | "at",
  dr: string,
  tp: string,
  format: Format
) {
  const trimmed = title?.trim();

  if (type === "at") {
    return trimmed?.match(new RegExp(`AT\\.(\\d+)-DR${dr}`, "i"));
  }

  const pattern = new RegExp(`TP${tp}\\.(\\d+)-DR${dr}`);

  return format
    ? trimmed?.match(pattern)
    : trimmed?.startsWith(`DR${dr}-TP${tp}.`);
}

const api = new Hono().post(
  "/sandboxes",
  zValidator("json", schema),
  async c => {
    const { codeSandboxToken, dr, tp, type } = c.req.valid("json");

    const tpNumber = Number(tp);
    const drNumber = Number(dr);

    const format = tpNumber > 1 || drNumber > 2 ? Format.V2 : Format.V1;

    const api = new CodeSandboxApi(codeSandboxToken);
    const sandboxes: Sandbox[] = [];

    let page = 1;

    while (true) {
      try {
        const response = await api.listSandboxes({
          direction: "desc",
          orderBy: "inserted_at",
          pageSize: 50,
          page
        });

        const filtered = response.sandboxes.filter(s =>
          filterSandboxTitle(s.title ?? "", type, dr, tp, format)
        );

        const privateSandbox = filtered.find(
          x => x.privacy === SandboxPrivacy.private
        );

        if (privateSandbox) {
          return c.json(
            {
              error: `A atividade ${privateSandbox.title} não é pública`
            },
            400
          );
        }

        sandboxes.push(...filtered);

        if (!response.pagination.nextPage || sandboxes.length >= 16) {
          break;
        }

        page += 1;
      } catch (e: unknown) {
        return c.json(
          {
            error: "Token do CodeSandbox inválido",
            details: (e as Error).toString()
          },
          400
        );
      }
    }

    if (sandboxes.length === 0) {
      return c.json(
        {
          error: `Nenhum sandbox encontrado`
        },
        400
      );
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
