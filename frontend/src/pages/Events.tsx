import { useState } from 'react'
import {
  Calendar,
  Search,
  Plus,
  MapPin,
  Clock,
  Ticket
} from 'lucide-react'

// Mock Data
const MOCK_EVENTS = [
  {
    id: 1,
    title: 'Alumni Career Guidance Session',
    category: 'Seminar',
    date: '25th July 2026',
    time: '4:00 PM',
    location: 'Seminar Hall 1',
    description: 'Join our successful alumni as they share their journey and guide you through placement preparations.',
    image: 'bg-indigo-500'
  },
  {
    id: 2,
    title: 'Annual Tech Hackathon 2026',
    category: 'Hackathon',
    date: '10th August 2026',
    time: '9:00 AM',
    location: 'Main Auditorium',
    description: 'A 48-hour coding marathon to solve real-world problems. Great prizes to be won!',
    image: 'bg-emerald-500'
  },
  {
    id: 3,
    title: 'Web3 & Blockchain Workshop',
    category: 'Workshop',
    date: '5th August 2026',
    time: '2:00 PM',
    location: 'Lab 4',
    description: 'Learn the fundamentals of smart contracts, decentralized apps, and the future of web.',
    image: 'bg-sky-500'
  },
  {
    id: 4,
    title: 'Cultural Fest: Resonance',
    category: 'Cultural',
    date: '20th August 2026',
    time: '6:00 PM',
    location: 'College Grounds',
    description: 'Annual cultural festival featuring music, dance, drama, and art exhibitions.',
    image: 'bg-pink-500'
  }
]

export default function Events() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categoriesList = ['Seminar', 'Hackathon', 'Workshop', 'Cultural', 'Other']

  const getCategoryBadgeStyle = (category: string) => {
    switch (category.toUpperCase()) {
      case 'HACKATHON':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      case 'WORKSHOP':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
      case 'SEMINAR':
        return 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
      case 'CULTURAL':
        return 'bg-pink-500/10 text-pink-400 border border-pink-500/20'
      default:
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
    }
  }

  const filteredEvents = MOCK_EVENTS.filter((ev) => {
    const matchesSearch =
      ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory =
      selectedCategory === 'ALL' || ev.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
            <Calendar className="w-8 h-8 text-indigo-400" />
            Campus Events
          </h2>
          <p className="text-slate-400 text-sm max-w-xl">
            Attend upcoming talks, tech meetups, hackathons, and placement workshops to boost your skills and network.
          </p>
        </div>

        <button className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform active:scale-95 flex items-center gap-2 relative z-10 shrink-0">
          <Plus className="w-5 h-5" />
          Create Event
        </button>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-950/40 p-4 border border-slate-800/80 rounded-2xl">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search events by title, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 focus:border-indigo-500/50 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-[10px]"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent border-0 py-2 text-xs text-slate-300 focus:outline-none pr-6 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.length === 0 ? (
          <div className="col-span-full bg-slate-950/40 border border-slate-800 rounded-2xl p-16 text-center text-slate-500">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="font-semibold text-sm text-slate-400">No events found</p>
            <p className="text-xs text-slate-500 mt-1">Check back later or organize your own event!</p>
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="bg-slate-950/60 backdrop-blur-md border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getCategoryBadgeStyle(
                      ev.category
                    )}`}
                  >
                    {ev.category}
                  </span>
                  <div className={`w-8 h-8 rounded-full ${ev.image} opacity-20`} />
                </div>

                <h4 className="text-lg font-bold text-white mb-2">{ev.title}</h4>
                <p className="text-slate-400 text-xs line-clamp-2 leading-relaxed mb-4">
                  {ev.description}
                </p>

                <div className="space-y-2 mt-4 border-t border-slate-800/60 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {ev.date}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {ev.time}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {ev.location}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                <button className="flex-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2">
                  <Ticket className="w-4 h-4" />
                  RSVP Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}
