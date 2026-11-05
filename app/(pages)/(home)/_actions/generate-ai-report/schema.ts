import { isMatch } from "date-fns";
import { z } from "zod";

export const generateAiReportSchema = z.object({
  month: z.string().refine((value) => isMatch(value, "MM")),
  year: z.number().int().min(1900).max(2100),
});

export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;
