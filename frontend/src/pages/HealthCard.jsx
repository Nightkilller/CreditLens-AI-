import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import ScoreGauge from '../components/ScoreGauge'
import SubScoreCard from '../components/SubScoreCard'
import ExplainabilityPanel from '../components/ExplainabilityPanel'
import TrendChart from '../components/TrendChart'
import { msmeAPI, scoringAPI } from '../services/api'
import { 
  ArrowLeft, 
  Sparkles, 
  Printer, 
  RefreshCw, 
  AlertCircle,
  Building,
  Calendar,
  Users,
  Compass,
  FileText,
  DollarSign,
  Briefcase
} from 'lucide-react'

export default function HealthCard() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [msme, setMsme] = useState(null)
  const [latestScore, setLatestScore] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // 1. Fetch MSME Profile
      const profileRes = await msmeAPI.getById(id)
      setMsme(profileRes.data)

      // 2. Fetch Latest Score
      try {
        const scoreRes = await scoringAPI.getScore(id)
        setLatestScore(scoreRes.data)
      } catch (err) {
        // If 404, the MSME has not been scored yet, which is fine
        if (err.response?.status !== 404) {
          console.error("Failed to load score:", err)
        }
        setLatestScore(null)
      }

      // 3. Fetch Score History
      try {
        const historyRes = await scoringAPI.getHistory(id)
        setHistory(historyRes.data.history || [])
      } catch (err) {
        console.error("Failed to load score history:", err)
        setHistory([])
      }

    } catch (err) {
      console.error("Error loading MSME data:", err)
      setError("Could not load MSME details. Check if the backend server is reachable.")
    } finally {
      setLoading(false)
    }
  }

  // Generate score
  const handleScoreMSME = async () => {
    try {
      setScoring(true)
      setError(null)
      const res = await scoringAPI.scoreById(id)
      setLatestScore(res.data)
      
      // Reload history
      const historyRes = await scoringAPI.getHistory(id)
      setHistory(historyRes.data.history || [])
    } catch (err) {
      console.error("Error generating score:", err)
      setError(err.response?.data?.detail || "An error occurred while generating the credit score.")
    } finally {
      setScoring(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="ml-60 flex-1 flex flex-col">
          <Navbar title="MSME Credit Health Card" />
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary gap-3">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm font-medium">Fetching credit record details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!msme) {
    return (
      <div className="flex min-h-screen bg-surface">
        <Sidebar />
        <div className="ml-60 flex-1 flex flex-col">
          <Navbar title="MSME Credit Health Card" />
          <div className="flex-1 flex flex-col items-center justify-center text-text-secondary p-8">
            <AlertCircle className="w-12 h-12 text-risk-high mb-3 animate-pulse" />
            <p className="text-lg font-bold text-text-primary">MSME Not Found</p>
            <p className="text-sm text-text-secondary mt-1">The requested profile ID does not exist in the database.</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-6 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-base"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-surface print:bg-white">
      {/* Sidebar Layout — Hidden on Print */}
      <div className="print:hidden">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="ml-60 flex-1 flex flex-col min-h-screen print:ml-0 print:w-full">
        {/* Navbar — Hidden on Print */}
        <div className="print:hidden">
          <Navbar title="MSME Credit Health Card" />
        </div>

        <main className="flex-1 p-8 overflow-y-auto max-w-7xl mx-auto w-full print:p-0">
          {/* Back Action Bar — Hidden on Print */}
          <div className="mb-6 flex items-center justify-between print:hidden">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-base group font-medium"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              Back to Dashboard
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={!latestScore}
                className="px-4 py-2 border border-border bg-white text-text-primary rounded-lg text-sm font-medium transition-base shadow-sm hover:bg-surface flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                <Printer className="w-4 h-4" />
                Print Health Card
              </button>
              
              <button
                onClick={handleScoreMSME}
                disabled={scoring}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold transition-base shadow-md hover:bg-primary-600 disabled:bg-[#75A59F] flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${scoring ? 'animate-spin' : ''}`} />
                {latestScore ? 'Regenerate Score' : 'Generate Score'}
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3 print:hidden">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Credit Engine Error</p>
                <p className="text-xs mt-1 text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* PRINT-ONLY HEADER */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-primary pb-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-primary">CREDITLENS AI — FINANCIAL HEALTH CARD</h1>
              <p className="text-xs text-text-secondary mt-1">IDBI Bank Digital Lending Initiative | Track 03 Submit</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">MSME Profile Ref</p>
              <p className="text-mono text-xs font-semibold text-text-secondary uppercase">{msme.msme_id}</p>
            </div>
          </div>

          {/* MSME Profile Info Summary Card */}
          <div className="card p-6 bg-white mb-8 border border-border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                  <Building className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-text-primary tracking-tight">{msme.business_name}</h2>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1.5 text-sm text-text-secondary">
                    <span className="flex items-center gap-1.5"><Compass className="w-4 h-4 text-text-secondary" /> {msme.sector}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-text-secondary" /> {msme.years_in_operation} Years Active</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                    <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-text-secondary" /> {msme.employee_count} Employees</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6 divide-x divide-border">
                <div className="text-center pl-0">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">State Code</p>
                  <p className="text-base font-bold text-text-primary mt-1">{msme.state}</p>
                </div>
                <div className="text-center pl-6">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Avg GST Turnover</p>
                  <p className="text-base font-bold text-primary mt-1">₹{(msme.monthly_gst_turnover_avg / 100000).toFixed(1)} Lakhs</p>
                </div>
                <div className="text-center pl-6">
                  <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Active EMI Obligations</p>
                  <p className="text-base font-bold text-risk-high mt-1">₹{msme.existing_emi_obligations_monthly?.toLocaleString('en-IN')}/mo</p>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN HEALTH CARD VIEW */}
          {!latestScore ? (
            <div className="card p-12 bg-white flex flex-col items-center justify-center text-center">
              <Compass className="w-16 h-16 text-text-secondary/30 mb-4" />
              <h3 className="text-lg font-bold text-text-primary">No Score Available</h3>
              <p className="text-sm text-text-secondary mt-1 max-w-md">
                This MSME has not been scored yet. Run the CreditLens AI scoring algorithm on the alternate data profile.
              </p>
              <button
                onClick={handleScoreMSME}
                disabled={scoring}
                className="mt-6 px-6 py-3 bg-primary text-white text-sm font-semibold rounded-lg shadow-md hover:bg-primary-600 transition-base flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${scoring ? 'animate-spin' : ''}`} />
                {scoring ? 'Evaluating Alternative Data...' : 'Generate Financial Health Card'}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Score Gauge and Pillar Subscores */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Hero Overall Score Gauge (Left/Top) */}
                <div className="lg:col-span-5 card p-8 bg-white flex flex-col items-center justify-center">
                  <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-6">Financial Health Score</h3>
                  
                  <ScoreGauge score={latestScore.overall_score} />
                  
                  <div className="text-center mt-6">
                    <p className="text-xs text-text-secondary uppercase font-semibold">Risk Classification</p>
                    <span 
                      className="inline-block mt-1 text-sm font-bold px-4 py-1 rounded-full border"
                      style={{ 
                        color: latestScore.risk_tier.color, 
                        borderColor: latestScore.risk_tier.color + '40',
                        backgroundColor: latestScore.risk_tier.color + '0C' 
                      }}
                    >
                      {latestScore.risk_tier.label}
                    </span>
                    <p className="text-xs text-text-secondary mt-3">
                      Based on P(Default) of {(latestScore.default_probability * 100).toFixed(2)}%
                    </p>
                  </div>
                </div>

                {/* Subscores Pillar Breakdown (Right/Bottom) */}
                <div className="lg:col-span-7 card p-8 bg-white">
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Credit Pillars Sub-scores</h3>
                    <p className="text-xs text-text-secondary mt-1">Four dimensions of alternate data profile</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SubScoreCard pillar="liquidity" scoreData={latestScore.sub_scores.liquidity} />
                    <SubScoreCard pillar="stability" scoreData={latestScore.sub_scores.stability} />
                    <SubScoreCard pillar="growth" scoreData={latestScore.sub_scores.growth} />
                    <SubScoreCard pillar="compliance" scoreData={latestScore.sub_scores.compliance} />
                  </div>
                </div>
              </div>

              {/* Explainability Panel and Score Trend History */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Score Explanations (SHAP Waterfall) */}
                <div className="lg:col-span-7 card p-8 bg-white flex flex-col">
                  <ExplainabilityPanel factors={latestScore.top_factors} />
                </div>

                {/* Trend Chart (History) */}
                <div className="lg:col-span-5 card p-8 bg-white flex flex-col justify-between">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Score Trend History</h3>
                    <p className="text-xs text-text-secondary mt-1">Historical updates for this MSME profile</p>
                  </div>
                  
                  <div className="flex-1 min-h-[220px] flex items-center justify-center">
                    <TrendChart history={history} />
                  </div>
                </div>
              </div>

              {/* Comprehensive Alternate Data Audit Section */}
              <div className="card p-8 bg-white print:break-before-page">
                <h3 className="text-sm font-semibold text-[#0B3B36] uppercase tracking-wider border-b border-border pb-3 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" /> Alternate Data Points Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* GST Audit column */}
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-1">
                      <Compass className="w-4 h-4 text-primary" /> GST Profile (EPFO & Alternate)
                    </h4>
                    <ul className="space-y-2.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-text-secondary">Filing Regularity</span>
                        <span className="font-semibold text-text-primary">{msme.gst_filing_regularity_pct}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">ITC claimed pct</span>
                        <span className="font-semibold text-text-primary">{msme.input_tax_credit_claimed_pct}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">GST YoY Growth</span>
                        <span className="font-semibold text-text-primary">{msme.gst_turnover_growth_yoy_pct}%</span>
                      </li>
                    </ul>
                  </div>

                  {/* Transaction Audit column */}
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-1">
                      <DollarSign className="w-4 h-4 text-secondary" /> UPI & Account Aggregator
                    </h4>
                    <ul className="space-y-2.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-text-secondary">Avg Monthly Balance</span>
                        <span className="font-semibold text-text-primary">₹{msme.avg_monthly_bank_balance?.toLocaleString('en-IN')}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">Inflow Volatility</span>
                        <span className="font-semibold text-text-primary">{(msme.inflow_volatility_score * 100).toFixed(1)}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">UPI Monthly Inflow</span>
                        <span className="font-semibold text-text-primary">₹{msme.monthly_upi_inflow_avg?.toLocaleString('en-IN')}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">UPI Monthly Outflow</span>
                        <span className="font-semibold text-text-primary">₹{msme.monthly_upi_outflow_avg?.toLocaleString('en-IN')}</span>
                      </li>
                    </ul>
                  </div>

                  {/* Workforce Formality column */}
                  <div>
                    <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2 border-b border-border pb-1">
                      <Briefcase className="w-4 h-4 text-[#D4AF37]" /> Workforce Formality
                    </h4>
                    <ul className="space-y-2.5 text-sm">
                      <li className="flex justify-between">
                        <span className="text-text-secondary">Employee Count</span>
                        <span className="font-semibold text-text-primary">{msme.employee_count}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">EPFO Reg Employees</span>
                        <span className="font-semibold text-text-primary">{msme.epfo_employee_count}</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">EPFO Regularity</span>
                        <span className="font-semibold text-text-primary">{msme.epfo_contribution_regularity_pct}%</span>
                      </li>
                      <li className="flex justify-between">
                        <span className="text-text-secondary">EMI Bounce Count</span>
                        <span className={`font-semibold ${msme.emi_bounce_count_12m > 0 ? 'text-risk-high' : 'text-[#1F9D55]'}`}>
                          {msme.emi_bounce_count_12m}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
