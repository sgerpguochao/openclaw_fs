import type { GatewayBrowserClient } from "../gateway.ts";

export type ModelsState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  modelsLoading: boolean;
  modelsSaving: boolean;
  modelsApiKey: string;
  modelsBaseUrl: string;
  modelsModel: string;
  modelsDefaultModel: string;
  modelsShowApiKey: boolean;
};

export async function loadModelsConfigFromGateway(
  state: ModelsState,
): Promise<{ apiKey: string; baseUrl: string; model: string; defaultModel: string }> {
  // First load from localStorage
  const stored = localStorage.getItem("openclaw-model-config");
  let localConfig = { apiKey: "", baseUrl: "", model: "", defaultModel: "" };
  if (stored) {
    try {
      localConfig = JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // If not connected, return local config
  if (!state.client || !state.connected) {
    return localConfig;
  }

  try {
    // Try to get config from gateway via config.get - use "." path for root
    const config = await state.client.request<Record<string, unknown>>("config.get", {
      path: "models.providers.qwenCustom",
    });
    if (config) {
      const apiKey = (config.apiKey as string) || "";
      const baseUrl = (config.baseUrl as string) || "";
      const models = (config.models as Array<{ id: string }>) || [];
      const modelId = models[0]?.id || "";

      // Get default model
      const agentConfig = await state.client.request<Record<string, unknown>>("config.get", {
        path: "agents.defaults.model",
      });
      const primary = (agentConfig?.primary as string) || "";
      const defaultModel = primary.startsWith("qwenCustom/") ? primary.replace("qwenCustom/", "") : "";

      return {
        apiKey: apiKey.replace("${DASHSCOPE_API_KEY}", localConfig.apiKey) || localConfig.apiKey,
        baseUrl: baseUrl || localConfig.baseUrl,
        model: modelId || localConfig.model,
        defaultModel: defaultModel || localConfig.defaultModel,
      };
    }
  } catch {
    // Fallback to local config if gateway fails
  }

  return localConfig;
}

export async function saveModelsConfigToGateway(
  state: ModelsState,
  config: { apiKey: string; baseUrl: string; model: string; defaultModel: string },
): Promise<{ success: boolean; error?: string }> {
  // Always save to localStorage first
  localStorage.setItem("openclaw-model-config", JSON.stringify(config));

  if (!state.client || !state.connected) {
    return { success: true };
  }

  state.modelsSaving = true;
  try {
    // Get current full config to preserve gateway settings
    let existingConfig: Record<string, unknown> = {};
    try {
      existingConfig = await state.client.request<Record<string, unknown>>("config.get", {});
    } catch {
      // ignore - may not have existing config
    }

    // Get current config hash
    let baseHash = "";
    try {
      const configSnapshot = await state.client.request<{ hash?: string }>("config.get", {
        path: ".",
      });
      baseHash = configSnapshot?.hash || "";
    } catch {
      // ignore
    }

    // If no hash, try without path
    if (!baseHash) {
      try {
        const configSnapshot = await state.client.request<{ hash?: string }>("config.get", {});
        baseHash = configSnapshot?.hash || "";
      } catch {
        // ignore
      }
    }

    // Preserve existing gateway.controlUi settings if they exist
    const gatewayControlUi = (existingConfig.gateway as Record<string, unknown>)?.controlUi as Record<string, unknown> | undefined;

    // Save provider config while preserving gateway settings
    await state.client.request("config.set", {
      raw: JSON.stringify({
        ...(existingConfig.models ? { models: existingConfig.models } : {}),
        models: {
          providers: {
            qwenCustom: {
              apiKey: config.apiKey,
              baseUrl: config.baseUrl,
              api: "openai-completions",
              models: [
                {
                  id: config.model,
                  name: config.model,
                  contextWindow: 128000,
                  maxTokens: 8192,
                },
              ],
            },
          },
        },
        agents: {
          defaults: {
            model: {
              primary: config.defaultModel ? `qwenCustom/${config.model}` : "",
            },
          },
        },
        gateway: {
          ...((existingConfig.gateway as Record<string, unknown>) || {}),
          controlUi: gatewayControlUi || {
            dangerouslyAllowHostHeaderOriginFallback: true,
            allowedOrigins: ["http://117.50.174.50:5173", "http://117.50.174.50:18789", "http://10.60.30.145:5173", "http://10.60.30.145:18789", "http://127.0.0.1:5173", "http://127.0.0.1:18789"],
            allowInsecureAuth: true,
            dangerouslyDisableDeviceAuth: true,
          },
          auth: {
            mode: "token",
            token: "683a6d04df0c1d33a3d2ccbd26dc5b93",
          },
        },
      }),
      baseHash: baseHash || undefined,
    });

    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  } finally {
    state.modelsSaving = false;
  }
}
