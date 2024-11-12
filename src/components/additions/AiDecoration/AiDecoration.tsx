import { Sparkles } from "lucide-react"
import "./AiDecoration.css"

export default function ResizableTitleComponent() {
  return (
      <div className="flex items-center gap-2 px-4 py-1.5 shadow-inner  shadow-blue-400 bg-black/20 rounded-full backdrop-blur-sm border border-white/10 animate-floating">
        <Sparkles className="w-4 h-4 text-purple-300" />
        <h1 className="text-xs font-semibold bg-gradient-to-r from-blue-400 to-blue-100 text-transparent bg-clip-text whitespace-nowrap">
          Magic Convertor - Effortlessly Transform Files in Seconds!
        </h1>
      </div>
  )
}
