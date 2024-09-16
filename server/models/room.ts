import { Schema, model } from "mongoose";

interface IRoom {
  room_name: string;
}

const roomSchema = new Schema<IRoom>({
  room_name: { type: String, required: true, unique: true },
});

const Room = model<IRoom>("Room", roomSchema);

export default Room;
