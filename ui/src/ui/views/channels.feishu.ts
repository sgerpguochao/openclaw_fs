import { html, nothing } from "lit";
import { formatRelativeTimestamp } from "../format.ts";
import type { ChannelAccountSnapshot } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
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
  const hasMultipleAccounts = feishuAccounts.length > 1;

  const renderAccountCard = (account: FeishuAccount, index: number) => {
    const probe = account.probe;
    const label = account.name || account.accountId;
    return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">
            ${probe?.botName ? probe.botName : label}
          </div>
          <div class="account-card-id">${account.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">Running</span>
            <span>${account.running ? "Yes" : "No"}</span>
          </div>
          <div>
            <span class="label">Enabled</span>
            <span>${account.enabled ? "Yes" : "No"}</span>
          </div>
          <div>
            <span class="label">Configured</span>
            <span>${account.configured ? "Yes" : "No"}</span>
          </div>
          <div>
            <span class="label">App ID</span>
            <span>${probe?.appId ?? "n/a"}</span>
          </div>
          <div>
            <span class="label">Last inbound</span>
            <span>${account.lastInboundAt ? formatRelativeTimestamp(account.lastInboundAt) : "n/a"}</span>
          </div>
          ${
            account.lastError
              ? html`
                <div class="account-card-error">
                  ${account.lastError}
                </div>
              `
              : nothing
          }
        </div>
        <div class="row" style="margin-top: 8px;">
          <button
            class="btn"
            style="font-size: 12px;"
            @click=${() => props.onRefresh(true)}
          >
            Probe
          </button>
        </div>
      </div>
    `;
  };

  return html`
    <div class="card">
      <div class="card-title">Feishu</div>
      <div class="card-sub">飞书机器人配置与状态</div>
      ${accountCountLabel}

      ${
        hasMultipleAccounts
          ? html`
            <div class="account-card-list">
              ${feishuAccounts.map((account, index) => renderAccountCard(account, index))}
            </div>
          `
          : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">Configured</span>
                <span>${feishu?.configured ? "Yes" : "No"}</span>
              </div>
              <div>
                <span class="label">Running</span>
                <span>${feishu?.running ? "Yes" : "No"}</span>
              </div>
              <div>
                <span class="label">Mode</span>
                <span>${feishu?.mode ?? "n/a"}</span>
              </div>
              <div>
                <span class="label">Last start</span>
                <span>${feishu?.lastStartAt ? formatRelativeTimestamp(feishu.lastStartAt) : "n/a"}</span>
              </div>
              <div>
                <span class="label">Last probe</span>
                <span>${feishu?.lastProbeAt ? formatRelativeTimestamp(feishu.lastProbeAt) : "n/a"}</span>
              </div>
            </div>
          `
      }

      ${
        feishu?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${feishu.lastError}
          </div>`
          : nothing
      }

      ${
        feishu?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${feishu.probe.ok ? "ok" : "failed"} ·
            ${feishu.probe.status ?? ""} ${feishu.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({ channelId: "feishu", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          Probe
        </button>
      </div>
    </div>
  `;
}
