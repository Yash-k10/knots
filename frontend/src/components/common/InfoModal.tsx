import { X, ShieldCheck, Globe, BookOpen, Users, HelpCircle, Mail, FileText } from 'lucide-react';

export type ModalType = 'about' | 'community' | 'resources' | 'help' | 'privacy' | 'terms' | 'contact' | null;

interface InfoModalProps {
  type: ModalType;
  onClose: () => void;
}

export default function InfoModal({ type, onClose }: InfoModalProps) {
  if (!type) return null;

  const contentMap = {
    about: {
      title: 'About Knots',
      subtitle: 'The collaborative network for modern campus ecosystems',
      icon: Globe,
      body: (
        <div className="space-y-4 text-sm text-[#334155] leading-relaxed">
          <p>
            <strong>Knots</strong> was founded on a simple principle: high-impact careers and breakthroughs are born when students, alumni, faculty, and industry leaders are seamlessly connected.
          </p>
          <p>
            Unlike traditional broad social media, Knots focuses on <em>contextual campus networking</em>—allowing verified students to find verified mentors, discover placement openings, collaborate on departmental capstones, and connect with active campus clubs.
          </p>
          <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-2">
            <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">Core Pillars</h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-[#475569]">
              <li><strong>Institutional Identity:</strong> Zero-noise verification via college credentials.</li>
              <li><strong>Mentorship Loops:</strong> Active 1-on-1 guidance from working alumni.</li>
              <li><strong>Opportunity Engine:</strong> Direct referral pathways to top recruiters.</li>
            </ul>
          </div>
        </div>
      ),
    },
    community: {
      title: 'Knots Campus Community',
      subtitle: 'Connecting over 12,000+ students, researchers, and alumni',
      icon: Users,
      body: (
        <div className="space-y-4 text-sm text-[#334155] leading-relaxed">
          <p>
            The Knots community is comprised of verified members from engineering, management, sciences, and innovation chapters.
          </p>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
              <span className="text-xl font-black text-[#0F4C5C]">12,450+</span>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">Active Students & Alumni</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] text-center">
              <span className="text-xl font-black text-[#E36414]">52+</span>
              <p className="text-xs text-[#64748B] font-medium mt-0.5">Campus Tech Clubs</p>
            </div>
          </div>
          <p className="text-xs text-[#64748B]">
            All members adhere to the Knots Community Code of Conduct, ensuring constructive feedback, respectful collaboration, and academic integrity.
          </p>
        </div>
      ),
    },
    resources: {
      title: 'Platform Resources & Guides',
      subtitle: 'Tools, career kits, and documentation',
      icon: BookOpen,
      body: (
        <div className="space-y-3 text-sm text-[#334155]">
          <div className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F4C5C] transition-colors cursor-pointer bg-[#FFFFFF]">
            <h4 className="font-bold text-[#0F172A]">Placement & Interview Preparation Kit</h4>
            <p className="text-xs text-[#64748B] mt-0.5">Curated DSA, System Design, and HR interview guides contributed by alumni.</p>
          </div>
          <div className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F4C5C] transition-colors cursor-pointer bg-[#FFFFFF]">
            <h4 className="font-bold text-[#0F172A]">Resume Objective & Verification Standard</h4>
            <p className="text-xs text-[#64748B] mt-0.5">Guidelines on building ATS-friendly 10.0 GPA standardized resumes.</p>
          </div>
          <div className="p-3 rounded-lg border border-[#E2E8F0] hover:border-[#0F4C5C] transition-colors cursor-pointer bg-[#FFFFFF]">
            <h4 className="font-bold text-[#0F172A]">Department Controller Keys Manual</h4>
            <p className="text-xs text-[#64748B] mt-0.5">Administrative guidance for placement officers and department coordinators.</p>
          </div>
        </div>
      ),
    },
    help: {
      title: 'Help & Support Center',
      subtitle: 'Need assistance accessing your Knots account?',
      icon: HelpCircle,
      body: (
        <div className="space-y-4 text-sm text-[#334155]">
          <p>
            If you are having trouble logging in or resetting your password, please review the common solutions below:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <strong className="text-[#0F172A]">College Email Verification:</strong>
              <p className="text-[#64748B] mt-0.5">Ensure you enter your official institutional email (e.g. <code>user@sbjit.edu.in</code>). Check your spam folder for 6-digit OTP codes.</p>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <strong className="text-[#0F172A]">Password Recovery:</strong>
              <p className="text-[#64748B] mt-0.5">Use the "Forgot password?" option on the sign-in card to receive a verified one-time reset code.</p>
            </div>
          </div>
          <p className="text-xs text-[#64748B]">
            Need immediate administrative support? Reach out to <span className="font-medium text-[#0F4C5C]">support@knots-platform.edu</span>.
          </p>
        </div>
      ),
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How Knots safeguards institutional data and user privacy',
      icon: ShieldCheck,
      body: (
        <div className="space-y-3 text-xs text-[#334155] leading-relaxed max-h-72 overflow-y-auto pr-1">
          <p><strong>1. Data Collection:</strong> Knots only stores profile information necessary to facilitate campus networking, verified academic credentials, and placement communications.</p>
          <p><strong>2. Academic Privacy:</strong> Your student ID, grades, and private messaging remain strictly encrypted and are never sold or shared with third-party advertisers.</p>
          <p><strong>3. Institutional Controls:</strong> College department controllers only access aggregated performance analytics and authorized recruitment applications.</p>
          <p><strong>4. Account Deletion & Rights:</strong> You can export or request full deletion of your profile and data at any time via Account Settings.</p>
        </div>
      ),
    },
    terms: {
      title: 'Terms of Service',
      subtitle: 'Acceptable use guidelines for all Knots participants',
      icon: FileText,
      body: (
        <div className="space-y-3 text-xs text-[#334155] leading-relaxed max-h-72 overflow-y-auto pr-1">
          <p><strong>1. Authorized Access:</strong> Only registered students, faculty, alumni, and verified corporate partners are permitted to access Knots services.</p>
          <p><strong>2. Respect & Civility:</strong> Harassment, academic dishonesty, unauthorized scraping, or malicious impersonation will result in immediate account suspension.</p>
          <p><strong>3. Job Postings & Hiring:</strong> All job opportunities and internship listings must represent legitimate, verified recruitment drives.</p>
        </div>
      ),
    },
    contact: {
      title: 'Contact the Knots Team',
      subtitle: 'We are here to help your campus connect',
      icon: Mail,
      body: (
        <div className="space-y-4 text-sm text-[#334155]">
          <p>Have questions, campus integration inquiries, or technical feedback? Get in touch with our team:</p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
              <div>
                <p className="font-bold text-[#0F172A]">Technical Support Desk</p>
                <p className="text-[#64748B]">support@knots-platform.edu</p>
              </div>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded text-[10px]">24/7 Available</span>
            </div>
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <p className="font-bold text-[#0F172A]">Campus Placement & Controller Inquiries</p>
              <p className="text-[#64748B]">partnerships@knots-platform.edu</p>
            </div>
          </div>
        </div>
      ),
    },
  }[type];

  const IconComponent = contentMap.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F4C5C]/10 text-[#0F4C5C] flex items-center justify-center">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                {contentMap.title}
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                {contentMap.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {contentMap.body}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-t border-[#F1F5F9] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0F4C5C] hover:bg-[#0A3642] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
