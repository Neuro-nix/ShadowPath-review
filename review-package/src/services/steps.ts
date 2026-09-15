import { Capacitor, registerPlugin } from '@capacitor/core'

export type StepSnapshot = {
  steps: number
  source: 'mock' | 'healthkit'
  status: 'ready' | 'permission_needed' | 'unavailable'
  message: string
}

type NativePermissionResult = {
  granted: boolean
  status: StepSnapshot['status']
  message: string
}

type NativeStepResult = {
  steps: number
  status: StepSnapshot['status']
  message: string
}

type HealthKitStepsPlugin = {
  requestStepPermissions: () => Promise<NativePermissionResult>
  getTodaySteps: () => Promise<NativeStepResult>
}

const HealthKitSteps = registerPlugin<HealthKitStepsPlugin>('HealthKitSteps')

export const readTodaySteps = async (): Promise<StepSnapshot> => {
  if (Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform()) {
    try {
      const permission = await HealthKitSteps.requestStepPermissions()

      if (!permission.granted) {
        return {
          steps: 0,
          source: 'healthkit',
          status: permission.status,
          message: 'Нужно разрешить чтение шагов в HealthKit.',
        }
      }

      const result = await HealthKitSteps.getTodaySteps()
      return {
        steps: result.steps,
        source: 'healthkit',
        status: result.status,
        message: 'Шаги загружены из HealthKit.',
      }
    } catch (error) {
      return {
        steps: 0,
        source: 'healthkit',
        status: 'unavailable',
        message: error instanceof Error ? error.message : 'Не удалось прочитать шаги из HealthKit.',
      }
    }
  }

  const demoSteps = 6242

  return {
    steps: demoSteps,
    source: 'mock',
    status: 'ready',
    message: 'Демо-режим в браузере. На iPhone шаги читаются через HealthKit.',
  }
}
