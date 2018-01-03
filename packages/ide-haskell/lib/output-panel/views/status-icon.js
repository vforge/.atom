"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const etch = require("etch");
const atom_1 = require("atom");
class StatusIcon {
    constructor(props) {
        this.props = props;
        this.disposables = new atom_1.CompositeDisposable();
        etch.initialize(this);
        this.disposables.add(atom.tooltips.add(this.element, {
            class: 'ide-haskell-status-tooltip',
            title: () => {
                const res = [];
                for (const [plugin, { status, detail }] of this.props.statusMap.entries()) {
                    res.push(`
          <ide-haskell-status-item>
            <ide-haskell-status-icon data-status="${status}">${plugin}</ide-haskell-status-icon>
            <ide-haskell-status-detail>${detail || ''}</ide-haskell-status-detail>
          </ide-haskell-status-item>
          `);
                }
                return res.join('');
            },
        }));
    }
    render() {
        return (etch.dom("ide-haskell-status-icon", { dataset: { status: this.calcCurrentStatus() } }));
    }
    async update(props) {
        this.props.statusMap = props.statusMap;
        return etch.update(this);
    }
    async destroy() {
        await etch.destroy(this);
        this.props.statusMap.clear();
    }
    calcCurrentStatus() {
        const prio = {
            progress: 5,
            error: 20,
            warning: 10,
            ready: 0,
        };
        const stArr = Array.from(this.props.statusMap.values());
        const [consensus] = stArr.sort((a, b) => prio[b.status] - prio[a.status]);
        return consensus ? consensus.status : 'ready';
    }
}
exports.StatusIcon = StatusIcon;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RhdHVzLWljb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvb3V0cHV0LXBhbmVsL3ZpZXdzL3N0YXR1cy1pY29uLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUFBLDZCQUE0QjtBQUM1QiwrQkFBMEM7QUFPMUM7SUFJRSxZQUFtQixLQUFhO1FBQWIsVUFBSyxHQUFMLEtBQUssQ0FBUTtRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksMEJBQW1CLEVBQUUsQ0FBQTtRQUU1QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBRXJCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDbkQsS0FBSyxFQUFFLDRCQUE0QjtZQUNuQyxLQUFLLEVBQUUsR0FBRyxFQUFFO2dCQUNWLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQTtnQkFDZCxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUMxRSxHQUFHLENBQUMsSUFBSSxDQUFDOztvREFFaUMsTUFBTSxLQUFLLE1BQU07eUNBQzVCLE1BQU0sSUFBSSxFQUFFOztXQUUxQyxDQUFDLENBQUE7Z0JBQ0osQ0FBQztnQkFDRCxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQTtZQUNyQixDQUFDO1NBQ0YsQ0FBQyxDQUFDLENBQUE7SUFDTCxDQUFDO0lBRU0sTUFBTTtRQUNYLE1BQU0sQ0FBQyxDQUVMLHNDQUF5QixPQUFPLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQUUsR0FBSSxDQUMzRSxDQUFBO0lBQ0gsQ0FBQztJQUVNLEtBQUssQ0FBQyxNQUFNLENBQUMsS0FBYTtRQUUvQixJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFBO1FBQ3RDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQzFCLENBQUM7SUFFTSxLQUFLLENBQUMsT0FBTztRQUNsQixNQUFNLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDeEIsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUE7SUFDOUIsQ0FBQztJQUVPLGlCQUFpQjtRQUN2QixNQUFNLElBQUksR0FBRztZQUNYLFFBQVEsRUFBRSxDQUFDO1lBQ1gsS0FBSyxFQUFFLEVBQUU7WUFDVCxPQUFPLEVBQUUsRUFBRTtZQUNYLEtBQUssRUFBRSxDQUFDO1NBQ1QsQ0FBQTtRQUNELE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQTtRQUN2RCxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFBO1FBQ3pFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQTtJQUMvQyxDQUFDO0NBQ0Y7QUF2REQsZ0NBdURDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZXRjaCBmcm9tICdldGNoJ1xuaW1wb3J0IHsgQ29tcG9zaXRlRGlzcG9zYWJsZSB9IGZyb20gJ2F0b20nXG5pbXBvcnQgKiBhcyBVUEkgZnJvbSAnYXRvbS1oYXNrZWxsLXVwaSdcblxuZXhwb3J0IGludGVyZmFjZSBJUHJvcHMgZXh0ZW5kcyBKU1guUHJvcHMgeyBzdGF0dXNNYXA6IE1hcDxzdHJpbmcsIFVQSS5JU3RhdHVzPiB9XG5cbnR5cGUgRWxlbWVudENsYXNzID0gSlNYLkVsZW1lbnRDbGFzc1xuXG5leHBvcnQgY2xhc3MgU3RhdHVzSWNvbiBpbXBsZW1lbnRzIEVsZW1lbnRDbGFzcyB7XG4gIHByaXZhdGUgZGlzcG9zYWJsZXM6IENvbXBvc2l0ZURpc3Bvc2FibGVcbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLXVuaW5pdGlhbGl6ZWRcbiAgcHJpdmF0ZSBlbGVtZW50OiBIVE1MRWxlbWVudFxuICBjb25zdHJ1Y3RvcihwdWJsaWMgcHJvcHM6IElQcm9wcykge1xuICAgIHRoaXMuZGlzcG9zYWJsZXMgPSBuZXcgQ29tcG9zaXRlRGlzcG9zYWJsZSgpXG5cbiAgICBldGNoLmluaXRpYWxpemUodGhpcylcblxuICAgIHRoaXMuZGlzcG9zYWJsZXMuYWRkKGF0b20udG9vbHRpcHMuYWRkKHRoaXMuZWxlbWVudCwge1xuICAgICAgY2xhc3M6ICdpZGUtaGFza2VsbC1zdGF0dXMtdG9vbHRpcCcsXG4gICAgICB0aXRsZTogKCkgPT4ge1xuICAgICAgICBjb25zdCByZXMgPSBbXVxuICAgICAgICBmb3IgKGNvbnN0IFtwbHVnaW4sIHsgc3RhdHVzLCBkZXRhaWwgfV0gb2YgdGhpcy5wcm9wcy5zdGF0dXNNYXAuZW50cmllcygpKSB7XG4gICAgICAgICAgcmVzLnB1c2goYFxuICAgICAgICAgIDxpZGUtaGFza2VsbC1zdGF0dXMtaXRlbT5cbiAgICAgICAgICAgIDxpZGUtaGFza2VsbC1zdGF0dXMtaWNvbiBkYXRhLXN0YXR1cz1cIiR7c3RhdHVzfVwiPiR7cGx1Z2lufTwvaWRlLWhhc2tlbGwtc3RhdHVzLWljb24+XG4gICAgICAgICAgICA8aWRlLWhhc2tlbGwtc3RhdHVzLWRldGFpbD4ke2RldGFpbCB8fCAnJ308L2lkZS1oYXNrZWxsLXN0YXR1cy1kZXRhaWw+XG4gICAgICAgICAgPC9pZGUtaGFza2VsbC1zdGF0dXMtaXRlbT5cbiAgICAgICAgICBgKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXMuam9pbignJylcbiAgICAgIH0sXG4gICAgfSkpXG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCkge1xuICAgIHJldHVybiAoXG4gICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tdW5zYWZlLWFueVxuICAgICAgPGlkZS1oYXNrZWxsLXN0YXR1cy1pY29uIGRhdGFzZXQ9e3sgc3RhdHVzOiB0aGlzLmNhbGNDdXJyZW50U3RhdHVzKCkgfX0gLz5cbiAgICApXG4gIH1cblxuICBwdWJsaWMgYXN5bmMgdXBkYXRlKHByb3BzOiBJUHJvcHMpIHtcbiAgICAvLyBUT0RPOiBEaWZmIGFsZ29cbiAgICB0aGlzLnByb3BzLnN0YXR1c01hcCA9IHByb3BzLnN0YXR1c01hcFxuICAgIHJldHVybiBldGNoLnVwZGF0ZSh0aGlzKVxuICB9XG5cbiAgcHVibGljIGFzeW5jIGRlc3Ryb3koKSB7XG4gICAgYXdhaXQgZXRjaC5kZXN0cm95KHRoaXMpXG4gICAgdGhpcy5wcm9wcy5zdGF0dXNNYXAuY2xlYXIoKVxuICB9XG5cbiAgcHJpdmF0ZSBjYWxjQ3VycmVudFN0YXR1cygpOiAncmVhZHknIHwgJ3dhcm5pbmcnIHwgJ2Vycm9yJyB8ICdwcm9ncmVzcycge1xuICAgIGNvbnN0IHByaW8gPSB7XG4gICAgICBwcm9ncmVzczogNSxcbiAgICAgIGVycm9yOiAyMCxcbiAgICAgIHdhcm5pbmc6IDEwLFxuICAgICAgcmVhZHk6IDAsXG4gICAgfVxuICAgIGNvbnN0IHN0QXJyID0gQXJyYXkuZnJvbSh0aGlzLnByb3BzLnN0YXR1c01hcC52YWx1ZXMoKSlcbiAgICBjb25zdCBbY29uc2Vuc3VzXSA9IHN0QXJyLnNvcnQoKGEsIGIpID0+IHByaW9bYi5zdGF0dXNdIC0gcHJpb1thLnN0YXR1c10pXG4gICAgcmV0dXJuIGNvbnNlbnN1cyA/IGNvbnNlbnN1cy5zdGF0dXMgOiAncmVhZHknXG4gIH1cbn1cbiJdfQ==