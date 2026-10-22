/**
 * 外部部署品牌信息
 *
 * 平台托管环境下，应用名称、描述、图标由平台 API 动态下发；
 * 导出到外部独立部署后，平台 API 不可用，这里提供固定的品牌信息。
 */
export const BRAND = {
  appName: '东盟智贸 ASEAN-Go',
  appDescription: '中国-东盟跨境贸易多智能体 AI 平台',
  appAvatar: '/favicon.svg',
} as const;
