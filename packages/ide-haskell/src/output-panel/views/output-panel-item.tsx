import * as etch from 'etch'
import { ResultItem } from '../../results-db'

export interface IProps extends JSX.Props {
  model: ResultItem
}

export class OutputPanelItem implements JSX.ElementClass {
  public element!: HTMLElement
  constructor(public props: IProps) {
    etch.initialize(this)
  }

  public render() {
    return (
      <ide-haskell-panel-item key={this.props.model.hash()}>
        {this.renderPosition()}
        {this.renderContext()}
        <ide-haskell-item-description
          innerHTML={this.props.model.message.toHtml()}
        />
      </ide-haskell-panel-item>
    )
  }

  public async update(props: IProps) {
    this.props.model = props.model
    return etch.update(this)
  }

  public async destroy() {
    await etch.destroy(this)
  }

  public clickPosition = () => {
    if (this.props.model.uri !== undefined) {
      // tslint:disable-next-line:no-floating-promises
      atom.workspace.open(this.props.model.uri, {
        searchAllPanes: true,
        initialLine: this.props.model.position && this.props.model.position.row,
        initialColumn:
          this.props.model.position && this.props.model.position.column,
      })
    }
  }

  private renderPosition() {
    if (this.props.model.uri !== undefined) {
      const positionText = this.props.model.position
        ? `${this.props.model.uri}: ${this.props.model.position.row + 1}, ${this
            .props.model.position.column + 1}`
        : this.props.model.uri
      return (
        <ide-haskell-item-position on={{ click: this.clickPosition }}>
          {positionText}
        </ide-haskell-item-position>
      )
    } else {
      return ''
    }
  }

  private renderContext() {
    if (this.props.model.context !== undefined) {
      return (
        <ide-haskell-item-context>
          {this.props.model.context}
        </ide-haskell-item-context>
      )
    } else {
      return ''
    }
  }
}
