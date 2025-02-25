import { motion } from "framer-motion"
import { Trash2, CheckCircle, Circle } from "lucide-react"
import { cn } from "../lib/utils"

interface Task {
  id: string
  title: string
  completed: boolean
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-colors",
        task.completed && "bg-muted/50"
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="text-primary hover:text-primary/80"
      >
        {task.completed ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <Circle className="h-5 w-5" />
        )}
      </button>
      
      <span
        className={cn(
          "flex-1 text-foreground",
          task.completed && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </span>
      
      <button
        onClick={() => onDelete(task.id)}
        className="text-red-500 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </motion.div>
  )
}