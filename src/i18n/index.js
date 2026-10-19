// Interface text (buttons, labels, messages). Small, so client components can
// import it. Long page copy lives in ./server.js and never reaches the browser.
import en from './ui/en'
import bn from './ui/bn'
import { makeTranslator, pick } from './core'

const UI = { en, bn }

export function getT(lang) {
  return makeTranslator(UI, lang)
}

export function getUi(lang, key) {
  return pick(UI, lang, key)
}
