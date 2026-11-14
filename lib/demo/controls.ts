"use client"

import { useSyncExternalStore } from "react"

interface DemoControls {
  simulateFailure: boolean
  latencyMs: number
}

let state: DemoControls = { simulateFailure: false, latencyMs: 450 }
const listeners = new Set<() => void>()

export const demoControls = {
  get: () => state,
  set(partial: Partial<DemoControls>) {
    state = { ...state, ...partial }
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useDemoControls() {
  return useSyncExternalStore(demoControls.subscribe, demoControls.get, demoControls.get)
}
