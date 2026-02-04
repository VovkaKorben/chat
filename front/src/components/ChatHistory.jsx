import React from 'react';



const ChatHistory = ({ messages }) => {
    if (messages.length === 0)
        return 'No messages in this chat';
    return (
        <table><tbody>
            {
                messages.map((r) => {

                    return (
                        <tr key={r.id} >
                            <td>{r.user}<br />{r.time}</td>
                            <td>{r.message}</td>
                            {/* <td>{JSON.stringify(r)}</td> */}
                        </tr>
                    )
                })
            }
        </tbody></table>
    )
};

export default ChatHistory;
