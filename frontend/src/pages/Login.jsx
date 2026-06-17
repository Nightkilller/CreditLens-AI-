import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authAPI } from '../services/api'
import { Shield, AlertCircle } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('admin@idbi.co.in')
  const [password, setPassword] = useState('CreditLens2026')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await authAPI.login(email, password)
      login(res.data.user, res.data.token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F9F8]">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-[#0B3B36] mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">CreditLens AI</h1>
          <p className="text-sm text-[#6B7280] mt-1">MSME Financial Health Card</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm p-8">
          <h2 className="text-lg font-medium text-[#1A1A1A] mb-1">Sign in</h2>
          <p className="text-sm text-[#6B7280] mb-6">
            Access the MSME credit assessment dashboard
          </p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B3B36]/20 focus:border-[#0B3B36] transition-all"
                placeholder="you@idbi.co.in"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#1A1A1A] mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#0B3B36]/20 focus:border-[#0B3B36] transition-all"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#0B3B36] text-white text-sm font-medium rounded-lg hover:bg-[#0B3B36]/90 focus:outline-none focus:ring-2 focus:ring-[#0B3B36]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-[#6B7280] text-center mt-6">
            Internal bank tool — authorized personnel only
          </p>
        </div>

        <p className="text-xs text-[#6B7280] text-center mt-6">
          IDBI Innovate 2026 — Track 03
        </p>
      </div>
    </div>
  )
}
