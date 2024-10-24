/**
 * @fileoverview ScrollableContainer.tsx
 * @author Luca Warmenhoven
 * @date Created on Friday, October 18 - 21:16
 */
import { ReactNode, RefObject } from "react";

/**
 * A container that can be scrolled vertically.
 */
export function ScrollableContainer(props: {
    children: ReactNode, className?: string, blurEdges?: boolean, elementRef?: RefObject<HTMLDivElement>,
    size?: 'sm' | 'md' | 'lg' | 'xl'
}) {

    return (
        <div
            className={`flex flex-col justify-start items-center no-scrollbar grow gap-4 overflow-y-auto overflow-x-hidden w-full max-w-screen-${props.size ?? 'lg'} ${props.blurEdges ? 'h-gradient-clip' : ''}`}>
            <div className="relative grow w-full">
                <div
                    className={`flex flex-col justify-start items-stretch absolute top-0 left-0 w-full ${props.className ?? ''}`}
                    ref={props.elementRef}>
                    {props.children}
                </div>
            </div>
        </div>
    )
}
