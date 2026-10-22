/*
 * Generated sample files for demo data (documents and attachments that have
 * no real upload yet). Plain one-page PDF / JPEG, clearly marked "SAMPLE".
 */

/** Keep generated PDFs to plain ASCII (built-in Helvetica has no Bangla glyphs). */
function ascii(text: string) {
  return text.replace(/[^\x20-\x7E]/g, "-");
}

/** Builds a minimal one-page A4 PDF with the given text lines. */
export function buildSamplePdf(title: string, lines: string[]) {
  const escape = (t: string) => ascii(t).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = [
    "0.9 0.92 1 rg 40 700 515 100 re f", // header band
    "BT /F2 22 Tf 0.15 0.15 0.35 rg 60 760 Td",
    `(${escape(title)}) Tj`,
    "/F1 11 Tf 0 -24 Td 0.4 0.4 0.5 rg (SAMPLE DOCUMENT - demo data) Tj",
    "0 0 0 rg /F1 12 Tf",
    ...lines.flatMap((line, i) => [i === 0 ? "0 -70 Td" : "0 -22 Td", `(${escape(line)}) Tj`]),
    "ET",
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

export function buildSampleImage(title: string, lines: string[]) {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 700;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 1000, 700);
  ctx.fillStyle = "#4f46e5";
  ctx.fillRect(0, 0, 1000, 120);
  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 150, 940, 520);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 40px sans-serif";
  ctx.fillText(title, 50, 75);
  ctx.font = "20px sans-serif";
  ctx.fillText("SAMPLE DOCUMENT — demo data", 50, 105);
  ctx.fillStyle = "#0f172a";
  ctx.font = "26px sans-serif";
  lines.forEach((line, i) => ctx.fillText(line, 70, 230 + i * 50));
  return new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9));
}

/** Trigger a browser download for a Blob. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
