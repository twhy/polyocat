main()

async function main() {
  let page = where()
  let language = 'zh-CN' || navigator.language || navigator.languages[0]
  let dictionary = await translation(language)

  console.log(page, language, dictionary)

  translate(document.body)

  let observer = new MutationObserver(mutations => {
    mutations
      .filter(mutation => mutation.type === 'childList' && mutation.addedNodes.length)
      .forEach(mutation => mutation.addedNodes.forEach(translate))

    mutations
      .filter(mutation => mutation.type === 'attributes' && mutation.attributeName === 'placeholder')
      .forEach(mutation => translate(mutation.target))
  })

  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true
  })

  async function translation(lang) {
    let url = chrome.extension.getURL(`translations/${lang}.json`)
    let res = await fetch(url)
    return await res.json()
  }
  
  function find(key) {
    if (page && dictionary[page][key]) return ` ${dictionary[page][key]} `
    if (dictionary.global[key]) return ` ${dictionary.global[key]} `
  }
  
  function where() {
    let pathname = location.pathname
    if (pathname === '/') return 'homepage'
    if (pathname === '/new') return 'new'
    if (/^\/watching/.test(pathname)) return 'watching'
    if (/^\/notifications/.test(pathname)) return 'notifications'
    if (/\/settings\/.+$/.test(pathname)) return 'settings'
    if (/^\/[\w\d]+\/?$/.test(pathname)) return 'profile'
    if (/^\/[\w\d]+\/.+$/.test(pathname)) return 'repository'
  }
  
  function translate(node) {
    translateNode(node)
    node.childNodes.forEach(translate)
  }
  
  function translateNode(node) {
    switch (true) {
      case node.nodeType === Node.ELEMENT_NODE:
        translateElement(node)
        break
      case node.nodeType === Node.TEXT_NODE:
        translateTextNode(node)
        break
    }
  }
  
  function translateElement(elem) {
    if (elem.id === 'readme') return
    if ((elem.tagName === 'INPUT' || elem.tagName === 'TEXTAREA') && elem.placeholder) {
      let placeholder = find(elem.placeholder)
      if (placeholder) elem.placeholder = placeholder
    }
    if (elem.tagName === 'INPUT' && elem.type === 'submit') {
      let value = find(elem.value)
      if (value) elem.value = value
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