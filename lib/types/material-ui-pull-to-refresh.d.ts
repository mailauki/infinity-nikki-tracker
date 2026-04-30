declare module 'material-ui-pull-to-refresh' {
  import { ReactNode, CSSProperties } from 'react'

  interface PullToRefreshProps {
    children?: ReactNode
    onRefresh: () => void | Promise<void>
    dragMultiplier?: number
    indicatorSize?: number
    maxDrag?: number
    style?: CSSProperties
    topOffset?: number
  }

  export default function PullToRefresh(props: PullToRefreshProps): JSX.Element
}
