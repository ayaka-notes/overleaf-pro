import Settings from '@overleaf/settings'
import ZoteroRouter from './app/src/ZoteroRouter.mjs'

let ZoteroModule = {}

if (Settings.enabledLinkedFileTypes?.includes('zotero')) {
  const { default: ZoteroLinkedFileAgent } = await import(
    './app/src/ZoteroLinkedFileAgent.mjs'
  )

  ZoteroModule = {
    router: ZoteroRouter,
    linkedFileAgents: {
      zotero: () => ZoteroLinkedFileAgent,
    },
  }
}

export default ZoteroModule
