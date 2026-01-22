const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1'])

const isLocalHost = (hostname: string) => LOCAL_HOSTNAMES.has(hostname)

const removeDevtoolsToggle = () => {
  const selectors = [
    '#__vue-devtools-container__',
    '#vue-devtools-iframe',
    '#vue-devtools-anchor',
    '.vue-devtools__anchor',
    '.vue-devtools-frame',
    '.vue-devtools__toggle',
    '#vue-devtools-toggle',
    '[data-vue-devtools-toggle]',
  ]
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => el.remove())
  })
}

const injectHideStyles = () => {
  if (document.getElementById('devtools-guard-style')) {
    return
  }
  const style = document.createElement('style')
  style.id = 'devtools-guard-style'
  style.textContent = `
    #__vue-devtools-container__,
    #vue-devtools-iframe,
    #vue-devtools-anchor,
    .vue-devtools__anchor,
    .vue-devtools-frame {
      display: none !important;
      visibility: hidden !important;
    }
  `
  document.head.appendChild(style)
}

const disableDevtools = (hostname: string) => {
  window.__VUE_DEVTOOLS_DISABLE__ = true

  if (import.meta.env.DEV) {
    console.info(`[devtools] disabled for non-local host: ${hostname}`)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHideStyles, { once: true })
  } else {
    injectHideStyles()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeDevtoolsToggle, { once: true })
  } else {
    removeDevtoolsToggle()
  }

  const observer = new MutationObserver(() => removeDevtoolsToggle())
  observer.observe(document.documentElement, { childList: true, subtree: true })
}

if (!isLocalHost(window.location.hostname)) {
  disableDevtools(window.location.hostname)
}

export {}

declare global {
  interface Window {
    __VUE_DEVTOOLS_DISABLE__?: boolean
  }
}
