import { Capacitor, registerPlugin } from '@capacitor/core'

export type LockpickFeedbackKind = 'good' | 'perfect' | 'miss'

type PhysicalFeedbackPlugin = {
  lockpick: (options: { kind: LockpickFeedbackKind }) => Promise<void>
}

const PhysicalFeedback = registerPlugin<PhysicalFeedbackPlugin>('PhysicalFeedback')

const webVibrationPattern: Record<LockpickFeedbackKind, number | number[]> = {
  good: 18,
  perfect: [12, 22, 28],
  miss: [35, 18, 45],
}

export const playLockpickFeedback = async (kind: LockpickFeedbackKind) => {
  if (Capacitor.getPlatform() === 'ios' && Capacitor.isNativePlatform()) {
    try {
      await PhysicalFeedback.lockpick({ kind })
      return
    } catch {
      // Haptics are feel-only; unsupported native feedback should never block play.
    }
  }

  if ('vibrate' in navigator) {
    navigator.vibrate(webVibrationPattern[kind])
  }
}
