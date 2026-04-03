import { MessageCircle, Github, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-bg-primary border-t border-border pt-20 pb-10 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          
          {/* Logo & Intro */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-2 cursor-pointer group w-fit" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/logo.png" alt="NexTalk Logo" className="w-8 h-8 rounded-lg shadow-sm border border-border/50 transition-transform group-hover:scale-105" />
              <span className="text-lg font-bold text-text-primary tracking-tight">NexTalk</span>
            </div>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm">
              The next generation of secure, real-time messaging. Architected for speed, built for privacy.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <a href="#" className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Product</h4>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Download Apps</a>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Pricing</a>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Changelog</a>
          </div>

          {/* Links 2 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Features</h4>
            <button onClick={() => {
              const y = document.getElementById('features')?.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }} className="text-left text-sm text-text-muted hover:text-accent transition-colors">Real-time Chat</button>
            <button onClick={() => {
              const y = document.getElementById('features')?.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }} className="text-left text-sm text-text-muted hover:text-accent transition-colors">Media Sharing</button>
            <button onClick={() => {
              const y = document.getElementById('security')?.getBoundingClientRect().top + window.scrollY - 80;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }} className="text-left text-sm text-text-muted hover:text-accent transition-colors">Security</button>
          </div>

          {/* Links 3 */}
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">Legal</h4>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Privacy Policy</a>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Terms of Service</a>
            <a href="#" className="text-sm text-text-muted hover:text-accent transition-colors">Contact Us</a>
          </div>

        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-text-muted opacity-80 text-center md:text-left">
            © {new Date().getFullYear()} NexTalk Messenger. All rights reserved.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-medium bg-bg-secondary px-3 py-1.5 rounded-full border border-border shadow-sm">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}
