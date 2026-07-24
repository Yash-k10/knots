import { useState, useEffect } from 'react'
import {
  Search,
  Briefcase,
  MapPin,
  Building,
  DollarSign,
  PlusCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Send,
  X,
  FileText,
  Filter,
} from 'lucide-react'
import {
  fetchJobs,
  createJobPosting,
  fetchCompanies,
  createCompany,
  applyForJob,
  fetchMyApplications,
  requestReferral,
  JobPosting,
  Company,
  Application,
  JobType,
  WorkplaceType,
} from '../services/jobs'
import { ApiError } from '../services/api'

export default function Jobs() {
  const [activeTab, setActiveTab] = useState<'explore' | 'applications' | 'post'>('explore')
  const [jobs, setJobs] = useState<JobPosting[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedJobType, setSelectedJobType] = useState<string>('ALL')
  const [selectedWorkplace, setSelectedWorkplace] = useState<string>('ALL')

  // Modals state
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobPosting | null>(null)
  const [selectedJobForReferral, setSelectedJobForReferral] = useState<JobPosting | null>(null)

  // Job Detail state
  const [selectedJobForDetail, setSelectedJobForDetail] = useState<JobPosting | null>(null)

  // Apply Form State
  const [resumeUrl, setResumeUrl] = useState<string>('')
  const [coverLetter, setCoverLetter] = useState<string>('')
  const [submittingApply, setSubmittingApply] = useState<boolean>(false)

  // Referral Form State
  const [referralMessage, setReferralMessage] = useState<string>('')
  const [submittingReferral, setSubmittingReferral] = useState<boolean>(false)

  // Post Job Form State
  const [postTitle, setPostTitle] = useState<string>('')
  const [postCompanyId, setPostCompanyId] = useState<number | ''>('')
  const [postJobType, setPostJobType] = useState<JobType>('FULL_TIME')
  const [postWorkplaceType, setPostWorkplaceType] = useState<WorkplaceType>('ON_SITE')
  const [postLocation, setPostLocation] = useState<string>('')
  const [postSalaryRange, setPostSalaryRange] = useState<string>('')
  const [postSkills, setPostSkills] = useState<string>('')
  const [postDescription, setPostDescription] = useState<string>('')

  // New Company Form State inside Post Job
  const [showCompanyModal, setShowCompanyModal] = useState<boolean>(false)
  const [newCompanyName, setNewCompanyName] = useState<string>('')
  const [newCompanyIndustry, setNewCompanyIndustry] = useState<string>('')
  const [newCompanyLocation, setNewCompanyLocation] = useState<string>('')
  const [newCompanyWebsite, setNewCompanyWebsite] = useState<string>('')
  const [submittingCompany, setSubmittingCompany] = useState<boolean>(false)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [fetchedJobs, fetchedCompanies, fetchedApps] = await Promise.all([
        fetchJobs({
          search: searchQuery || undefined,
          job_type: selectedJobType !== 'ALL' ? (selectedJobType as JobType) : undefined,
          workplace_type:
            selectedWorkplace !== 'ALL' ? (selectedWorkplace as WorkplaceType) : undefined,
        }),
        fetchCompanies(),
        fetchMyApplications().catch(() => []),
      ])

      setJobs(fetchedJobs)
      setCompanies(fetchedCompanies)
      setApplications(fetchedApps)
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Failed to load opportunities. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedJobType, selectedWorkplace])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadData()
  }

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJobForApply) return
    setSubmittingApply(true)
    setError(null)
    try {
      await applyForJob(selectedJobForApply.id, {
        resume_url: resumeUrl,
        cover_letter: coverLetter,
      })
      setSuccessMsg(`Successfully applied for ${selectedJobForApply.title}!`)
      setSelectedJobForApply(null)
      setResumeUrl('')
      setCoverLetter('')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to submit application.')
    } finally {
      setSubmittingApply(false)
    }
  }

  const handleReferralSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedJobForReferral) return
    setSubmittingReferral(true)
    setError(null)
    try {
      await requestReferral({
        job_posting_id: selectedJobForReferral.id,
        message: referralMessage,
      })
      setSuccessMsg(`Referral request sent for ${selectedJobForReferral.title}!`)
      setSelectedJobForReferral(null)
      setReferralMessage('')
    } catch (err: any) {
      setError(err.message || 'Failed to request referral.')
    } finally {
      setSubmittingReferral(false)
    }
  }

  const handlePostJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postCompanyId) {
      setError('Please select or create a company.')
      return
    }
    setError(null)
    try {
      const skillsArray = postSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await createJobPosting({
        title: postTitle,
        company_id: Number(postCompanyId),
        job_type: postJobType,
        workplace_type: postWorkplaceType,
        location: postLocation || undefined,
        salary_range: postSalaryRange || undefined,
        required_skills: skillsArray,
        description: postDescription,
      })

      setSuccessMsg('Job opportunity posted successfully!')
      setPostTitle('')
      setPostCompanyId('')
      setPostLocation('')
      setPostSalaryRange('')
      setPostSkills('')
      setPostDescription('')
      setActiveTab('explore')
      loadData()
    } catch (err: any) {
      setError(err.message || 'Failed to post job opportunity.')
    }
  }

  const handleCreateCompanySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingCompany(true)
    setError(null)
    try {
      const newCompany = await createCompany({
        name: newCompanyName,
        industry: newCompanyIndustry || undefined,
        location: newCompanyLocation || undefined,
        website: newCompanyWebsite || undefined,
      })
      setCompanies((prev) => [...prev, newCompany])
      setPostCompanyId(newCompany.id)
      setShowCompanyModal(false)
      setNewCompanyName('')
      setNewCompanyIndustry('')
      setNewCompanyLocation('')
      setNewCompanyWebsite('')
      setSuccessMsg(`Company "${newCompany.name}" added successfully!`)
    } catch (err: any) {
      setError(err.message || 'Failed to add company.')
    } finally {
      setSubmittingCompany(false)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
              Campus Career Hub
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Jobs & Internship Portal
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Discover verified campus recruitment drives, alumni internship opportunities, and request direct referrals.
            </p>
          </div>
          <button
            onClick={() => { setActiveTab('post'); setSelectedJobForDetail(null); }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 text-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Post Opportunity
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => { setActiveTab('explore'); setSelectedJobForDetail(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Explore Jobs ({jobs.length})
          </button>
          <button
            onClick={() => { setActiveTab('applications'); setSelectedJobForDetail(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'applications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            My Applications ({applications.length})
          </button>
          <button
            onClick={() => { setActiveTab('post'); setSelectedJobForDetail(null); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'post'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Post Opportunity
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="bg-rose-950/50 border border-rose-800 text-rose-300 p-4 rounded-xl flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 text-rose-400 hover:text-rose-200" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-300 p-4 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)}>
            <X className="w-4 h-4 text-emerald-400 hover:text-emerald-200" />
          </button>
        </div>
      )}

      {/* EXPLORE JOBS TAB */}
      {activeTab === 'explore' && (
        selectedJobForDetail ? (
          <div className="space-y-6 animate-fadeIn">
            {/* Back Button */}
            <button
              onClick={() => setSelectedJobForDetail(null)}
              className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-all"
            >
              &larr; Back to Job Search
            </button>
            
            {/* Main Detail Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left side: Job Content */}
              <div className="lg:col-span-2 bg-slate-950 border border-slate-800/90 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-900">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-2xl flex-shrink-0 shadow-lg">
                      {selectedJobForDetail.company?.name ? selectedJobForDetail.company.name.charAt(0).toUpperCase() : 'C'}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                        {selectedJobForDetail.title}
                      </h2>
                      <p className="text-sm font-semibold text-indigo-400 flex items-center gap-2 mt-1">
                        <Building className="w-4 h-4 text-slate-400" />
                        {selectedJobForDetail.company?.name || 'Company'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:flex flex-col gap-2 items-end">
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                      {selectedJobForDetail.job_type.replace('_', ' ')}
                    </span>
                    <span className="bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                      {selectedJobForDetail.workplace_type.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Key Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-900/40 border border-slate-900 rounded-xl p-4 text-sm">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs">Salary Range</span>
                    <p className="text-emerald-400 font-bold flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {selectedJobForDetail.salary_range || 'Not Disclosed'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 text-xs">Location</span>
                    <p className="text-slate-300 font-semibold flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      {selectedJobForDetail.location || 'Remote'}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-slate-500 text-xs">Posted Date</span>
                    <p className="text-slate-300 font-semibold flex items-center gap-1">
                      <Clock className="w-4 h-4 text-slate-500" />
                      {new Date(selectedJobForDetail.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-3">
                  <h4 className="text-md font-bold text-white uppercase tracking-wider text-xs border-l-2 border-indigo-500 pl-2">
                    Job Description
                  </h4>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedJobForDetail.description}
                  </p>
                </div>

                {/* Skills Required */}
                {selectedJobForDetail.required_skills && selectedJobForDetail.required_skills.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-md font-bold text-white uppercase tracking-wider text-xs border-l-2 border-indigo-500 pl-2">
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedJobForDetail.required_skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-900 text-slate-300 border border-slate-800 px-3 py-1 rounded-xl text-xs font-semibold"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right side: Company Card & Actions */}
              <div className="space-y-6">
                {/* Quick Action Box */}
                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-6 space-y-4">
                  <h4 className="text-base font-bold text-white">Application Options</h4>
                  <div className="flex flex-col gap-2.5">
                    <button
                      onClick={() => setSelectedJobForApply(selectedJobForDetail)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Apply Now
                    </button>
                    <button
                      onClick={() => setSelectedJobForReferral(selectedJobForDetail)}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Request Referral
                    </button>
                  </div>
                </div>

                {/* Company Detail Box */}
                {selectedJobForDetail.company && (
                  <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-6 space-y-4">
                    <h4 className="text-base font-bold text-white">About the Company</h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-slate-500 text-xs block">Company Name</span>
                        <span className="text-slate-300 font-semibold">{selectedJobForDetail.company.name}</span>
                      </div>
                      {selectedJobForDetail.company.industry && (
                        <div>
                          <span className="text-slate-500 text-xs block">Industry</span>
                          <span className="text-slate-300 font-semibold">{selectedJobForDetail.company.industry}</span>
                        </div>
                      )}
                      {selectedJobForDetail.company.location && (
                        <div>
                          <span className="text-slate-500 text-xs block">Headquarters</span>
                          <span className="text-slate-300 font-semibold">{selectedJobForDetail.company.location}</span>
                        </div>
                      )}
                      {selectedJobForDetail.company.website && (
                        <div>
                          <span className="text-slate-500 text-xs block">Website</span>
                          <a
                            href={selectedJobForDetail.company.website}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-400 hover:underline inline-flex items-center gap-1 font-semibold text-xs mt-0.5"
                          >
                            Visit website &rarr;
                          </a>
                        </div>
                      )}
                      {selectedJobForDetail.company.description && (
                        <div className="pt-2 border-t border-slate-900">
                          <span className="text-slate-500 text-xs block mb-1">Company Bio</span>
                          <p className="text-slate-400 text-xs leading-relaxed">{selectedJobForDetail.company.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by title, skills, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                >
                  Search
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-900 text-xs">
                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Job Type:</span>
                  <select
                    value={selectedJobType}
                    onChange={(e) => setSelectedJobType(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Types</option>
                    <option value="FULL_TIME">Full Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-slate-400 font-medium">
                  <span>Workplace:</span>
                  <select
                    value={selectedWorkplace}
                    onChange={(e) => setSelectedWorkplace(e.target.value)}
                    className="bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Workplaces</option>
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-Site</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Job Feed List */}
            {loading ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm">Fetching available job opportunities...</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
                <Briefcase className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-semibold text-white">No opportunities found</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  No active jobs match your search or filter criteria. Try expanding your filters or check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-slate-950 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-6 transition-all shadow-md group hover:shadow-indigo-500/5 flex flex-col md:flex-row justify-between md:items-center gap-6"
                  >
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-lg flex-shrink-0">
                          {job.company?.name ? job.company.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h3
                            onClick={() => setSelectedJobForDetail(job)}
                            className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors cursor-pointer"
                          >
                            {job.title}
                          </h3>
                          <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            {job.company?.name || 'Company'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md font-semibold">
                          {job.job_type.replace('_', ' ')}
                        </span>
                        <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md font-medium">
                          {job.workplace_type.replace('_', ' ')}
                        </span>
                        {job.location && (
                          <span className="text-slate-400 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            {job.location}
                          </span>
                        )}
                        {job.salary_range && (
                          <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                            <DollarSign className="w-3 h-3" />
                            {job.salary_range}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-400 text-sm line-clamp-2">{job.description}</p>

                      {job.required_skills && job.required_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {job.required_skills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="bg-slate-900/80 text-slate-400 text-[11px] px-2 py-0.5 rounded border border-slate-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Actions Column */}
                    <div className="flex flex-row md:flex-col gap-2.5 flex-shrink-0 items-stretch md:items-end justify-end">
                      <button
                        onClick={() => setSelectedJobForDetail(job)}
                        className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => setSelectedJobForApply(job)}
                        className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Apply Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* MY APPLICATIONS TAB */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-1">Application Tracker</h2>
            <p className="text-slate-400 text-sm">
              Keep track of all your submitted job applications and their current recruitment stage.
            </p>
          </div>

          {applications.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-semibold text-white">No applications submitted yet</h3>
              <p className="text-slate-400 text-sm">
                Browse open job opportunities and submit your first application!
              </p>
            </div>
          ) : (
            <div className="space-y-3 animate-fadeIn">
              {applications.map((app) => {
                const job = app.job_posting
                return (
                  <div
                    key={app.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 transition-all hover:border-indigo-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
                  >
                    <div className="space-y-3 flex-grow">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-lg flex-shrink-0">
                          {job?.company?.name ? job.company.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">
                            {job?.title || `Job Posting #${app.job_posting_id}`}
                          </h3>
                          <p className="text-sm font-medium text-slate-300 flex items-center gap-2 mt-0.5">
                            <Building className="w-3.5 h-3.5 text-slate-500" />
                            {job?.company?.name || 'Company'}
                          </p>
                        </div>
                      </div>

                      {job && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-md font-semibold">
                            {job.job_type.replace('_', ' ')}
                          </span>
                          <span className="bg-slate-900 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-md font-medium">
                            {job.workplace_type.replace('_', ' ')}
                          </span>
                          {job.location && (
                            <span className="text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              {job.location}
                            </span>
                          )}
                          {job.salary_range && (
                            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                              <DollarSign className="w-3 h-3" />
                              {job.salary_range}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-slate-900/50 flex flex-col gap-1 text-xs text-slate-400">
                        <span className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          Applied on: {new Date(app.applied_at).toLocaleDateString()}
                        </span>
                        {app.resume_url && (
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            Resume:{" "}
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 underline hover:text-indigo-300"
                            >
                              View Submitted Resume
                            </a>
                          </span>
                        )}
                        {app.cover_letter && (
                          <div className="mt-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800/80">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Your Pitch / Cover Letter:</span>
                            <p className="text-slate-300 text-xs leading-relaxed">{app.cover_letter}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 w-full md:w-auto">
                      <span
                        className={`px-4 py-2 rounded-xl text-xs font-bold border block text-center ${
                          app.status === 'ACCEPTED'
                            ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                            : app.status === 'REJECTED'
                            ? 'bg-rose-950/60 text-rose-400 border-rose-800'
                            : app.status === 'REVIEWING'
                            ? 'bg-amber-950/60 text-amber-400 border-amber-800'
                            : 'bg-indigo-950/60 text-indigo-400 border-indigo-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* POST OPPORTUNITY TAB */}
      {activeTab === 'post' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Post a Job or Internship</h2>
            <p className="text-slate-400 text-sm mt-1">
              Share hiring opportunities with your college community and alumni network.
            </p>
          </div>

          <form onSubmit={handlePostJobSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Software Engineer Intern, Data Analyst"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Company Selection */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Company *</label>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(true)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Add New Company
                </button>
              </div>
              <select
                required
                value={postCompanyId}
                onChange={(e) => setPostCompanyId(e.target.value ? Number(e.target.value) : '')}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">-- Select Company --</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.industry || 'Tech'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Job Type *
                </label>
                <select
                  value={postJobType}
                  onChange={(e) => setPostJobType(e.target.value as JobType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="CONTRACT">Contract</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Workplace Type *
                </label>
                <select
                  value={postWorkplaceType}
                  onChange={(e) => setPostWorkplaceType(e.target.value as WorkplaceType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ON_SITE">On-Site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore, Remote"
                  value={postLocation}
                  onChange={(e) => setPostLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Salary Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. ₹8 - ₹12 LPA or $80k - $100k"
                  value={postSalaryRange}
                  onChange={(e) => setPostSalaryRange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Required Skills (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. React, Node.js, Python, SQL"
                value={postSkills}
                onChange={(e) => setPostSkills(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Job Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Describe job responsibilities, eligibility criteria, and interview process..."
                value={postDescription}
                onChange={(e) => setPostDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 text-sm"
            >
              Publish Job Opportunity
            </button>
          </form>
        </div>
      )}

      {/* APPLY MODAL */}
      {selectedJobForApply && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedJobForApply(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Apply for Role</h3>
              <p className="text-indigo-400 text-sm font-semibold mt-0.5">
                {selectedJobForApply.title} • {selectedJobForApply.company?.name || 'Company'}
              </p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Resume Link / URL
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/your-resume.pdf"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Cover Letter / Brief Pitch
                </label>
                <textarea
                  rows={4}
                  placeholder="Highlight your relevant projects, experience, and motivation..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobForApply(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApply}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {submittingApply ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REFERRAL MODAL */}
      {selectedJobForReferral && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-5">
            <button
              onClick={() => setSelectedJobForReferral(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Request Alumni Referral</h3>
              <p className="text-indigo-400 text-sm font-semibold mt-0.5">
                {selectedJobForReferral.title} • {selectedJobForReferral.company?.name}
              </p>
            </div>

            <form onSubmit={handleReferralSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Referral Note / Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Introduce yourself to alumni mentors and explain why you're a great fit..."
                  value={referralMessage}
                  onChange={(e) => setReferralMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedJobForReferral(null)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReferral}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md"
                >
                  {submittingReferral ? 'Sending...' : 'Send Referral Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW COMPANY MODAL */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowCompanyModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-xl font-bold text-white">Add Company Profile</h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Register a new company profile to post job opportunities.
              </p>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google, Microsoft, Startup Inc"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Industry</label>
                <input
                  type="text"
                  placeholder="e.g. Software, Fintech, EdTech"
                  value={newCompanyIndustry}
                  onChange={(e) => setNewCompanyIndustry(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Headquarters Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mountain View, CA"
                  value={newCompanyLocation}
                  onChange={(e) => setNewCompanyLocation(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newCompanyWebsite}
                  onChange={(e) => setNewCompanyWebsite(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold py-2 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCompany}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition-all shadow-md"
                >
                  {submittingCompany ? 'Saving...' : 'Add Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
