import { AssignmentSandboxFormat, AssignmentType } from "../utils/types";

export default class AssignmentService {
  private format: AssignmentSandboxFormat;

  private lessThanV3AtRegex: RegExp;
  private atRegex: RegExp;

  private v1TpPattern: string;
  private tpRegex: RegExp;

  private customSandboxPatternRegex: RegExp | null = null;

  constructor(
    private dr: number,
    private tp: number,
    private semester: number,
    private type: AssignmentType,
    private customSandboxPattern?: string
  ) {
    this.format = AssignmentService.getFormat(tp, dr, semester);

    this.lessThanV3AtRegex = new RegExp(`AT\\.(\\d+)-DR${this.dr}`, "i");
    this.atRegex = new RegExp(
      `AT\\.(\\d+)-DR${this.dr}-S${this.semester}`,
      "i"
    );

    this.v1TpPattern = `DR${this.dr}-TP${this.tp}.`;

    let tpPattern = `TP${tp}\\.(\\d+)-DR${dr}`;

    if (this.format > AssignmentSandboxFormat.V2) {
      tpPattern += `-S${this.semester}`;
    }

    this.tpRegex = new RegExp(tpPattern);

    if (this.customSandboxPattern) {
      const injected = this.customSandboxPattern
        .replaceAll("{{dr}}", this.dr.toString())
        .replaceAll("{{tp}}", this.tp.toString())
        .replaceAll("{{semester}}", this.semester.toString());

      this.customSandboxPatternRegex = new RegExp(injected, "i");
    }
  }

  public checkSandboxIsFromAssignment(title: string | undefined | null) {
    const trimmed = title?.trim();

    if (this.customSandboxPatternRegex) {
      return this.customSandboxPatternRegex.test(trimmed ?? "");
    }

    if (this.type === "at") {
      return this.checkAtSandboxIsFromAssignment(trimmed);
    }

    return this.checkTpSandboxIsFromAssignment(trimmed);
  }

  public getQuestionNumberFromTitle(title: string | undefined | null) {
    const trimmed = title?.trim();

    if (this.customSandboxPatternRegex) {
      const match = this.customSandboxPatternRegex.exec(trimmed ?? "");
      return match && match[1] ? Number(match[1]) : NaN;
    }

    const question =
      this.format > AssignmentSandboxFormat.V1
        ? trimmed?.split(".").at(-1)?.split("-").at(0)
        : trimmed?.split(".").at(-1);

    return Number(question);
  }

  private checkAtSandboxIsFromAssignment(title: string | undefined) {
    if (this.format < AssignmentSandboxFormat.V3) {
      return this.lessThanV3AtRegex.test(title ?? "");
    }

    return this.atRegex.test(title ?? "");
  }

  private checkTpSandboxIsFromAssignment(title: string | undefined) {
    if (this.format === AssignmentSandboxFormat.V1) {
      return title?.startsWith(this.v1TpPattern) ?? false;
    }

    return this.tpRegex.test(title ?? "");
  }

  private static getFormat(tp: number, dr: number, semester: number) {
    if (semester > 1) {
      return AssignmentSandboxFormat.V3;
    }

    return tp > 1 || dr > 2
      ? AssignmentSandboxFormat.V2
      : AssignmentSandboxFormat.V1;
  }
}
