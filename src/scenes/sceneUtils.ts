import type { RadioEvent, ChoiceOption, PageDef } from '../types'
import type { SceneCtx } from '../engine/SceneManager'

/** Plays a Second Voice event end-to-end and applies its consequences to game state. */
export async function runRadioEvent(ctx: SceneCtx, event: RadioEvent, seenId: string): Promise<ChoiceOption> {
  ctx.game.markSeen(seenId)
  const choice = await ctx.radioUI.play(event)
  ctx.game.setStatic(choice.staticDelta)
  ctx.game.recordChoice(choice.kind)
  choice.setFlags?.forEach((f) => ctx.game.setFlag(f))
  choice.clearFlags?.forEach((f) => ctx.game.setFlag(f, false))
  ctx.game.save()
  return choice
}

/** Opens a page in the Logbook and, if it's one of the 6 hidden collectibles, records it found. */
export function readPage(ctx: SceneCtx, page: PageDef) {
  void ctx.logbook.show(page)
  if (page.hidden) ctx.game.addPage(page.id)
}
