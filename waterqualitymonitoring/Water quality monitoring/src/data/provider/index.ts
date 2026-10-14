import { getDataProviderKind } from '@/data/arcgis/config'
import { arcgisDataProvider } from '@/data/provider/arcgis-provider'
import { mockDataProvider } from '@/data/provider/mock-provider'
import type { DataProvider } from '@/data/provider/types'

export type { DataProvider } from '@/data/provider/types'

export function getDataProvider(): DataProvider {
  return getDataProviderKind() === 'arcgis' ? arcgisDataProvider : mockDataProvider
}

export const dataProvider = getDataProvider()
