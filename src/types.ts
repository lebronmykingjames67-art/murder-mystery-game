export type VoiceId = 'A' | 'B' | 'none'

export interface DialogueLine {
  voice: VoiceId
  speaker: string
  text: string
  pitchMul?: number
  warbleMul?: number
  roughnessMul?: number
  silenceMs?: number
}

export type ChoiceKind = 'answer' | 'silent' | 'switch'

export interface ChoiceOption {
  kind: ChoiceKind
  label: string
  requiresFlag?: string
  hideIfFlag?: string
  outcome: DialogueLine[]
  staticDelta: number
  setFlags?: string[]
  clearFlags?: string[]
}

export interface RadioEvent {
  id: string
  intro: DialogueLine[]
  choices: ChoiceOption[]
}

export interface PageDef {
  id: string
  title: string
  body: string[]
  hidden: boolean
}

export type EndingId = 'clear-sky' | 'answered' | 'real-frequency'

export interface EndingDef {
  id: EndingId
  title: string
  subtitle: string
  body: string[]
}
