import esriRequest from '@arcgis/core/request.js'
import MosaicRule from '@arcgis/core/layers/support/MosaicRule.js'
import type ImageryLayer from '@arcgis/core/layers/ImageryLayer.js'
import type {
  SentinelMosaicSpec,
} from '@/features/map/historical-sentinel'

type MosaicRuleInstance = InstanceType<typeof MosaicRule>

export function cloneMosaicRule(
  rule: ImageryLayer['mosaicRule'] | null | undefined,
): MosaicRuleInstance | null {
  if (!rule || typeof rule.clone !== 'function') return null
  return rule.clone()
}

export function mosaicRuleFromSpec(
  spec: SentinelMosaicSpec,
  production: MosaicRuleInstance | null,
): MosaicRuleInstance {
  const rule = production ? production.clone() : new MosaicRule()
  rule.method = spec.method
  rule.operation = spec.operation
  rule.ascending = spec.ascending
  rule.sortField = spec.sortField
  rule.sortValue = spec.sortValue
  rule.where = spec.where
  rule.lockRasterIds = null
  return rule
}

export async function imageServiceRasterCount(serviceUrl: string, where: string): Promise<number> {
  const response = await esriRequest(`${serviceUrl.replace(/\/+$/, '')}/query`, {
    query: {
      f: 'json',
      where,
      returnCountOnly: true,
    },
    responseType: 'json',
  })
  const count = (response.data as { count?: unknown } | null)?.count
  if (typeof count !== 'number') {
    throw new Error('Sentinel scene count unavailable')
  }
  return count
}
