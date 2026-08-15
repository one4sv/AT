import { Line } from "react-chartjs-2"
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
} from "chart.js"
import type { ChartData, ChartOptions } from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement)

interface MiniLineProps {
    values: number[]
    type: "comp" | "streak" | "break"   // ← вместо color
}

export function MiniLine({ values, type }: MiniLineProps) {
    // Цвет берём из CSS-переменных / классов
    const colorMap = {
        comp: "#166534",
        streak: "#9a3412",
        break: "#991b1b",
    }

    const color = colorMap[type]

    const maxValue = Math.max(1, ...values) * 1.15   // запас сверху

    const chartData: ChartData<"line", number[], string> = {
        labels: values.map(() => ""),
        datasets: [
            {
                data: values,
                borderColor: color,
                backgroundColor: color,
                borderWidth: 1.5,
                tension: 0.1,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
            },
        ],
    }

    const options: ChartOptions<"line"> = {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
        },
        scales: {
            x: { display: false },
            y: {
                display: false,
                beginAtZero: true,
                max: maxValue,
            },
        },
        interaction: {
            mode: undefined,
        },
        elements: {
            line: { borderJoinStyle: "miter" },
        },
    }

    return (
        <div className={`miniChart miniChart--${type}`}>
            <Line data={chartData} options={options} />
        </div>
    )
}