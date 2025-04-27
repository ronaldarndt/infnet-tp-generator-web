import { hc } from "hono/client";
import { useState } from "hono/jsx";
import type { Api } from "../api";
import useLocalStorage from "./hooks/use-localstorage";
import TextBox from "./components/textbox";
import { logo } from "./logo";
import jsPDF from "jspdf";

const client = hc<Api>("/api");

export function App() {
  const [codeSandboxToken, setCodeSandboxToken] = useLocalStorage(
    "codeSandboxToken",
    ""
  );
  const [course, setCourse] = useLocalStorage("course", "");
  const [name, setName] = useLocalStorage("name", "");
  const [professor, setProfessor] = useLocalStorage("professor", "");
  const [subject, setSubject] = useLocalStorage("subject", "");
  const [dr, setDr] = useLocalStorage("dr", "");
  const [tp, setTp] = useLocalStorage("tp", "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!codeSandboxToken) {
      setError("Token do CodeSandbox não pode ser vazio");
      return;
    }

    if (!course) {
      setError("Curso não pode ser vazio");
      return;
    }

    if (!name) {
      setError("Nome não pode ser vazio");
      return;
    }

    if (!professor) {
      setError("Professor não pode ser vazio");
      return;
    }

    if (!subject) {
      setError("Disciplina não pode ser vazio");
      return;
    }

    if (!dr) {
      setError("DR não pode ser vazio");
      return;
    }

    if (!tp) {
      setError("TP não pode ser vazio");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await client.sandboxes.$post({
        json: { codeSandboxToken, dr }
      });

      const { sandboxes } = await response.json();

      const doc = new jsPDF();
      doc.setFontSize(20);
      doc.setFont("Helvetica", "bold");
      centeredText(doc, `TESTE DE PERFORMANCE ${tp}`, 10);
      centeredImage(doc, logo, 20, 150, 150);

      doc.setFontSize(12);
      const startY = 200;
      listItem(doc, "Curso:", course, startY);
      listItem(doc, "Disciplina:", subject, startY + 8);
      listItem(doc, "Nome:", name, startY + 8 * 2);
      listItem(doc, "Professor(a):", professor, startY + 8 * 3);

      doc.setFontSize(20);
      doc.setFont("Helvetica", "bold");
      centeredText(
        doc,
        new Date().toLocaleDateString(),
        doc.internal.pageSize.getHeight() - 10
      );

      doc.addPage();

      centeredText(doc, "Questões", 10);

      for (const { question: questionNumber, url } of sandboxes) {
        question(doc, questionNumber, url);
      }

      doc.output("pdfobjectnewwindow");
    } finally {
      setLoading(false);
    }
  }

  function centeredText(doc: jsPDF, text: string, y: number) {
    const xOffset =
      (doc.internal.pageSize.getWidth() - doc.getTextWidth(text)) / 2;
    doc.text(text, xOffset, y);
  }

  function centeredImage(
    doc: jsPDF,
    image: string,
    y: number,
    width: number,
    height: number
  ) {
    const xOffset = (doc.internal.pageSize.getWidth() - width) / 2;
    doc.addImage(image, "JPEG", xOffset, y, width, height);
  }

  function listItem(doc: jsPDF, boldText: string, text: string, y: number) {
    doc.setFont("Helvetica", "bold");
    doc.text(boldText, 10, y);
    doc.setFont("Helvetica", "normal");
    doc.text(text, 13 + doc.getTextWidth(boldText), y);
  }

  function question(doc: jsPDF, number: number, url: string) {
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    const questionText = `Questão ${number}:`;
    const y = 20 + number * 10;

    doc.text(questionText, 10, y);
    doc.setFont("Helvetica", "normal");
    doc.setTextColor("#3141ff");
    doc.textWithLink(url, 13 + doc.getTextWidth(questionText), y, {});
    doc.setTextColor("#000000");
  }

  return (
    <main>
      <TextBox
        label="Token do sandbox:"
        value={codeSandboxToken}
        onChange={setCodeSandboxToken}
        type="text"
      />

      <TextBox label="Curso:" value={course} onChange={setCourse} type="text" />

      <TextBox label="Nome:" value={name} onChange={setName} type="text" />

      <TextBox
        label="Professor:"
        value={professor}
        onChange={setProfessor}
        type="text"
      />

      <TextBox
        label="Disciplina:"
        value={subject}
        onChange={setSubject}
        type="text"
      />

      <TextBox label="DR:" value={dr} onChange={setDr} type="number" />

      <TextBox label="TP:" value={tp} onChange={setTp} type="number" />

      <button
        className="btn"
        onClick={() => handleGenerate()}
        disabled={loading}
      >
        {loading ? "Gerando..." : "Gerar PDF"}
      </button>

      {error && <p class="error">{error}</p>}
    </main>
  );
}
