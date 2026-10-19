export type ClaimIntent = 'claim' | 'ask' | 'withdraw' | 'none'

export type ClassificationSource = 'ai' | 'keyword' | 'cache'

export type CommentClassification = {
  intent: ClaimIntent
  intentConfidence: number
  maintainerOk?: number
  source: ClassificationSource
}

export const INTENT_CONFIRM_THRESHOLD = 0.7
export const MAINTAINER_OK_THRESHOLD = 0.5

export const CLEF_MODEL = '@cf/cloudflare/clef-flash' as const

export const MAINTAINER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

export function isMaintainerAssociation(association?: string): boolean {
  return association !== undefined && MAINTAINER_ASSOCIATIONS.has(association)
}
