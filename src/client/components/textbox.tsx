import { css } from "hono/css";

interface Props {
  label: string;
  value: string;
  type?: string;
  onChange: (text: string) => void;
}

export default function TextBox({ label, type, value, onChange }: Props) {
  return (
    <label class="textbox">
      {label}
      <input
        type={type || "text"}
        value={value}
        onChange={e => onChange((e.target as any).value)}
      />
    </label>
  );
}

const sectionClass = css`
  display: grid;
  place-content: center;
  height: 100%;

  [content-grid] {
    display: grid;
    border: 1px solid;
    gap: 0.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;

    & > div {
      display: grid;
      grid-template-columns: 1fr minmax(400px, 30ch);
      gap: 0.5rem;
      align-items: start;
    }
  }
`;
