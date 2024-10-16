/**
 * @fileoverview PageHeader.tsx
 * @author Luca Warmenhoven
 * @date Created on Thursday, October 17 - 16:40
 */
import { PageHeaderConfig } from "../contexts/ApplicationContext";

/**
 * The page header component.
 * @param props
 * @constructor
 */
export function PageHeader(props: { config: PageHeaderConfig }) {
    return (
        <div
            className={`header-grid text-black dark:text-white items-center text-lg mx-6 mt-8 mb-3 ${props.config.className! ?? ''}`}>
            <div className="flex flex-row items-center justify-start">
                {props.config.leftHeaderContent}
            </div>
            <h1 className="text-center text-xl mb-2">{props.config.pageTitle}</h1>
            <div className="flex flex-row items-center justify-end">
                {props.config.rightHeaderContent}
            </div>
        </div>
    )
}
