import { Sparkles } from "lucide-react"
import "./AiDecoration.css"

export default function ResizableTitleComponent() {
  return (
      <div className="flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full backdrop-blur-sm border border-white/10 animate-floating">
        <Sparkles className="w-4 h-4 text-purple-300" />
        <h1 className="text-sm sm:text-sm md:text-base font-semibold bg-gradient-to-r from-blue-400 to-blue-100 text-transparent bg-clip-text whitespace-nowrap">
          <span className="block sm:hidden">Quick File Transform!</span>
          <span className="hidden sm:block">Effortlessly Transform Files in Seconds!</span>
        </h1>
      </div>
  )
}
