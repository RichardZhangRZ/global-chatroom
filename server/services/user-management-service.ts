import { IUser, User } from "../models/user";
export async function addUser(username: string): Promise<IUser> {
  const user = await User.create({ username });
  return user;
}

export async function getOrCreateUser(username: string): Promise<IUser | null> {
  const user = await User.findOneAndUpdate(
    { username },
    { username },
    { upsert: true }
  );
  return user;
}
