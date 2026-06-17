import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { msmeAPI, scoringAPI } from '../services/api'
import { 
  Search, 
  Filter, 
  Briefcase, 
  Users, 
  Sparkles, 
  TrendingUp,
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingDown
} from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [msmes, setMsmes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedRiskTier, setSelectedRiskTier] = useState('')
  
  // Scoring actions states
  const [scoringId, setScoringId] = useState(null)

  useEffect(() => {
    fetchMSMEs()
  }, [])

  const fetchMSMEs = async () => {
    try {
      setLoading(true)
      setError(null)
      // Fetch up to 100 MSMEs to allow rich client-side search/filter
      const response = await msmeAPI.getAll({ limit: 100 })
      setMsmes(response.data.msmes || [])
    } catch (err) {
      console.error('Failed to fetch MSMEs:', err)
      setError('Could not load MSME profiles. Please verify the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  // Handle manual score trigger from list
  const handleGenerateScore = async (e, msmeId) => {
    e.stopPropagation() // Prevent row click navigation
    try {
      setScoringId(msmeId)
      await scoringAPI.scoreById(msmeId)
      // Refresh list to update scores
      await fetchMSMEs()
    } catch (err) {
      console.error('Scoring error:', err)
      alert(err.response?.data?.detail || 'Failed to generate credit score. Make sure the ML model is trained.')
    } finally {
      setScoringId(null)
    }
  }

  // Filtered MSMEs list
  const filteredMsmes = msmes.filter((m) => {
    // 1. Search term match (checks name, ID, sector, state)
    const matchesSearch = 
      m.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.msme_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.sector.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.state.toLowerCase().includes(searchTerm.toLowerCase())

    // 2. Sector match
    const matchesSector = selectedSector === '' || m.sector === selectedSector

    // 3. Risk Tier match
    let matchesRisk = true
    if (selectedRiskTier !== '') {
      if (selectedRiskTier === 'NOT_SCORED') {
        matchesRisk = m.latest_score === null
      } else {
        matchesRisk = m.risk_tier === selectedRiskTier
      }
    }

    return matchesSearch && matchesSector && matchesRisk
  })

  // Compute metrics from full msmes array
  const totalProfiles = msmes.length
  const scoredMsmes = msmes.filter((m) => m.latest_score !== null)
  const scoredProfiles = scoredMsmes.length
  
  const avgScore = scoredProfiles > 0 
    ? Math.round(scoredMsmes.reduce((sum, m) => sum + m.latest_score, 0) / scoredProfiles)
    : 0

  const highRiskProfiles = msmes.filter((m) => m.risk_tier === 'High Risk').length
  const defaultRate = totalProfiles > 0
    ? Math.round((highRiskProfiles / totalProfiles) * 100)
    : 0

  // Sector list helper
  const sectors = [...new Set(msmes.map((m) => m.sector))]

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar Layout */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen">
        <Navbar title="CreditLens Dashboard" />

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          
          {/* Header section */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight">MSME Credit Portfolio</h1>
              <p className="text-sm text-text-secondary mt-1">
                Scoring New-to-Credit (NTC) & New-to-Bank (NTB) MSMEs using Account Aggregator and alternate GST data.
              </p>
            </div>
            <button 
              onClick={fetchMSMEs}
              className="px-4 py-2 border border-border bg-white text-text-primary rounded-lg text-sm font-medium transition-base shadow-sm hover:bg-surface"
            >
              Refresh Data
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Service Unavailable</p>
                <p className="text-xs mt-1 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Metric Card 1 */}
            <div className="card p-6 flex items-center justify-between transition-base">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Total MSMEs</p>
                <p className="text-3xl font-bold text-text-primary mt-1.5">{loading ? '...' : totalProfiles}</p>
                <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" /> Indian MSME Profiles
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
            </div>

            {/* Metric Card 2 */}
            <div className="card p-6 flex items-center justify-between transition-base">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Scored Profiles</p>
                <p className="text-3xl font-bold text-text-primary mt-1.5">
                  {loading ? '...' : `${scoredProfiles} / ${totalProfiles}`}
                </p>
                <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Scored via ML engine
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
            </div>

            {/* Metric Card 3 */}
            <div className="card p-6 flex items-center justify-between transition-base">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg Health Score</p>
                <p className="text-3xl font-bold text-primary mt-1.5">
                  {loading ? '...' : scoredProfiles > 0 ? `${avgScore} / 100` : '—'}
                </p>
                <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#1F9D55]" /> Benchmark avg: 72
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#B3932E]" />
              </div>
            </div>

            {/* Metric Card 4 */}
            <div className="card p-6 flex items-center justify-between transition-base">
              <div>
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">High Risk share</p>
                <p className="text-3xl font-bold text-risk-high mt-1.5">
                  {loading ? '...' : `${defaultRate}%`}
                </p>
                <p className="text-xs text-text-secondary mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-risk-high" /> Action required cases
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-risk-high/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-risk-high" />
              </div>
            </div>
          </div>

          {/* Filters & Table Card */}
          <div className="card p-6 bg-white overflow-hidden transition-base">
            <h3 className="text-base font-semibold text-text-primary mb-5">MSME Portfolio List</h3>
            
            {/* Search and Filters Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search by name, ID, sector, or state..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm outline-none transition-base focus:border-primary focus:ring-1 focus:ring-primary/20 bg-[#FAFBFB]"
                />
              </div>

              {/* Sector selector */}
              <div className="w-full md:w-56 relative">
                <select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2 border border-border rounded-lg text-sm bg-[#FAFBFB] text-text-primary outline-none transition-base focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary pointer-events-none" />
              </div>

              {/* Risk Tier selector */}
              <div className="w-full md:w-56 relative">
                <select
                  value={selectedRiskTier}
                  onChange={(e) => setSelectedRiskTier(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2 border border-border rounded-lg text-sm bg-[#FAFBFB] text-text-primary outline-none transition-base focus:border-primary focus:ring-1 focus:ring-primary/20"
                >
                  <option value="">All Risk Tiers</option>
                  <option value="Healthy">Healthy (Green)</option>
                  <option value="Moderate Risk">Moderate Risk (Amber)</option>
                  <option value="High Risk">High Risk (Red)</option>
                  <option value="NOT_SCORED">Not Scored Yet</option>
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-text-secondary pointer-events-none" />
              </div>
            </div>

            {/* Table wrapper */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-text-secondary gap-3">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-sm font-medium">Retrieving portfolio profiles...</p>
              </div>
            ) : filteredMsmes.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-lg bg-[#FAFBFB]">
                <p className="text-sm font-medium text-text-secondary">No matching MSME profiles found</p>
                <p className="text-xs text-text-secondary mt-1">Try relaxing your search terms or filter constraints.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-[#FAFBFB] text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      <th className="py-4 px-4">MSME ID</th>
                      <th className="py-4 px-4">Business Name</th>
                      <th className="py-4 px-4">Sector</th>
                      <th className="py-4 px-4">State</th>
                      <th className="py-4 px-4 text-center">Employees</th>
                      <th className="py-4 px-4 text-center">GST Scale</th>
                      <th className="py-4 px-4 text-center">Health Score</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMsmes.map((m) => {
                      const isScored = m.latest_score !== null
                      
                      // Employee scale mapping
                      let scaleLabel = "Micro"
                      let scaleColor = "bg-blue-50 text-blue-700 border-blue-200"
                      if (m.employee_count >= 50) {
                        scaleLabel = "Medium"
                        scaleColor = "bg-purple-50 text-purple-700 border-purple-200"
                      } else if (m.employee_count >= 10) {
                        scaleLabel = "Small"
                        scaleColor = "bg-indigo-50 text-indigo-700 border-indigo-200"
                      }

                      // Score color code
                      let badgeColor = "bg-gray-100 text-gray-500 border-gray-200"
                      if (isScored) {
                        if (m.risk_tier === 'Healthy') {
                          badgeColor = "bg-[#E8F8F0] text-[#1F9D55] border-[#D1EFE0]"
                        } else if (m.risk_tier === 'Moderate Risk') {
                          badgeColor = "bg-[#FEF6E8] text-[#E5A93B] border-[#FDEBCE]"
                        } else {
                          badgeColor = "bg-[#FDF2F1] text-[#D6453D] border-[#FAD6D4]"
                        }
                      }

                      return (
                        <tr
                          key={m.msme_id}
                          onClick={() => navigate(`/msme/${m.msme_id}`)}
                          className="border-b border-border hover:bg-surface transition-base cursor-pointer group text-sm"
                        >
                          <td className="py-4 px-4 font-mono text-xs text-text-secondary group-hover:text-primary">
                            {m.msme_id.slice(0, 8)}...
                          </td>
                          <td className="py-4 px-4 font-semibold text-text-primary group-hover:text-primary">
                            {m.business_name}
                          </td>
                          <td className="py-4 px-4 text-text-secondary">{m.sector}</td>
                          <td className="py-4 px-4 text-text-secondary">{m.state}</td>
                          <td className="py-4 px-4 text-center text-text-secondary">{m.employee_count}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center text-xs px-2 py-0.5 border rounded-full font-medium ${scaleColor}`}>
                              {scaleLabel}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {isScored ? (
                              <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 border rounded-full font-semibold ${badgeColor}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  m.risk_tier === 'Healthy' ? 'bg-[#1F9D55]' : 
                                  m.risk_tier === 'Moderate Risk' ? 'bg-[#E5A93B]' : 'bg-[#D6453D]'
                                }`}></span>
                                {m.latest_score} / 100
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs px-2.5 py-1 border border-gray-200 bg-gray-50 text-gray-400 rounded-full font-medium">
                                Not Scored
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            {isScored ? (
                              <button
                                onClick={() => navigate(`/msme/${m.msme_id}`)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-[#1C7293] transition-base hover:underline"
                              >
                                View Card <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleGenerateScore(e, m.msme_id)}
                                disabled={scoringId === m.msme_id}
                                className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-lg shadow-sm hover:bg-primary-600 disabled:bg-[#75A59F] transition-base inline-flex items-center gap-1.5"
                              >
                                {scoringId === m.msme_id ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Scoring...
                                  </>
                                ) : (
                                  <>Generate Score</>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
