import { CodeSandbox, SandboxInfo } from "@codesandbox/sdk";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({
  codeSandboxToken: z.string(),
  dr: z.string(),
  tp: z.string()
});

async function getUrl({ id, title }: SandboxInfo) {
  const resp = await fetch("https://codesandbox.io/api/v1/sandboxes/" + id);
  const data = (await resp.json()) as { data: { alias: string } };

  return {
    url: `https://codesandbox.io/p/sandbox/${data.data.alias}`,
    question: Number(title?.split(".").at(-1))
  };
}

const api = new Hono().post(
  "/sandboxes",
  zValidator("json", schema),
  async c => {
    const { codeSandboxToken, dr, tp } = c.req.valid("json");

    const sdk = new CodeSandbox(codeSandboxToken);
    const { sandboxes } = await sdk.sandbox.list();

    const list = sandboxes.filter(x => x.title?.startsWith(`DR${dr}-TP${tp}.`));

    const nonPublicSandbox = list.find(x => x.privacy !== "public");

    if (nonPublicSandbox) {
      return c.json(
        {
          error: `O projeto ${nonPublicSandbox.title} não é público`
        },
        400
      );
    }

    const sandboxesInfo = await Promise.all(list.map(getUrl));

    return c.json({
      sandboxes: sandboxesInfo
    });
  }
);

export type Api = typeof api;

export default api;
