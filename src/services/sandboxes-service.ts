import { CodeSandboxApi, Sandbox, SandboxPrivacy } from "../utils/api";

interface ListOptions {
  filter?: (s: Sandbox) => boolean;
  maxResults?: number;
}

type ListSandboxesResult =
  | { sandboxes: Sandbox[] }
  | { error: string; details: string | undefined };

export default class SandboxesService {
  constructor(private token: string) {}

  async list(options: ListOptions = {}): Promise<ListSandboxesResult> {
    const api = new CodeSandboxApi(this.token);
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

        const filtered = response.sandboxes.filter(
          s => options.filter?.(s) ?? true
        );

        const privateSandbox = filtered.find(
          x => x.privacy === SandboxPrivacy.private
        );

        if (privateSandbox) {
          return {
            error: `A sandbox ${privateSandbox.id} não é pública`,
            details: undefined
          };
        }

        sandboxes.push(...filtered);

        if (
          !response.pagination.nextPage ||
          (options.maxResults && sandboxes.length >= options.maxResults)
        ) {
          break;
        }

        page += 1;
      } catch (e: unknown) {
        return {
          error: "Token do CodeSandbox inválido",
          details: (e as Error).toString()
        };
      }
    }

    return { sandboxes };
  }

  async getUrl(sandboxId: string) {
    const url = `https://codesandbox.io/api/v1/sandboxes/${sandboxId}`;

    const resp = await fetch(url);
    const { data } = (await resp.json()) as { data: { alias: string } };

    return `https://codesandbox.io/p/sandbox/${data.alias}`;
  }
}
