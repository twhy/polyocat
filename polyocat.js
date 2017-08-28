async function main() {

  const REGEXP = {
    "/ year": /\/ year$/,
    "/ month": /\/ month$/,
    "N open": /^([\d,]+) Open$/,
    "N closed": /^([\d,]+) Closed$/,
    "N files": /^([\d,]+) files?$/,
    "N forks": /^([\d,]+) forks?$/,
    "N stars": /^([\d,]+) stars?$/,
    "N comments": /^([\d,]+) comments?$/,
    "N remaining": /^([\d,]+) remaining$/,
    "N languages": /^([\d,]+) languages?$/,
    "N applications": /^([\d,]+) applications?$/,
    "N repositories": /^([\d,]+) repositor(?:y|ies)$/,
    "N hours ago": /^(\d+) hours ago$/,
    "N stars today": /^([\d,]+) stars today$/,
    "N stars this week": /^([\d,]+) stars this week$/,
    "N stars this month": /^([\d,]+) stars this month$/,
    "N contributions": /^([\d,]+) contributions?$/,
    "N contributions in the last year": /^([\d,]+) contributions in the last year$/,
    "month day": /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+)$/,
    "on month day": /^on (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+)$/,
    "on month day, year": /^on (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+), (\d{4})$/,
    "Joined on Jun 24, 2017": /^Joined on (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d+), (\d{4})$/,
    "View USER on GitHub": /View ([\w-]+) on GitHub/,
    "Delete PROJECT_NAME": /Delete (.*)$/,
    "View USER": /View ([\w-]+)$/,
    "Turn USER into an organization": /Turn ([\w-]+) into an organization/,
    "Your next charge will be on date": /Your next charge will be on (\d{4}-\d{2}-\d{2})./
  }

  let page = where()
  let lang = language()
  let dict = await translation(lang)

  let observer = new MutationObserver(mutations => {
    mutations
      .filter(mutation =>
        (mutation.type === 'childList' && mutation.addedNodes.length) ||
        (mutation.type === 'attributes' && mutation.attributeName === 'placeholder')
      )
      .forEach(mutation => translate(mutation.target))
  })

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  })

  translate(document.body)
  
  function find(str) {
    if (page && dict[page][str]) return ` ${dict[page][str]} `
    if (dict.global[str]) return ` ${dict.global[str]} `
    for (let key in REGEXP) {
      let reg = REGEXP[key]
      if (reg.test(str)) {
        str = str
            .replace(reg, dict.regexp[key])
            .replace(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/, (match, p1) => dict.global.m2n[p1])
        return ` ${str} `
      }
    }
    return ''
  }
  
  function where() {
    if (location.host === 'gist.github.com') return 'gist'

    let pathname = location.pathname
    if (pathname === '/' || /dashboard$/.test(pathname)) return 'dashboard'
    if (pathname === '/trending') return 'trending'
    if (pathname === '/new' || pathname.endsWith('repositories/new')) return 'new'
    if (/^\/watching/.test(pathname)) return 'watching'
    if (/^\/pulls(\/.*)?/.test(pathname)) return 'pulls'
    if (/^\/notifications/.test(pathname)) return 'notifications'
    if (/^\/(?:organizations\/\w+\/)?settings\/.+$/.test(pathname)) return 'settings'
    if (/^\/[\w-]+\/?$/.test(pathname)) return 'profile'
    if (/^\/[\w-]+\/.+$/.test(pathname)) return 'repository'
  }

  function language() {
    return localStorage.getItem('polyocat-lang') || navigator.language || navigator.languages[0]
  }

  async function translation(lang) {
    let url = chrome.extension.getURL(`translations/${lang}.json`)
    let res = await fetch(url)
    return await res.json()
  }
  
  function translate(node) {
    translateNode(node)

    if (node.classList && node.classList[0] === 'file') {
      return translate(node.firstElementChild)
    }
    
    if (
      node.id === 'files' ||
      node.id === 'readme' ||
      /octotree_sidebar/.test(node.className) ||
      /personal-access-tokens-group/.test(node.className)
    ) { return }

    if (node.className && /CodeMirror/.test(node.className)) return

    node.childNodes.forEach(translate)
  }
  
  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) return translateTextNode(node)
    if (node.nodeType === Node.ELEMENT_NODE) return translateElement(node)
  }
 
  function translateTextNode(node) {
    if (!node || node.nodeValue == null) return
    let text = node.nodeValue.replace(/[\n\s]+/g, ' ').trim()
    let tran = find(text)
    if (tran) node.nodeValue = tran
  }
  
  function translateElement(elem) {
    if (elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') translateAttribute(elem, 'placeholder')

    if (elem.tagName === 'INPUT' && elem.type === 'submit') translateAttribute(elem, 'value')

    if (elem.tagName === 'OPTGROUP' && elem.label) translateAttribute(elem, 'label')

    if (elem.tagName === 'RELATIVE-TIME' || elem.tagName === 'TIME-AGO') {
      elem.innerText = elem.innerText.replace(
        /(\d+|a|an) (day|days|hour|hours|minute|minutes|second|seconds|month|months|year|years) (ago)/,
        (match, p1, p2, p3) => `${find(p1) || p1} ${find(p2).trim()}${find(p3).trim()}`
      )
    }

    translateAttribute(elem, 'aria-label')
    translateAttribute(elem, 'data-copied-hint')
  }

  function translateAttribute(elem, name) {
    if (elem[name]) {
      let tran = find(elem[name])
      if (tran) elem[name] = tran
      return
    }
    
    if (elem.hasAttribute(name)) {
      let tran = find(elem.getAttribute(name))
      if (tran) elem.setAttribute(name, tran)
    }
  }

  console.log(page, lang, dict)
}

main()