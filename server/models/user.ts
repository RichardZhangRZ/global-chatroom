import { Schema, model } from "mongoose";

interface IUser {
  username: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, unique: true, required: true },
});

const User = model<IUser>("User", userSchema);

export { User, IUser };
