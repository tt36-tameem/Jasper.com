'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export function BackButton() {
  const router = useRouter()

  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-1 h-6 px-2 rounded-md text-[12px] font-medium text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
    >
      <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
      Back
    </button>
  )
}
