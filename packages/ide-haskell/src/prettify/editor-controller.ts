import { TextEditor, CompositeDisposable } from 'atom'
import { prettifyFile } from './index'
import { IEditorController } from '../plugin-manager'

export class PrettifyEditorController implements IEditorController {
  private disposables = new CompositeDisposable()
  constructor(private editor: TextEditor) {
    const buffer = this.editor.getBuffer()
    this.disposables.add(buffer.onWillSave(this.prettify))
  }

  public static supportsGrammar(grammar: string): boolean {
    return [
      'source.c2hs',
      'source.cabal', // NOTE: special case
      'source.hsc2hs',
      'source.haskell',
      'text.tex.latex.haskell',
      'source.hsig',
    ].includes(grammar)
  }

  public destroy() {
    this.disposables.dispose()
  }

  private prettify = async () => {
    if (
      atom.config.get('ide-haskell.onSavePrettify', {
        scope: this.editor.getRootScopeDescriptor(),
      })
    ) {
      const format = this.editor.getGrammar().scopeName.replace(/\./g, '*')
      const enabled = atom.config.get('ide-haskell.onSavePrettifyFormats', {
        scope: this.editor.getRootScopeDescriptor(),
      })
      if (!enabled[format]) {
        return
      }
      await prettifyFile(this.editor)
    }
  }
}
