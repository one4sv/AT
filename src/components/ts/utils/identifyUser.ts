import axios from "axios";
import { api } from "../api"

export const identifyUser = async (id:string) => {
    const API_URL = import.meta.env.VITE_API_URL;
    try {
        const res = await api.get(`${API_URL}identifyuser/${id}`)
        if (res.data.success) {
            return {id:id, name:res.data.name, nick:res.data.nick, avatar_url:res.data.avatar_url}
        }
    } catch (error) {
        if (axios.isAxiosError(error))
        console.log(error)
        return null
    }
}