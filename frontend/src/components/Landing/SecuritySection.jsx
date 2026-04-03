import { Shield, Lock, Fingerprint, KeySquare, Network } from 'lucide-react';

const securityFeatures = [
  {
    icon: <Network className="w-6 h-6 text-emerald-400" />,
    title: "End-to-End Secure Transport",
    description: "Industry-standard AES-GCM-256 encryption ensures your data remains protected from end to end."
  },
  {
    icon: <KeySquare className="w-6 h-6 text-blue-400" />,
    title: "OAuth Login Support",
    description: "Sign in securely with your trusted providers like Google or GitHub without creating new passwords."
  },
  {
    icon: <Fingerprint className="w-6 h-6 text-purple-400" />,
    title: "Multi-Factor Authentication",
    description: "Add an optional layer of security with OTP or authenticator apps to protect your account."
  },
  {
    icon: <Lock className="w-6 h-6 text-rose-400" />,
    title: "Session & Account Protection",
    description: "Advanced session management safeguards your account against unauthorized access and hijacking."
  }
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-24 md:py-32 px-6 relative overflow-hidden bg-bg-primary">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16 md:mb-20 reveal-on-scroll">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium text-sm mb-6">
            <Shield className="w-4 h-4" />
            <span>Privacy First</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-extrabold text-text-primary tracking-tight">
            Built with security in mind
          </h2>
          <p className="text-lg text-text-muted mt-6 max-w-2xl mx-auto leading-relaxed">
            Your privacy is our priority. NexTalk is architected from the ground up with 
            comprehensive security measures to keep your data safe.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto relative z-10">
          {securityFeatures.map((feat, idx) => (
            <div 
              key={idx} 
              className="bg-bg-panel/60 backdrop-blur-xl border border-border border-opacity-50 rounded-3xl p-8 md:p-10 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:bg-bg-panel/90 group reveal-on-scroll"
              style={{ transitionDelay: `${idx * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-bg-secondary flex items-center justify-center mb-6 border border-border/50 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300">
                {feat.icon}
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-3">
                {feat.title}
              </h3>
              <p className="text-[15px] md:text-base text-text-muted leading-relaxed">
                {feat.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
