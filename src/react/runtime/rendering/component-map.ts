import type { ComponentType } from 'react'

export type RouteComponent = ComponentType<Record<string, unknown>>
export type ComponentMap = Record<string, RouteComponent>
