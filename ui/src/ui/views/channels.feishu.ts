import { html, nothing } from "lit";
import type { ChannelsProps } from "./channels.types.ts";

export interface FeishuStatus {
  configured: boolean;
  running: boolean;
  mode?: string | null;
  lastStartAt?: number | null;
  lastStopAt?: number | null;
  lastError?: string | null;
  probe?: {
    ok: boolean;
    status?: string;
    error?: string;
    appId?: string;
    botName?: string;
    botOpenId?: string;
  } | null;
  lastProbeAt?: number | null;
}

interface AccountEntry {
  id: string;
  name: string;
  appId: string;
  appSecret: string;
  enabled: boolean;
}

export function renderFeishuCard(params: {
  props: ChannelsProps;
  feishu?: FeishuStatus;
  feishuAccounts: any[];
  accountCountLabel: unknown;
}) {
  const { props, feishu, feishuAccounts } = params;

  // 获取当前配置
  const configForm = props.configForm as Record<string, unknown> | null;
  const feishuConfig = (configForm?.channels as Record<string, unknown> | undefined)?.feishu as Record<string, unknown> | undefined;

  // 构建账号列表 - 只显示有 appId 的账号
  const accountList: AccountEntry[] = [];

  // 从 accounts 配置中获取
  const accounts = feishuConfig?.accounts as Record<string, unknown> | undefined;
  if (accounts && typeof accounts === "object") {
    for (const [id, account] of Object.entries(accounts)) {
      if (account && typeof account === "object") {
        const acc = account as Record<string, unknown>;
        // 只显示有 appId 的账号
        const accAppId = acc.appId as string | undefined;
        if (accAppId && accAppId.trim()) {
          accountList.push({
            id,
            name: (acc.name as string) || id,
            appId: accAppId,
            appSecret: (acc.appSecret as string) || "",
            enabled: acc.enabled !== false,
          });
        }
      }
    }
  }

  // 处理配置变更
  const handleFieldChange = (path: string[], value: unknown) => {
    props.onConfigPatch(["channels", "feishu", ...path], value);
  };

  // 更新账号信息
  const handleUpdateAccount = (accountId: string, field: string, value: string) => {
    handleFieldChange(["accounts", accountId, field], value);
  };

  // 删除账号
  const handleDeleteAccount = (accountId: string) => {
    handleFieldChange(["accounts", accountId], undefined);
  };

  // 切换账号启用状态
  const handleToggleAccount = (accountId: string, enabled: boolean) => {
    handleFieldChange(["accounts", accountId, "enabled"], enabled);
  };

  // 渲染账号编辑表单
  const renderAccountForm = (account: AccountEntry, index: number) => {
    const status = feishuAccounts.find((a: any) => a.accountId === account.id);
    const isRunning = status?.running ?? false;
    const probe = status?.probe;

    return html`
      <div style="margin-bottom: 16px; padding: 16px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-secondary);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: bold; color: var(--text);">
            ${account.name}
            <span style="font-weight: normal; color: var(--text-secondary);">(${account.id})</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${isRunning ? "var(--accent)" : "var(--text-secondary)"}; color: white;">
              ${isRunning ? "运行中" : "已停止"}
            </span>
            <label style="display: flex; align-items: center; cursor: pointer; color: var(--text); font-size: 14px;">
              <input
                type="checkbox"
                .checked=${account.enabled}
                @change=${(e: Event) => handleToggleAccount(account.id, (e.target as HTMLInputElement).checked)}
                style="margin-right: 4px;"
              />
              启用
            </label>
            <button
              class="btn"
              style="padding: 4px 12px; font-size: 12px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;"
              @click=${() => handleDeleteAccount(account.id)}
            >
              删除
            </button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">机器人名称</label>
            <input
              type="text"
              .value=${account.name}
              @change=${(e: Event) => handleUpdateAccount(account.id, "name", (e.target as HTMLInputElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); box-sizing: border-box;"
              placeholder="输入机器人名称"
            />
          </div>
          <div></div>
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">App ID *</label>
            <input
              type="text"
              .value=${account.appId || ""}
              @change=${(e: Event) => handleUpdateAccount(account.id, "appId", (e.target as HTMLInputElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); box-sizing: border-box;"
              placeholder="输入 App ID"
            />
          </div>
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">App Secret *</label>
            <input
              type="password"
              .value=${account.appSecret || ""}
              @change=${(e: Event) => handleUpdateAccount(account.id, "appSecret", (e.target as HTMLInputElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text); box-sizing: border-box;"
              placeholder="输入 App Secret"
            />
          </div>
        </div>

        ${
          probe
            ? html`<div style="margin-top: 12px; font-size: 12px; color: ${probe.ok ? "var(--accent)" : "var(--danger)"};">
                探测结果: ${probe.ok ? "成功" : "失败"} ${probe.error || ""}
              </div>`
            : nothing
        }
      </div>
    `;
  };

  return html`
    <div class="card">
      <div class="card-title">飞书机器人</div>
      <div class="card-sub">配置和管理飞书机器人账号（添加账号请修改配置文件）</div>

      <!-- 账号列表 -->
      <div style="margin-top: 16px;">
        <div style="font-weight: bold; color: var(--text); margin-bottom: 12px;">已配置的机器人 (${accountList.length})</div>

        ${accountList.length === 0
          ? html`<div style="padding: 40px; text-align: center; color: var(--text-secondary); background: var(--bg-secondary); border-radius: 8px;">
              <div style="margin-bottom: 8px;">暂无配置的机器人</div>
              <div style="font-size: 12px;">请在配置文件中添加机器人账号</div>
            </div>`
          : accountList.map((account, index) => renderAccountForm(account, index))
        }
      </div>

      <!-- 操作按钮 -->
      <div class="row" style="margin-top: 16px;">
        <button
          class="btn primary"
          ?disabled=${!props.configFormDirty}
          @click=${() => props.onConfigSave()}
        >
          ${props.configSaving ? "保存中..." : "保存配置"}
        </button>
        <button
          class="btn"
          @click=${() => props.onConfigReload()}
        >
          重新加载
        </button>
        <button
          class="btn"
          @click=${() => props.onRefresh(true)}
        >
          刷新状态
        </button>
      </div>

      <!-- 错误信息 -->
      ${
        feishu?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
              ${feishu.lastError}
            </div>`
          : nothing
      }
    </div>
  `;
}
