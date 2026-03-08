import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { ChannelAccountSnapshot } from "../types.ts";
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

export interface FeishuAccount extends ChannelAccountSnapshot {
  probe?: {
    ok: boolean;
    status?: string;
    error?: string;
    appId?: string;
    botName?: string;
    botOpenId?: string;
  };
}

export function renderFeishuCard(params: {
  props: ChannelsProps;
  feishu?: FeishuStatus;
  feishuAccounts: FeishuAccount[];
  accountCountLabel: unknown;
}) {
  const { props, feishu, feishuAccounts, accountCountLabel } = params;

  // 获取当前配置
  const configForm = props.configForm as Record<string, unknown> | null;
  const feishuConfig = (configForm?.channels as Record<string, unknown> | undefined)?.feishu as Record<string, unknown> | undefined;

  // 获取已配置的账号（默认账号或 accounts 中的账号）
  const accounts = feishuConfig?.accounts as Record<string, unknown> | undefined;
  const defaultAccount = feishuConfig?.defaultAccount as string | undefined;
  const appId = feishuConfig?.appId as string | undefined;
  const appSecret = feishuConfig?.appSecret as string | undefined;
  const connectionMode = feishuConfig?.connectionMode as string | undefined;
  const domain = feishuConfig?.domain as string | undefined;
  const enabled = feishuConfig?.enabled as boolean | undefined;

  // 构建账号列表
  const accountList: Array<{ id: string; name: string; appId?: string; appSecret?: string; enabled?: boolean }> = [];

  // 如果有 accounts 配置，遍历获取
  if (accounts && typeof accounts === "object") {
    for (const [id, account] of Object.entries(accounts)) {
      if (account && typeof account === "object") {
        const acc = account as Record<string, unknown>;
        accountList.push({
          id,
          name: (acc.name as string) || id,
          appId: acc.appId as string | undefined,
          appSecret: acc.appSecret as string | undefined,
          enabled: acc.enabled as boolean | undefined,
        });
      }
    }
  }

  // 如果没有 accounts 但有 appId，说明是旧版配置（单个账号）
  if (accountList.length === 0 && appId) {
    accountList.push({
      id: "default",
      name: "默认机器人",
      appId: appId,
      appSecret: appSecret,
      enabled: enabled !== false,
    });
  }

  // 处理配置变更
  const handleFieldChange = (path: string[], value: unknown) => {
    props.onConfigPatch(["channels", "feishu", ...path], value);
  };

  // 添加新账号
  const handleAddAccount = () => {
    const newId = `robot_${Date.now()}`;
    handleFieldChange(["accounts", newId, "enabled"], true);
    handleFieldChange(["accounts", newId, "name"], "新机器人");
  };

  // 删除账号
  const handleDeleteAccount = (accountId: string) => {
    if (accountId === "default") {
      // 删除默认账号时，清空整个 feishu 配置
      handleFieldChange([], undefined);
    } else {
      handleFieldChange(["accounts", accountId], undefined);
    }
  };

  // 切换账号启用状态
  const handleToggleAccount = (accountId: string, enabled: boolean) => {
    if (accountId === "default") {
      handleFieldChange(["enabled"], enabled);
    } else {
      handleFieldChange(["accounts", accountId, "enabled"], enabled);
    }
  };

  const renderAccountRow = (account: { id: string; name: string; appId?: string; appSecret?: string; enabled?: boolean }) => {
    const status = feishuAccounts.find(a => a.accountId === account.id);
    const isRunning = status?.running ?? false;
    const probe = status?.probe;

    return html`
      <div class="account-card" style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-secondary);">
        <div class="row" style="justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; color: var(--text);">${account.name}</div>
            <div style="font-size: 12px; color: var(--text-secondary);">App ID: ${account.appId || "未配置"}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="padding: 4px 8px; border-radius: 4px; font-size: 12px; background: ${isRunning ? "var(--accent)" : "var(--text-secondary)"}; color: white;">
              ${isRunning ? "运行中" : "已停止"}
            </span>
            <label style="display: flex; align-items: center; cursor: pointer; color: var(--text);">
              <input
                type="checkbox"
                .checked=${account.enabled !== false}
                @change=${(e: Event) => handleToggleAccount(account.id, (e.target as HTMLInputElement).checked)}
                style="margin-right: 4px;"
              />
              启用
            </label>
            <button
              class="btn"
              style="padding: 4px 8px; font-size: 12px; background: var(--danger); color: white; border: none; border-radius: 4px; cursor: pointer;"
              @click=${() => handleDeleteAccount(account.id)}
            >
              删除
            </button>
          </div>
        </div>
        ${
          probe
            ? html`<div style="margin-top: 8px; font-size: 12px; color: ${probe.ok ? "var(--accent)" : "var(--danger)"};">
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
      <div class="card-sub">配置和管理飞书机器人账号</div>

      <!-- 账号列表 -->
      <div style="margin-top: 16px;">
        <div class="row" style="justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="font-weight: bold; color: var(--text);">已配置的账号 (${accountList.length})</div>
          <button
            class="btn primary"
            style="padding: 6px 12px; font-size: 14px;"
            @click=${handleAddAccount}
          >
            + 添加账号
          </button>
        </div>

        ${accountList.length === 0
          ? html`<div style="padding: 20px; text-align: center; color: var(--text-secondary); background: var(--bg-secondary); border-radius: 8px;">
              暂无配置的账号，请点击"添加账号"添加第一个机器人
            </div>`
          : accountList.map(account => renderAccountRow(account))
        }
      </div>

      <!-- 简化配置表单 -->
      <div style="margin-top: 24px; padding: 16px; background: var(--bg-secondary); border-radius: 8px;">
        <div style="font-weight: bold; margin-bottom: 12px; color: var(--text);">全局配置</div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">飞书域名</label>
            <select
              .value=${domain || "feishu"}
              @change=${(e: Event) => handleFieldChange(["domain"], (e.target as HTMLSelectElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);"
            >
              <option value="feishu">飞书 (feishu)</option>
              <option value="lark">飞书国际版 (lark)</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">连接模式</label>
            <select
              .value=${connectionMode || "websocket"}
              @change=${(e: Event) => handleFieldChange(["connectionMode"], (e.target as HTMLSelectElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);"
            >
              <option value="websocket">WebSocket (推荐)</option>
              <option value="webhook">Webhook</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">私聊策略</label>
            <select
              .value=${(feishuConfig?.dmPolicy as string) || "open"}
              @change=${(e: Event) => handleFieldChange(["dmPolicy"], (e.target as HTMLSelectElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);"
            >
              <option value="open">完全开放</option>
              <option value="pairing">需要配对</option>
              <option value="allowlist">白名单</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 12px; margin-bottom: 4px; color: var(--text-secondary);">群聊策略</label>
            <select
              .value=${(feishuConfig?.groupPolicy as string) || "open"}
              @change=${(e: Event) => handleFieldChange(["groupPolicy"], (e.target as HTMLSelectElement).value)}
              style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);"
            >
              <option value="open">完全开放</option>
              <option value="allowlist">白名单</option>
              <option value="disabled">禁用</option>
            </select>
          </div>
        </div>
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
