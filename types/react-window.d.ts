declare module 'react-window' {
  import { ComponentType, ReactElement, Ref, CSSProperties } from 'react'

  export interface ListChildComponentProps {
    index: number
    style: CSSProperties
    data?: any
    isScrolling?: boolean
  }

  export interface FixedSizeListProps {
    children: ComponentType<ListChildComponentProps>
    height: number | string
    itemCount: number
    itemSize: number
    width?: number | string
    itemData?: any
    itemKey?: (index: number, data: any) => any
    onScroll?: (props: { scrollDirection: 'forward' | 'backward'; scrollOffset: number; scrollUpdateWasRequested: boolean }) => void
    outerRef?: Ref<any>
    innerRef?: Ref<any>
    className?: string
    style?: CSSProperties
    overscanCount?: number
    useIsScrolling?: boolean
    initialScrollOffset?: number
    onItemsRendered?: (props: { overscanStartIndex: number; overscanStopIndex: number; visibleStartIndex: number; visibleStopIndex: number }) => void
  }

  export const FixedSizeList: ComponentType<FixedSizeListProps>

  export interface VariableSizeListProps extends Omit<FixedSizeListProps, 'itemSize'> {
    itemSize: (index: number) => number
    estimatedItemSize?: number
  }

  export const VariableSizeList: ComponentType<VariableSizeListProps>

  export interface GridChildComponentProps {
    columnIndex: number
    rowIndex: number
    style: CSSProperties
    data?: any
    isScrolling?: boolean
  }

  export interface FixedSizeGridProps {
    children: ComponentType<GridChildComponentProps>
    height: number | string
    width: number | string
    columnCount: number
    columnWidth: number
    rowCount: number
    rowHeight: number
    itemData?: any
    onScroll?: (props: { horizontalScrollDirection: 'forward' | 'backward'; scrollLeft: number; scrollTop: number; verticalScrollDirection: 'forward' | 'backward'; scrollUpdateWasRequested: boolean }) => void
    outerRef?: Ref<any>
    innerRef?: Ref<any>
    className?: string
    style?: CSSProperties
    overscanColumnsCount?: number
    overscanRowsCount?: number
    useIsScrolling?: boolean
    initialScrollLeft?: number
    initialScrollTop?: number
  }

  export const FixedSizeGrid: ComponentType<FixedSizeGridProps>
}

