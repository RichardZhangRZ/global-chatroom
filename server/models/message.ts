import { Schema, model } from "mongoose";

interface IMessage {
  username: string;
  message: string;
  room: string;
  __createdtime__: Date;
}

const messageSchema = new Schema<IMessage>({
  username: { type: String },
  message: { type: String },
  room: { type: String },
  __createdtime__: { type: Date, default: Date.now },
});

const Message = model<IMessage>("Message", messageSchema);

export { Message, IMessage };
