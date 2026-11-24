import { api } from "../api";

const pending = new Set<string>();

export async function toggleLike(path:string, id:number, userId:string, liked:boolean, apply:(liked:boolean)=>void) {
    const key = userId + ":" + path + ":" + id;
    if (pending.has(key)) return;
    pending.add(key);
    apply(!liked);
    try {
        const {data} = await api.post(path, path === "/like" ? {id} : undefined);
        if (!data.success) throw new Error("Like was not saved");
        apply(data.liked);
    } catch (error) {
        apply(liked);
        throw error;
    } finally {
        pending.delete(key);
    }
}

export function withLike<T extends string | null>(likes:T[], userId:T, liked:boolean) {
    const others = likes.filter(id => id !== userId);
    return liked ? [...others,userId] : others;
}
