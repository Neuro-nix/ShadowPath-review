import { getMapNode } from '../game/map.ts'
import { getConnectBattleConfig, getLockpickingConfig } from '../game/minigames.ts'
import { getPointEventDefinition, getPointEventSaveKey } from '../game/pointEvents.ts'
import type { GameSave } from '../game/progression.ts'

const PROLOGUE_ID = 'silent-ruins'

export const getPendingPrologueSceneNodeId = (save: GameSave) => {
  if (save.world.currentLocationId !== PROLOGUE_ID) return null
  const node = getMapNode(save.map.currentNodeId, PROLOGUE_ID)
  if (!node) return null
  const pointEvent = getPointEventDefinition(PROLOGUE_ID, node.id)
  const pointKey = getPointEventSaveKey(PROLOGUE_ID, node.id)
  if (pointEvent && !save.minigames.pointEvents[pointKey]) return node.id
  if (node.encounterId && !save.story.completedEncounterIds.includes(node.encounterId)) return node.id
  if (getLockpickingConfig(node.id) && !save.minigames.lockpicking[node.id]) return node.id
  if (getConnectBattleConfig(node.id) && !save.minigames.battles[node.id]) return node.id
  return null
}
