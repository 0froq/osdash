export type NotionPage = {
  id: string
  title: string
  url: string
}

/** Notion is not connected. The board never calls this. */
export type NotionSource = {
  connected: false
  listOpen: () => Promise<NotionPage[]>
}

export function createNotionSource(): NotionSource {
  return {
    connected: false,
    async listOpen() {
      return []
    },
  }
}
