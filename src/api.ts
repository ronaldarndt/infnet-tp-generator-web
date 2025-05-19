import { CodeSandbox, SandboxInfo } from "@codesandbox/sdk";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
  codeSandboxToken: z.string(),
  dr: z.string(),
  tp: z.string()
});

async function getUrl({ id, title }: SandboxInfo, tp: number) {
  const resp = await fetch("https://codesandbox.io/api/v1/sandboxes/" + id);
  const data = (await resp.json()) as { data: { alias: string } };

  const sandboxTitle = title?.trim();

  const question =
    tp > 1
      ? sandboxTitle?.split(".").at(-1)?.split("-").at(0)
      : sandboxTitle?.split(".").at(-1);

  return {
    url: `https://codesandbox.io/p/sandbox/${data.data.alias}`,
    question: Number(question)
  };
}

const api = new Hono().post(
  "/sandboxes",
  zValidator("json", schema),
  async c => {
    const { codeSandboxToken, dr, tp } = c.req.valid("json");

    const sdk = new CodeSandbox(codeSandboxToken);
    let sandboxes: SandboxInfo[] = [];
    let page = 1;

    while (true) {
      const res = await sdk.sandbox.list({
        pagination: { page, pageSize: 10 }
      });

      sandboxes.push(...res.sandboxes);
      page += 1;

      if (!res.pagination.nextPage) {
        break;
      }
    }

    const tpNumber = Number(tp);

    const pattern = new RegExp(`TP${tp}\\.(\\d+)-DR${dr}`);

    const list = sandboxes.filter(x =>
      tpNumber > 1
        ? x.title?.trim().match(pattern)
        : x.title?.trim().startsWith(`DR${dr}-TP${tp}.`)
    );

    const nonPublicSandbox = list.find(x => x.privacy !== "public");

    if (nonPublicSandbox) {
      return c.json(
        {
          error: `O projeto ${nonPublicSandbox.title} não é público`
        },
        400
      );
    }

    const sandboxesInfo = await Promise.all(list.map(l => getUrl(l, tpNumber)));

    return c.json({
      sandboxes: sandboxesInfo
    });
  }
);

export type Api = typeof api;

export default api;
