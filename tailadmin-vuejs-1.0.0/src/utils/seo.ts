const upsertMetaByName = (name: string, content: string) => {
  if (!content) {
    return
  }
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

const upsertMetaByProperty = (property: string, content: string) => {
  if (!content) {
    return
  }
  let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('property', property)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export const setDocumentTitle = (pageTitle?: string, appName = 'Transport App') => {
  if (pageTitle) {
    document.title = `${pageTitle} – ${appName}`
  } else {
    document.title = appName
  }
}

export const applyRouteMeta = (
  meta: Record<string, unknown> | undefined,
  pageTitle: string,
  appName = 'Transport App'
) => {
  setDocumentTitle(pageTitle, appName)

  const description = meta?.description as string | undefined
  const robots = meta?.robots as string | undefined

  if (description) {
    upsertMetaByName('description', description)
  }

  if (robots) {
    upsertMetaByName('robots', robots)
  }

  upsertMetaByProperty('og:title', document.title)

  if (description) {
    upsertMetaByProperty('og:description', description)
  }
}

export { upsertMetaByName, upsertMetaByProperty }
