/**
 * @fileoverview EditAutomationPage.tsx
 * @author Luca Warmenhoven
 * @date Created on Sunday, October 06 - 12:31
 */
import { AnnotatedIcon }         from "../../components/AnnotatedIcon";
import { ApplicationContext }    from "../../contexts/ApplicationContext";
import { useContext, useEffect } from "react";
import { AutomationsListPage }   from "../automations/AutomationsListPage";
import { Automation, AutomationsContext } from "../automations/Automations";
import { AutomationPageWrapper }          from "../automations/AutomationPageWrapper";

/**
 * The edit automation page.
 * This page is used to edit an automation.
 * This is also the page where new automations can be created.
 * @param props The properties for the edit automation page
 */
export function EditAutomationPage(props: { automation?: Automation }) {
    const { setContent, setHeaderConfig } = useContext(ApplicationContext);
    const { automations } = useContext(AutomationsContext);

    useEffect(() => {
        setHeaderConfig(() => {
            return {
                leftHeaderContent: (
                    <AnnotatedIcon path="M15.75 19.5 8.25 12l7.5-7.5"
                                   annotation={"Back to " + (props.automation?.name ?? 'automations')} side='right'
                                   onClick={() => setContent(props.automation ?
                                                             <AutomationPageWrapper automation={props.automation}/> :
                                                             <AutomationsListPage/>)}/>
                ),
                pageTitle: 'Edit automation' + (props.automation ? ' for \'' + props.automation.name + '\'' : ''),
            }
        })
    }, []);

    return (
        <div className="mx-auto max-w-screen-md w-full flex flex-col justify-start">
            <div className="flex flex-col justify-start items-stretch max-w-screen-sm mx-auto text-black">
                <div className="flex flex-row justify-center mb-5 items-center text-lg">
                    <span>Name of automation: </span>
                    <input type="text" className="ml-2 px-2 border-b-[1px] border-solid border-black focus:outline-none bg-transparent" placeholder="Automation name" defaultValue={`My automation #${automations.length + 1}`}/>
                </div>

                <div className="flex flex-col justify-start items-start relative w-max p-4 rounded-lg bg-gray-800">
                    <span
                        className="text-white text-sm mb-4">Detailed description of automation</span>
                    <textarea rows={4} cols={60}
                              className="bg-gray-700 text-white text-sm p-2 rounded-lg resize-none"/>
                    <div className="absolute left-1/2 top-full">
                        <div
                            className="rounded-full w-0 h-0 border-8 border-solid border-gray-800"></div>
                    </div>
                </div>
                <button
                    className="mt-5 px-4 py-2 text-white hover:cursor-pointer transition-colors duration-300 hover:bg-indigo-600 rounded-full bg-indigo-500">
                    New action
                </button>
            </div>
        </div>
    )
}
