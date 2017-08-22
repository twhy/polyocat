(async function main() {
  
  let page = where()
  let language = 'zh-CN' || navigator.language || navigator.languages[0]
  let dictionary = await translation(language)

  translate(document.body)

  let observer = new MutationObserver((mutations) => {
    mutations
      .filter(mutation => mutation.type === 'childList' && mutation.addedNodes.length)
      .forEach(mutation => mutation.addedNodes.forEach(translate))
  })

  observer.observe(document.body, {
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
    if (/^\/[\w\d]+\/?$/.test(pathname)) return 'profile'
    if (/^\/[\w\d]+\/.+$/.test(pathname)) return 'repository'
  }
  
  function translate(node) {
    let childs = node.childNodes
  
    if (childs.length === 0) return
  
    childs.forEach(node => {
      switch (true) {
        case node.nodeType === Node.ELEMENT_NODE:
          translateElement(node)
          break
        case node.nodeType === Node.TEXT_NODE:
          translateTextNode(node)
          break
        default:
          break;
      }
    })
  }
  
  function translateElement(elem) {
    if (elem.id === 'readme') return
    if (elem.tagName === 'INPUT' && elem.placeholder) {
      let placeholder = find(elem.placeholder)
      if (placeholder) elem.placeholder = placeholder
    }
    if (elem.hasAttribute('aria-label')) {
      let label = find(elem.getAttribute('aria-label'))
      if (label) elem.setAttribute('aria-label', label)
    }
    
    translate(elem)
  }
  
  function translateTextNode(node) {
    let text = node.nodeValue.trim()
    let tran = find(text)
    if (tran) {
      node.nodeValue = tran
    }
  }

})()

