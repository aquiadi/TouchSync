import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, Activity, Smartphone, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0F0F13] text-white overflow-x-hidden font-sans">
      {/* Navigation */}
      <nav className="fixed w-full z-50 top-0 border-b border-white/5 bg-[#0F0F13]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Heart className="fill-primary" size={24} />
            TouchSync
          </div>
          <button 
            onClick={() => navigate('/app')}
            className="text-sm font-medium hover:text-white text-text-secondary transition-colors"
          >
            Try MVP Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Glow Effects */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium uppercase tracking-widest mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Live Now
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-6 leading-tight">
              Feel Them, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                No Matter The Distance.
              </span>
            </h1>
            <p className="text-lg lg:text-xl text-text-secondary mb-12 max-w-2xl mx-auto leading-relaxed">
              Instantly sync your hearts and share physical haptic pulses without needing a wearable. The easiest way to let your partner know they are on your mind.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => navigate('/app')}
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg flex items-center justify-center gap-2 shadow-[0_0_40px_rgba(255,59,48,0.3)] hover:scale-105 transition-transform duration-300"
              >
                Pair Devices Now <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel font-semibold text-lg hover:bg-white/5 transition-colors">
                Watch Video
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 relative px-6 bg-gradient-to-b from-transparent to-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Activity,
                title: 'Real-time Pulse Sync',
                desc: 'WebSockets ensure your partner feels your heartbeat the exact millisecond you tap.'
              },
              {
                icon: Heart,
                title: 'Share Your Mood',
                desc: 'Missing them? Taking a break? Send emotional context along with your vibration.'
              },
              {
                icon: Smartphone,
                title: 'Zero Hardware Required',
                desc: 'Start connecting today. No expensive rings or bracelets needed for the MVP.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-panel p-8 rounded-3xl hover:border-primary/30 transition-colors group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="text-primary" size={28} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-text-secondary leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16 tracking-tight">How it connects you</h2>
          
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-10">
              {[
                { step: '1', title: 'Enter the code', desc: 'Share your 6-digit pin with your partner securely.' },
                { step: '2', title: 'Tap to vibe', desc: 'Press the glowing heart to send a physical pulse.' },
                { step: '3', title: 'Feel the connection', desc: 'Their phone vibrates instantly, letting them know you care.' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-[#1C1C21] border border-white/10 flex items-center justify-center text-3xl font-bold text-white mb-6 shadow-xl">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-text-secondary text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/20 blur-[150px] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <Zap className="mx-auto text-primary mb-6" size={48} />
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">Join couples closing the distance.</h2>
          <p className="text-xl text-text-secondary mb-10">Experience the emotional impact of physical connection, anywhere in the world.</p>
          <button 
            onClick={() => navigate('/app')}
            className="px-10 py-5 rounded-full bg-white text-black font-semibold text-lg hover:scale-105 transition-transform duration-300"
          >
            Start Your Sync Session
          </button>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-text-secondary">
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> Free forever for MVP</span>
            <span className="flex items-center gap-2"><CheckCircle2 size={16} className="text-primary" /> No sign up required</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 text-center">
        <p className="text-text-secondary text-sm flex items-center justify-center gap-2">
          Made with <Heart size={14} className="text-primary fill-primary" /> by TouchSync
        </p>
      </footer>
    </div>
  );
}
