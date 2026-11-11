import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const allowedTypes = ["application/pdf", "image/png", "image/jpeg"] as const;
const fileSchema = z.custom<File>(
  (value) => value instanceof File,
  "Selecciona un archivo.",
);

export function validateInvoiceFile(
  file: File | undefined,
): string | undefined {
  const parsed = fileSchema.safeParse(file);
  if (!parsed.success)
    return parsed.error.issues[0]?.message ?? "Selecciona un archivo.";
  const validFile = parsed.data;
  if (!allowedTypes.includes(validFile.type as (typeof allowedTypes)[number]))
    return "Formato no permitido. Selecciona un PDF, PNG o JPG.";
  if (validFile.size > MAX_FILE_SIZE)
    return "El archivo supera el tamaño máximo configurado de 10 MB.";
  return undefined;
}
