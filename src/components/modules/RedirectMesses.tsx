import Message from "../../pages/Chat/components/Message"
import { useMessages } from "../hooks/MessagesHook"
import "../../scss/modules/RedirectMesses.scss"
import { Fragment } from "react/jsx-runtime"
import { isSameDay } from "../../pages/Chat/utils/isSameDay"
import DateDivider from "../../pages/Chat/components/DateDivider"

export default function RedirectMesses() {
    const { redirect } = useMessages()

    if (redirect === undefined ) return null

    return (
        <div className="redirectMessesDiv">
            {redirect.map((m, index: number) => {
                const currDate = new Date(m.created_at);
                const prev = redirect[index - 1];
                const needDivider = !prev || !isSameDay(new Date(prev.created_at), currDate);
                const find = redirect?.find(mess => mess.id === m.answer_id)
                const name = find?.sender_name
                const answer = find ? {id:find.id, name:name!, text:find.content ? find.content : `${find.files?.length} mediafile`} : undefined
                return (
                    <Fragment key={m.id}>
                        {needDivider && <DateDivider currDate={currDate} notop/>}
                        <Message
                            message={m}
                            answer={answer}
                            showNames
                        />
                    </Fragment>
                )
            })}
        </div>
    )
}