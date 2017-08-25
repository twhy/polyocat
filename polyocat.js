main()

async function main() {

  const REGEXP = {
    "N open": /([\d,]+) Open/,
    "N closed": /([\d,]+) Closed/
  }

  let page = where()
  let lang = language()
  let dict = await translation(lang)

  translate(document.body)

  console.log(page, lang, dict)

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
  
  function find(str) {
    if (page && dict[page][str]) return ` ${dict[page][str]} `
    if (dict.global[str]) return ` ${dict.global[str]} `
    for (let key in REGEXP) {
      let reg = REGEXP[key]
      if (reg.test(str)) {
        return str.replace(reg, dict.regexp[key])
      }
    }
    return ''
  }
  
  function where() {
    let pathname = location.pathname
    if (pathname === '/' || pathname === '/dashboard') return 'homepage'
    if (pathname === '/new') return 'new'
    if (/^\/watching/.test(pathname)) return 'watching'
    if (/^\/notifications/.test(pathname)) return 'notifications'
    if (/\/settings\/.+$/.test(pathname)) return 'settings'
    if (/^\/\w+\/?$/.test(pathname)) return 'profile'
    if (/^\/\w+\/.+$/.test(pathname)) return 'repository'
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
    if (node.id === 'readme' || node.id === 'files') return
    if (node.className === 'file') return translate(node.firstElementChild)
    node.childNodes.forEach(translate)
  }
  
  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) translateTextNode(node)
    if (node.nodeType === Node.ELEMENT_NODE) translateElement(node)
  }
  
  function translateElement(elem) {
    if ((elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') && elem.placeholder) {
      let placeholder = find(elem.placeholder)
      if (placeholder) elem.placeholder = placeholder
    }
    if (elem.tagName === 'INPUT' && elem.type === 'submit') {
      let value = find(elem.value)
      if (value) elem.value = value
    }
    if ((elem.tagName === 'RELATIVE-TIME' || elem.tagName === 'TIME-AGO') && elem.innerText) {
      elem.innerText = elem.innerText.replace(
        /(\d+|a|an) (day|days|hour|hours|minute|minutes|second|seconds|month|months|year|years) (ago)/,
        (match, p1, p2, p3) => `${find(p1) || p1} ${find(p2).trim()}${find(p3).trim()}`
      )
    }
    if (elem.hasAttribute('aria-label')) {
      let label = find(elem.getAttribute('aria-label'))
      if (label) elem.setAttribute('aria-label', label)
    }
  }
  
  function translateTextNode(node) {
    if (!node || node.nodeValue == null) return
    let text = node.nodeValue.replace(/[\n\s]+/g, ' ').trim()
    let tran = find(text)
    if (tran) {
      node.nodeValue = tran
    }
  }
}