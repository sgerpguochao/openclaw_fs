import { html, nothing } from "lit";
import { t } from "../i18n/index.ts";
import type { GatewayBrowserClient } from "./gateway.ts";

export type ModelsRenderProps = {
  connected: boolean;
  loading: boolean;
  saving: boolean;
  apiKey: string;
  baseUrl: string;
  model: string;
  defaultModel: string;
  showApiKey?: boolean;
  client?: GatewayBrowserClient | null;
  onReload?: () => void;
  onSave?: (config: {
    apiKey: string;
    baseUrl: string;
    model: string;
    defaultModel: string;
  }) => void;
  onApiKeyChange?: (value: string) => void;
  onBaseUrlChange?: (value: string) => void;
  onModelChange?: (value: string) => void;
  onDefaultModelChange?: (value: string) => void;
  onToggleShowApiKey?: () => void;
};

// Load model config from localStorage
export async function loadModelsConfig(): Promise<{
  apiKey: string;
  baseUrl: string;
  model: string;
  defaultModel: string;
}> {
  const stored = localStorage.getItem("openclaw-model-config");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }
  return { apiKey: "", baseUrl: "", model: "", defaultModel: "" };
}

// Save model config to localStorage and gateway
export async function saveModelsConfig(
  config: { apiKey: string; baseUrl: string; model: string; defaultModel: string },
  client?: GatewayBrowserClient | null,
): Promise<{ success: boolean; error?: string }> {
  // Save to localStorage
  localStorage.setItem("openclaw-model-config", JSON.stringify(config));

  if (!client || !client.connected) {
    return { success: true };
  }

  try {
    // Save provider config via gateway
    if (config.apiKey) {
      await client.request("config.set", {
        raw: JSON.stringify({
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
        }),
        baseHash: "",
      });
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

function renderModelsForm(props: ModelsRenderProps) {
  const {
    loading,
    saving,
    apiKey,
    baseUrl,
    model,
    defaultModel,
    showApiKey = false,
    onReload,
    onSave,
    onApiKeyChange,
    onBaseUrlChange,
    onModelChange,
    onDefaultModelChange,
    onToggleShowApiKey,
  } = props;

  return html`
    <div class="models-page">
      <div class="models-header">
        <h2>Model Configuration</h2>
        <p class="muted">
          Configure AI model provider for Agent Runtime
        </p>
      </div>

      <div class="models-form">
        <!-- API Key -->
        <div class="field">
          <label>
            <span class="field-label">API Key</span>
            <span class="field-hint">Aliyun DashScope API Key</span>
          </label>
          <div class="field-input-group">
            <input
              type=${showApiKey ? "text" : "password"}
              class="field-input"
              placeholder="sk-..."
              .value=${apiKey}
              @input=${(e: Event) => onApiKeyChange?.((e.target as HTMLInputElement).value)}
            />
            <button
              class="btn btn--icon"
              @click=${onToggleShowApiKey}
              title=${showApiKey ? "Hide" : "Show"}
            >
              ${showApiKey ? "👁" : "👁‍🗨"}
            </button>
          </div>
        </div>

        <!-- Base URL -->
        <div class="field">
          <label>
            <span class="field-label">Base URL</span>
            <span class="field-hint">API endpoint URL</span>
          </label>
          <input
            type="text"
            class="field-input"
            placeholder="https://your-endpoint/v1"
            .value=${baseUrl}
            @input=${(e: Event) => onBaseUrlChange?.((e.target as HTMLInputElement).value)}
          />
          <div class="field-hint-preset">
            <button
              class="btn btn--sm"
              @click=${() => onBaseUrlChange?.("https://coding.dashscope.aliyuncs.com/v1")}
            >
              Aliyun DashScope
            </button>
            <button
              class="btn btn--sm"
              @click=${() => onBaseUrlChange?.("https://api.openai.com/v1")}
            >
              OpenAI
            </button>
            <button
              class="btn btn--sm"
              @click=${() => onBaseUrlChange?.("http://localhost:11434/v1")}
            >
              Ollama (Local)
            </button>
          </div>
        </div>

        <!-- Model -->
        <div class="field">
          <label>
            <span class="field-label">Model ID</span>
            <span class="field-hint">Model identifier</span>
          </label>
          <input
            type="text"
            class="field-input"
            placeholder="qwen3.5-plus"
            .value=${model}
            @input=${(e: Event) => onModelChange?.((e.target as HTMLInputElement).value)}
          />
          <div class="field-hint-preset">
            <button
              class="btn btn--sm"
              @click=${() => onModelChange?.("qwen3.5-plus")}
            >
              qwen3.5-plus
            </button>
            <button
              class="btn btn--sm"
              @click=${() => onModelChange?.("MiniMax-M2.5")}
            >
              MiniMax-M2.5
            </button>
            <button
              class="btn btn--sm"
              @click=${() => onModelChange?.("deepseek-chat")}
            >
              deepseek-chat
            </button>
          </div>
        </div>

        <!-- Default Model Toggle -->
        <div class="field">
          <label class="checkbox-label">
            <input
              type="checkbox"
              .checked=${defaultModel === model && model !== ""}
              @change=${(e: Event) =>
                onDefaultModelChange?.(
                  (e.target as HTMLInputElement).checked ? model : "",
                )}
            />
            <span>Set as default Agent model</span>
          </label>
          <p class="field-hint">Use this model as the default for Agent Runtime</p>
        </div>

        <!-- Actions -->
        <div class="models-actions">
          <button class="btn" ?disabled=${loading} @click=${onReload}>
            ${loading ? "Loading..." : "Reload"}
          </button>
          <button
            class="btn primary"
            ?disabled=${saving}
            @click=${() =>
              onSave?.({
                apiKey,
                baseUrl,
                model,
                defaultModel,
              })}
          >
            ${saving ? "Saving..." : "Save"}
          </button>
        </div>

        <!-- Status -->
        <div class="models-status">
          <div class="status-item">
            <span class="status-label">Status:</span>
            <span class="status-value ${apiKey && model ? "ok" : "warning"}">
              ${apiKey && model ? "Active: " + model : "Not configured"}
            </span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderModels(props: ModelsRenderProps) {
  if (props.loading && !props.apiKey) {
    return html`
      <div class="models-loading">
        <div class="spinner"></div>
        <span>Loading...</span>
      </div>
    `;
  }

  return renderModelsForm(props);
}
