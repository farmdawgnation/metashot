import jwt from "jsonwebtoken";
import { Config } from "./config";

export interface MetabaseEmbedParams {
  questionId: number;
  params?: Record<string, any>;
  expiryMinutes?: number;
  bordered?: boolean;
  titled?: boolean;
}

export function generateMetabaseEmbedUrl({
  questionId,
  params = {},
  expiryMinutes = 10,
  bordered = true,
  titled = true,
}: MetabaseEmbedParams): string {
  // Check if secret key is configured
  if (!Config.metabase.secretKey) {
    throw new Error("Metabase secret key is not configured");
  }

  const payload = {
    resource: { question: questionId },
    params,
    exp: Math.round(Date.now() / 1000) + expiryMinutes * 60,
  };

  const token = jwt.sign(payload, Config.metabase.secretKey);

  const urlParams = new URLSearchParams();
  if (bordered) urlParams.append("bordered", "true");
  if (titled) urlParams.append("titled", "true");

  return `${Config.metabase.siteUrl}/embed/question/${token}#${urlParams.toString()}`;
}
