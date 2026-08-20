export function flagsSatisfied(flags: Record<string, true>, requires?: string[], forbids?: string[]): boolean {
  if (requires && !requires.every((f) => flags[f])) return false;
  if (forbids && forbids.some((f) => flags[f])) return false;
  return true;
}

export function cluesSatisfied(collected: string[], requires?: string[]): boolean {
  if (!requires) return true;
  return requires.every((c) => collected.includes(c));
}
