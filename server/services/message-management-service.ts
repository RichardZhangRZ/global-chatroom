import { IMessage, Message } from "../models/message";

export async function saveMessage(
  message: string,
  user: string,
  room: string,
  __createdtime__?: number
): Promise<boolean> {
  const result = await Message.create({
    username: user,
    message: message,
    room: room,
    __createdtime__: __createdtime__,
  });

  return !!result;
}

export async function getMessagesByRoom(
  room: string,
  limit: number = 100
): Promise<IMessage[]> {
  const messages = await Message.find({ room: room })
    .sort({ __createdtime__: -1 }) // sort by creation date in descending order
    .limit(limit)
    .lean();
  return messages;
}
