import { useAuth } from '../context/AuthContext'
import { User } from 'lucide-react'

export default function Navbar({ title }) {
  const { user } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-8">
      <h2 className="text-lg font-semibold text-[#1A1A1A]">{title || 'Dashboard'}</h2>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-[#1A1A1A]">{user?.name || 'Bank Employee'}</p>
          <p className="text-xs text-[#6B7280]">{user?.email || ''}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-[#0B3B36] flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  )
}
