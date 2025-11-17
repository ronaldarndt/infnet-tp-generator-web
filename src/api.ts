import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import SandboxesService from "./services/sandboxes-service";
import AssignmentService from "./services/assignment-service";

const schema = z.object({
  codeSandboxToken: z.string(),
  dr: z.coerce.number(),
  tp: z.coerce.number(),
  semester: z.coerce.number(),
  customSandboxPattern: z.string().optional(),
  type: z.enum(["tp", "at"]).default("tp")
});

const api = new Hono().post(
  "/sandboxes",
  zValidator("json", schema),
  async c => {
    const { codeSandboxToken, dr, tp, type, semester, customSandboxPattern } =
      c.req.valid("json");

    const sandboxesService = new SandboxesService(codeSandboxToken);
    const assignmentService = new AssignmentService(
      dr,
      tp,
      semester,
      type,
      customSandboxPattern
    );

    const sandboxesResult = await sandboxesService.list({
      filter: s => assignmentService.checkSandboxIsFromAssignment(s.title),
      maxResults: 16
    });

    if ("error" in sandboxesResult) {
      return c.json(
        {
          error: sandboxesResult.error,
          details: sandboxesResult.details
        },
        400
      );
    }

    const { sandboxes } = sandboxesResult;

    if (sandboxes.length === 0) {
      return c.json(
        {
          error: `Nenhum sandbox encontrado`
        },
        400
      );
    }

    const sandboxesInfo = await Promise.all(
      sandboxes.map(async s => ({
        url: await sandboxesService.getUrl(s.id),
        questionNumber: assignmentService.getQuestionNumberFromTitle(s.title)
      }))
    );

    return c.json({
      sandboxes: sandboxesInfo
    });
  }
);

export type Api = typeof api;

export default api;
