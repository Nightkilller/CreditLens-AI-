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
  TrendingDown,
  X,
  Plus
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
  
  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [activeFormTab, setActiveFormTab] = useState('general')
  const [formData, setFormData] = useState({
    business_name: '',
    sector: 'Manufacturing',
    years_in_operation: 3.0,
    employee_count: 10,
    state: 'Maharashtra',
    gst_filing_regularity_pct: 80.0,
    monthly_gst_turnover_avg: 50000.0,
    gst_turnover_growth_yoy_pct: 10.0,
    input_tax_credit_claimed_pct: 60.0,
    monthly_upi_inflow_avg: 40000.0,
    monthly_upi_outflow_avg: 30000.0,
    upi_transaction_count_monthly: 100,
    unique_customer_count_monthly: 30,
    inflow_volatility_score: 0.25,
    avg_monthly_bank_balance: 50000.0,
    emi_bounce_count_12m: 0,
    existing_emi_obligations_monthly: 10000.0,
    cash_flow_to_emi_ratio: 5.0,
    epfo_employee_count: 5,
    epfo_contribution_regularity_pct: 80.0,
    employee_count_trend_12m: 5.0,
  })

  // Autofill presets
  const applyPreset = (type) => {
    if (type === 'healthy') {
      setFormData({
        business_name: 'Apex Infotech Solutions',
        sector: 'Services',
        years_in_operation: 8.5,
        employee_count: 24,
        state: 'Maharashtra',
        gst_filing_regularity_pct: 98.0,
        monthly_gst_turnover_avg: 1500000.0,
        gst_turnover_growth_yoy_pct: 18.5,
        input_tax_credit_claimed_pct: 82.0,
        monthly_upi_inflow_avg: 1200000.0,
        monthly_upi_outflow_avg: 900000.0,
        upi_transaction_count_monthly: 450,
        unique_customer_count_monthly: 120,
        inflow_volatility_score: 0.12,
        avg_monthly_bank_balance: 400000.0,
        emi_bounce_count_12m: 0,
        existing_emi_obligations_monthly: 50000.0,
        cash_flow_to_emi_ratio: 8.00,
        epfo_employee_count: 18,
        epfo_contribution_regularity_pct: 95.0,
        employee_count_trend_12m: 8.5,
      })
    } else if (type === 'moderate') {
      setFormData({
        business_name: 'Gujarat Agro Mart',
        sector: 'Retail',
        years_in_operation: 3.5,
        employee_count: 12,
        state: 'Gujarat',
        gst_filing_regularity_pct: 78.0,
        monthly_gst_turnover_avg: 600000.0,
        gst_turnover_growth_yoy_pct: 4.2,
        input_tax_credit_claimed_pct: 55.0,
        monthly_upi_inflow_avg: 400000.0,
        monthly_upi_outflow_avg: 350000.0,
        upi_transaction_count_monthly: 210,
        unique_customer_count_monthly: 55,
        inflow_volatility_score: 0.35,
        avg_monthly_bank_balance: 80000.0,
        emi_bounce_count_12m: 2,
        existing_emi_obligations_monthly: 25000.0,
        cash_flow_to_emi_ratio: 3.20,
        epfo_employee_count: 5,
        epfo_contribution_regularity_pct: 72.0,
        employee_count_trend_12m: -1.2,
      })
    } else if (type === 'high_risk') {
      setFormData({
        business_name: 'UP Handloom Traders',
        sector: 'Trading',
        years_in_operation: 1.2,
        employee_count: 6,
        state: 'Uttar Pradesh',
        gst_filing_regularity_pct: 45.0,
        monthly_gst_turnover_avg: 120000.0,
        gst_turnover_growth_yoy_pct: -18.2,
        input_tax_credit_claimed_pct: 20.0,
        monthly_upi_inflow_avg: 90000.0,
        monthly_upi_outflow_avg: 85000.0,
        upi_transaction_count_monthly: 45,
        unique_customer_count_monthly: 8,
        inflow_volatility_score: 0.68,
        avg_monthly_bank_balance: 15000.0,
        emi_bounce_count_12m: 6,
        existing_emi_obligations_monthly: 20000.0,
        cash_flow_to_emi_ratio: 0.75,
        epfo_employee_count: 1,
        epfo_contribution_regularity_pct: 30.0,
        employee_count_trend_12m: -12.5,
      })
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCreateMSME = async (e) => {
    e.preventDefault()
    
    // Convert inputs according to constraints
    const payload = {
      business_name: formData.business_name.trim(),
      sector: formData.sector,
      years_in_operation: parseFloat(formData.years_in_operation),
      employee_count: parseInt(formData.employee_count),
      state: formData.state,
      gst_filing_regularity_pct: parseFloat(formData.gst_filing_regularity_pct),
      monthly_gst_turnover_avg: parseFloat(formData.monthly_gst_turnover_avg),
      gst_turnover_growth_yoy_pct: parseFloat(formData.gst_turnover_growth_yoy_pct),
      input_tax_credit_claimed_pct: parseFloat(formData.input_tax_credit_claimed_pct),
      monthly_upi_inflow_avg: parseFloat(formData.monthly_upi_inflow_avg),
      monthly_upi_outflow_avg: parseFloat(formData.monthly_upi_outflow_avg),
      upi_transaction_count_monthly: parseInt(formData.upi_transaction_count_monthly),
      unique_customer_count_monthly: parseInt(formData.unique_customer_count_monthly),
      inflow_volatility_score: parseFloat(formData.inflow_volatility_score),
      avg_monthly_bank_balance: parseFloat(formData.avg_monthly_bank_balance),
      emi_bounce_count_12m: parseInt(formData.emi_bounce_count_12m),
      existing_emi_obligations_monthly: parseFloat(formData.existing_emi_obligations_monthly),
      cash_flow_to_emi_ratio: parseFloat(formData.cash_flow_to_emi_ratio),
      epfo_employee_count: parseInt(formData.epfo_employee_count),
      epfo_contribution_regularity_pct: parseFloat(formData.epfo_contribution_regularity_pct),
      employee_count_trend_12m: parseFloat(formData.employee_count_trend_12m),
    }

    if (!payload.business_name) {
      alert("Please enter a valid business name.")
      return
    }

    try {
      setLoading(true)
      const res = await msmeAPI.create(payload)
      const newMsmeId = res.data.msme_id
      
      // Auto-trigger scoring right after creation
      await scoringAPI.scoreById(newMsmeId)
      
      setShowModal(false)
      // Reset form
      setFormData({
        business_name: '',
        sector: 'Manufacturing',
        years_in_operation: 3.0,
        employee_count: 10,
        state: 'Maharashtra',
        gst_filing_regularity_pct: 80.0,
        monthly_gst_turnover_avg: 50000.0,
        gst_turnover_growth_yoy_pct: 10.0,
        input_tax_credit_claimed_pct: 60.0,
        monthly_upi_inflow_avg: 40000.0,
        monthly_upi_outflow_avg: 30000.0,
        upi_transaction_count_monthly: 100,
        unique_customer_count_monthly: 30,
        inflow_volatility_score: 0.25,
        avg_monthly_bank_balance: 50000.0,
        emi_bounce_count_12m: 0,
        existing_emi_obligations_monthly: 10000.0,
        cash_flow_to_emi_ratio: 5.0,
        epfo_employee_count: 5,
        epfo_contribution_regularity_pct: 80.0,
        employee_count_trend_12m: 5.0,
      })
      
      await fetchMSMEs()
      navigate(`/msme/${newMsmeId}`)
    } catch (err) {
      console.error('Failed to create MSME:', err)
      alert(err.response?.data?.detail || 'Failed to create MSME profile. Please check that all inputs satisfy the backend constraints.')
    } finally {
      setLoading(false)
    }
  }

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
            <div className="flex gap-3">
              <button 
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-primary hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-base shadow-sm inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add MSME Profile
              </button>
              <button 
                onClick={fetchMSMEs}
                className="px-4 py-2 border border-border bg-white text-text-primary rounded-lg text-sm font-medium transition-base shadow-sm hover:bg-surface"
              >
                Refresh Data
              </button>
            </div>
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

      {/* Modal Component */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-border shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface">
              <div>
                <h2 className="text-lg font-bold text-text-primary">Add New MSME Customer</h2>
                <p className="text-xs text-text-secondary mt-0.5">Input alternative transaction, tax, and payroll data for credit scoring decisioning.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:bg-border transition-base"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Autofill Presets Panel */}
            <div className="px-6 py-3 bg-primary/5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Quick Autofill Test Profiles:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('healthy')}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#E8F8F0] hover:bg-[#D1EFE0] text-[#1F9D55] border border-[#D1EFE0] transition-base shadow-sm"
                >
                  Healthy (Low Risk / Green)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('moderate')}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#FEF6E8] hover:bg-[#FDEBCE] text-[#E5A93B] border border-[#FDEBCE] transition-base shadow-sm"
                >
                  Moderate Risk (Amber)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('high_risk')}
                  className="px-2.5 py-1 text-xs font-medium rounded-full bg-[#FDF2F1] hover:bg-[#FAD6D4] text-[#D6453D] border border-[#FAD6D4] transition-base shadow-sm"
                >
                  Critical (High Risk / Red)
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-border bg-surface px-4">
              {[
                { id: 'general', label: '1. General Info' },
                { id: 'gst', label: '2. GST Compliance' },
                { id: 'upi', label: '3. UPI Transactions' },
                { id: 'bank', label: '4. Bank & EMIs' },
                { id: 'epfo', label: '5. EPFO Payroll' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFormTab(tab.id)}
                  className={`px-4 py-3 text-xs font-semibold border-b-2 transition-base -mb-[1px] ${
                    activeFormTab === tab.id 
                      ? 'border-primary text-primary font-bold' 
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleCreateMSME} className="flex-1 overflow-y-auto p-6">
              
              {/* Tab 1: General Info */}
              {activeFormTab === 'general' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Business Name *</label>
                    <input
                      type="text"
                      name="business_name"
                      value={formData.business_name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Acme Enterprises"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Sector *</label>
                    <select
                      name="sector"
                      value={formData.sector}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    >
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Services">Services</option>
                      <option value="Trading">Trading</option>
                      <option value="Agriculture-allied">Agriculture-allied</option>
                      <option value="Textiles">Textiles</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Years in Operation * (0.5 to 25)</label>
                    <input
                      type="number"
                      name="years_in_operation"
                      value={formData.years_in_operation}
                      onChange={handleInputChange}
                      required
                      min="0.5"
                      max="25"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Total Employee Count * (1 to 200)</label>
                    <input
                      type="number"
                      name="employee_count"
                      value={formData.employee_count}
                      onChange={handleInputChange}
                      required
                      min="1"
                      max="200"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">State *</label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    >
                      {['Maharashtra', 'Gujarat', 'Uttar Pradesh', 'Tamil Nadu', 'Madhya Pradesh', 'Rajasthan', 'Karnataka', 'West Bengal', 'Telangana', 'Kerala', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Bihar', 'Delhi'].map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Tab 2: GST */}
              {activeFormTab === 'gst' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">GST Filing Regularity * (0% to 100%)</label>
                    <input
                      type="number"
                      name="gst_filing_regularity_pct"
                      value={formData.gst_filing_regularity_pct}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Avg Monthly GST Turnover * (Min ₹10,000)</label>
                    <input
                      type="number"
                      name="monthly_gst_turnover_avg"
                      value={formData.monthly_gst_turnover_avg}
                      onChange={handleInputChange}
                      required
                      min="10000"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">YoY Turnover Growth * (-40% to 80%)</label>
                    <input
                      type="number"
                      name="gst_turnover_growth_yoy_pct"
                      value={formData.gst_turnover_growth_yoy_pct}
                      onChange={handleInputChange}
                      required
                      min="-40"
                      max="80"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Input Tax Credit (ITC) Claimed * (0% to 100%)</label>
                    <input
                      type="number"
                      name="input_tax_credit_claimed_pct"
                      value={formData.input_tax_credit_claimed_pct}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                </div>
              )}

              {/* Tab 3: UPI */}
              {activeFormTab === 'upi' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Avg Monthly UPI Inflow * (Min ₹5,000)</label>
                    <input
                      type="number"
                      name="monthly_upi_inflow_avg"
                      value={formData.monthly_upi_inflow_avg}
                      onChange={handleInputChange}
                      required
                      min="5000"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Avg Monthly UPI Outflow * (Min ₹0)</label>
                    <input
                      type="number"
                      name="monthly_upi_outflow_avg"
                      value={formData.monthly_upi_outflow_avg}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Monthly UPI Transaction Count * (Min 10)</label>
                    <input
                      type="number"
                      name="upi_transaction_count_monthly"
                      value={formData.upi_transaction_count_monthly}
                      onChange={handleInputChange}
                      required
                      min="10"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Monthly Unique Customer Count * (Min 1)</label>
                    <input
                      type="number"
                      name="unique_customer_count_monthly"
                      value={formData.unique_customer_count_monthly}
                      onChange={handleInputChange}
                      required
                      min="1"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Inflow Volatility Score * (0.0 to 1.0)</label>
                    <input
                      type="number"
                      name="inflow_volatility_score"
                      value={formData.inflow_volatility_score}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="1"
                      step="0.01"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                </div>
              )}

              {/* Tab 4: Bank */}
              {activeFormTab === 'bank' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Avg Monthly Bank Balance * (Min ₹5,000)</label>
                    <input
                      type="number"
                      name="avg_monthly_bank_balance"
                      value={formData.avg_monthly_bank_balance}
                      onChange={handleInputChange}
                      required
                      min="5000"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">EMI Bounces Last 12 Months * (0 to 12)</label>
                    <input
                      type="number"
                      name="emi_bounce_count_12m"
                      value={formData.emi_bounce_count_12m}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="12"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Monthly Existing EMI Obligations * (Min ₹0)</label>
                    <input
                      type="number"
                      name="existing_emi_obligations_monthly"
                      value={formData.existing_emi_obligations_monthly}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">Cash Flow to EMI Ratio * (Min 0.0)</label>
                    <input
                      type="number"
                      name="cash_flow_to_emi_ratio"
                      value={formData.cash_flow_to_emi_ratio}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                </div>
              )}

              {/* Tab 5: EPFO */}
              {activeFormTab === 'epfo' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">EPFO Covered Employees * (Min 0)</label>
                    <input
                      type="number"
                      name="epfo_employee_count"
                      value={formData.epfo_employee_count}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">EPFO Contribution Regularity * (0% to 100%)</label>
                    <input
                      type="number"
                      name="epfo_contribution_regularity_pct"
                      value={formData.epfo_contribution_regularity_pct}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="100"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-primary mb-1">12M Employee Growth Trend * (-30% to 50%)</label>
                    <input
                      type="number"
                      name="employee_count_trend_12m"
                      value={formData.employee_count_trend_12m}
                      onChange={handleInputChange}
                      required
                      min="-30"
                      max="50"
                      step="0.1"
                      className="w-full px-3.5 py-2 border border-border rounded-lg text-sm bg-surface focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-base"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Controls inside Form */}
              <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
                <div className="flex gap-2">
                  {activeFormTab !== 'general' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['general', 'gst', 'upi', 'bank', 'epfo']
                        const idx = tabs.indexOf(activeFormTab)
                        setActiveFormTab(tabs[idx - 1])
                      }}
                      className="px-4 py-2 border border-border bg-white text-text-primary text-xs font-semibold rounded-lg hover:bg-surface transition-base"
                    >
                      Back
                    </button>
                  )}
                  {activeFormTab !== 'epfo' && (
                    <button
                      type="button"
                      onClick={() => {
                        const tabs = ['general', 'gst', 'upi', 'bank', 'epfo']
                        const idx = tabs.indexOf(activeFormTab)
                        setActiveFormTab(tabs[idx + 1])
                      }}
                      className="px-4 py-2 bg-secondary hover:bg-secondary-600 text-white text-xs font-semibold rounded-lg transition-base"
                    >
                      Next Section
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border bg-white text-text-primary text-xs font-semibold rounded-lg hover:bg-surface transition-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-primary hover:bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm transition-base flex items-center gap-1.5"
                  >
                    Save & Run Credit Scoring
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
