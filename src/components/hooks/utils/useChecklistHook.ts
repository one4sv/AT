import { useState } from "react"
import type { DoneCompletion } from "../../context/TheHabitContext"

export function useChecklistBlocks(initial: DoneCompletion[]) {
    const [blocks, setBlocks] = useState<DoneCompletion[]>(initial)

    const generateId = () => Date.now() + Math.random()

    const addBlock = (habitId: number, date: string) => {
        const id = generateId()

        const newBlock: DoneCompletion = {
            id,
            start_time: "",
            end_time: "",
            name: "",
            date,
            habit_id: habitId,
            isNew: true,
        }

        setBlocks(prev => [...prev, newBlock])

        return id
    }

    const updateBlock = (
        id: number,
        field: keyof DoneCompletion,
        value: string
    ) => {
        setBlocks(prev =>
            prev.map(b => (b.id === id ? { ...b, [field]: value } : b))
        )
    }

    return {
        blocks,
        setBlocks,
        addBlock,
        updateBlock,
    }
}