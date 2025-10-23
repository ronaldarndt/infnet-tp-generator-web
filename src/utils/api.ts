const URL = "https://api.codesandbox.io";

export enum SandboxPrivacy {
  public,
  unlisted,
  private
}

export interface Sandbox {
  id: string;
  title: string | null;
  privacy: SandboxPrivacy;
}

interface ListSandboxesResponse {
  errors: string[] | null;
  success: boolean;
  data: {
    sandboxes: Sandbox[];
    pagination: {
      current_page: number;
      next_page: number | null;
      total_records: number;
    };
  };
}

interface ListSandboxesOptions {
  orderBy?: "inserted_at" | "updated_at";
  direction?: "asc" | "desc";
  pageSize?: number;
  page?: number;
}

function toQueryString(params: Record<string, any>) {
  const query = new URLSearchParams();

  for (const key in params) {
    const value = params[key];
    if (value !== undefined) {
      query.append(key, String(value));
    }
  }

  return query.toString();
}

export class CodeSandboxApi {
  constructor(private token: string) {}

  async listSandboxes(options: ListSandboxesOptions = {}) {
    const qs = toQueryString({
      order_by: options.orderBy,
      direction: options.direction,
      page_size: options.pageSize,
      page: options.page
    });

    const suffix = qs ? `?${qs}` : "";

    const resp = await fetch(`${URL}/sandbox${suffix}`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (!resp.ok) {
      throw new Error(`Failed to fetch sandboxes info: ${resp.statusText}`);
    }

    const data = (await resp.json()) as ListSandboxesResponse;

    return {
      sandboxes: data.data.sandboxes,
      pagination: {
        currentPage: data.data.pagination.current_page,
        nextPage: data.data.pagination.next_page,
        totalRecords: data.data.pagination.total_records
      }
    };
  }
}
