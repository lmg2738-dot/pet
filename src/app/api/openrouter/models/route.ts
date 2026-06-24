import { jsonSuccess } from "@/lib/api";
import { getFreeVisionModels, isOpenRouterConfigured } from "@/lib/openrouter/models";

export async function GET() {
  if (!isOpenRouterConfigured()) {
    return jsonSuccess({ configured: false, models: [] });
  }

  try {
    const models = await getFreeVisionModels();
    return jsonSuccess({
      configured: true,
      models: models.map((m) => ({
        id: m.id,
        name: m.name,
        promptPrice: m.promptPrice,
        completionPrice: m.completionPrice,
      })),
      total: models.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch models";
    return jsonSuccess({ configured: true, models: [], error: message });
  }
}
