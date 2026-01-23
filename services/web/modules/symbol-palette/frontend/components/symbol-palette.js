import SymbolPaletteContent from './symbol-palette-content'

export default function SymbolPalette() {
  const handleSelect = (symbol) => {
    window.dispatchEvent(new CustomEvent('editor:insert-symbol', { detail: symbol }))
  }
  return <SymbolPaletteContent handleSelect={handleSelect} />
}
