import { motion } from "motion/react";
import { useBlackout } from "../hooks/BlackoutHook"
import "../../scss/modules/Table.scss"

export default function Table() {
    const { blackout, setBlackout } = useBlackout()
    const table = blackout.table

    if (!table) return null
    
    return (
        <div className="tableDivModule">
            <div className="tableModule">
                {table.contents.map((item) => (
                    <motion.div
                        key={item.id}
                        className={`tableModuleItem ${table.activeContent === item.id ? "active" : ""}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                            const heading = document.getElementById(item.id);
                            const container = document.querySelector(".settingTab");

                            if (!heading || !container) return;

                            container.scrollTo({
                                top: container.scrollTop + heading.getBoundingClientRect().top - container.getBoundingClientRect().top - (window.innerHeight * 0.1),
                                behavior: "smooth",
                            });

                            setBlackout({seted: false})

                            heading.classList.remove("table-highlight");
                            void heading.offsetWidth;
                            heading.classList.add("table-highlight");

                            setTimeout(() => {
                                heading.classList.remove("table-highlight");
                            }, 2000);
                        }}
                    >
                        {item.title}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}