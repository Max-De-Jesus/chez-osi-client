'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone, MapPin, Star, Clock, Car, ShoppingBag,
  Utensils, ChevronDown, Gift, Home as HomeIcon, Bike, Minus, Plus,
  LogOut, ClipboardList, AlertCircle, CheckCircle, User, MessageCircle, CalendarDays
} from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientSession = { id: string; name: string; loyalty_points: number }
type CartItem      = { id: string; name: string; qty: number; prix?: number }
type OrderRecord   = { id: string; created_at: string; items: any[]; mode: string; status: string }
type Tab           = 'accueil' | 'commander' | 'commandes' | 'reserver'

// ─── Données du menu ──────────────────────────────────────────────────────────
const MENU = [
  { id: 'chawarma',       name: 'Chawarma',          desc: 'Généreux, bien épicé et garni de produits frais.',     image: '/chawarma..avif', type: 'quantite' as const },
  { id: 'degue_couscous', name: 'Dèguè au Couscous', desc: 'Dessert traditionnel onctueux et rafraîchissant.',     image: '/degue.png',       type: 'prix'     as const },
  { id: 'degue_mil',      name: 'Dèguè au Mil',      desc: 'Dèguè revisité à base de mil, savoureux et naturel.', image: '/degue_mil.png',   type: 'prix'     as const },
]
const MODES = [
  { id: 'sur_place', label: 'Sur place', icon: HomeIcon },
  { id: 'drive',     label: 'Drive',     icon: Car },
  { id: 'livraison', label: 'Livraison', icon: Bike },
]

// ─── Composants de base ───────────────────────────────────────────────────────
const Section = ({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) => (
  <section id={id} className={`py-20 px-4 md:px-8 max-w-7xl mx-auto ${className}`}>{children}</section>
)
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">{children}</motion.h2>
)

// ─── StatusBanner ─────────────────────────────────────────────────────────────
function StatusBanner() {
  const [isOpen, setIsOpen] = useState(false)
  useEffect(() => {
    const check = () => { const h = new Date().getHours(); setIsOpen(h >= 11 || h < 1) }
    check()
    const id = setInterval(check, 60000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50">
      <div className="bg-charcoal-800/90 backdrop-blur-md border border-white/10 rounded-full py-2.5 px-4 shadow-xl flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />}
          <span className={`relative inline-flex rounded-full h-3 w-3 ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        </span>
        {isOpen
          ? <span className="text-white text-sm font-medium">Ouvert <span className="hidden sm:inline">(jusqu'à 01 h)</span></span>
          : <span className="text-charcoal-300 text-sm font-medium">Fermé <span className="hidden sm:inline">(ouvre à 11 h)</span></span>}
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────
function Header({ client, activeTab, navigateToTab, onLogout }: {
  client: ClientSession | null
  activeTab: Tab
  navigateToTab: (t: Tab) => void
  onLogout: () => void
}) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-charcoal-900/90 backdrop-blur-md shadow-md py-4' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => navigateToTab('accueil')} className="flex items-center gap-2">
          <Image src="/logo.png" alt="OSI Food" width={40} height={40} className="rounded-lg" />
        </button>

        {/* Navigation desktop — onglets */}
        <nav className="hidden md:flex items-center gap-1 bg-charcoal-800/60 backdrop-blur-sm rounded-xl p-1 border border-white/5">
          <button onClick={() => navigateToTab('accueil')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'accueil' ? 'bg-orange-500 text-white shadow' : 'text-charcoal-200 hover:text-white'}`}>
            Accueil
          </button>
          <button onClick={() => navigateToTab('commander')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'commander' ? 'bg-orange-500 text-white shadow' : 'text-charcoal-200 hover:text-white'}`}>
            <ShoppingBag className="w-3.5 h-3.5" /> Commander
          </button>
          <button onClick={() => navigateToTab('reserver')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'reserver' ? 'bg-orange-500 text-white shadow' : 'text-charcoal-200 hover:text-white'}`}>
            <CalendarDays className="w-3.5 h-3.5" /> Réserver
          </button>
          {client && (
            <button onClick={() => navigateToTab('commandes')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'commandes' ? 'bg-orange-500 text-white shadow' : 'text-charcoal-200 hover:text-white'}`}>
              <ClipboardList className="w-3.5 h-3.5" /> Mes commandes
            </button>
          )}
        </nav>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          {client ? (
            <>
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1.5">
                <Star className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="text-orange-400 font-bold text-sm">{client.loyalty_points} pts</span>
                <span className="text-charcoal-400 text-sm">· {client.name}</span>
              </div>
              <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-charcoal-400 hover:text-white border border-white/10 px-3 py-2 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/" className="text-sm font-medium text-charcoal-200 hover:text-white border border-white/10 px-4 py-2 rounded-xl transition-colors">
                Se connecter
              </Link>
              <button onClick={() => navigateToTab('commander')} className="btn-primary text-sm py-2 px-4">
                <ShoppingBag className="w-4 h-4" /> Commander
              </button>
            </>
          )}
        </div>

        {/* Actions mobile */}
        <div className="md:hidden flex items-center">
          {client && (
            <button onClick={onLogout} className="p-2 text-charcoal-400 hover:text-white transition-colors" title="Se déconnecter">
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

// ─── Barre de navigation mobile ───────────────────────────────────────────────
function BottomNav({ activeTab, navigateToTab, client }: { activeTab: Tab; navigateToTab: (t: Tab) => void; client: ClientSession | null }) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-charcoal-900/95 backdrop-blur-lg border-t border-white/10 z-50 flex">
      <button onClick={() => navigateToTab('accueil')} className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all ${activeTab === 'accueil' ? 'text-orange-400' : 'text-charcoal-400'}`}>
        <HomeIcon className="w-5 h-5" /> Accueil
      </button>
      <button onClick={() => navigateToTab('commander')} className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-all ${activeTab === 'commander' ? 'text-orange-400' : 'text-charcoal-400'}`}>
        <ShoppingBag className="w-5 h-5" /> Commander
      </button>
      <button onClick={() => navigateToTab('reserver')} className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-all ${activeTab === 'reserver' ? 'text-orange-400' : 'text-charcoal-400'}`}>
        <CalendarDays className="w-5 h-5" /> Réserver
      </button>
      {client ? (
        <button onClick={() => navigateToTab('commandes')} className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-all ${activeTab === 'commandes' ? 'text-orange-400' : 'text-charcoal-400'}`}>
          <ClipboardList className="w-5 h-5" /> Commandes
        </button>
      ) : (
        <Link href="/auth/" className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium text-charcoal-400">
          <User className="w-5 h-5" /> Connexion
        </Link>
      )}
    </div>
  )
}

// ─── Section Hero ─────────────────────────────────────────────────────────────
function Hero({ navigateToTab }: { navigateToTab: (t: Tab) => void }) {
  return (
    <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-charcoal-900">
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/40 via-charcoal-900/80 to-charcoal-900 z-10" />
        <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-50">
          <source src="/hero.mp4" type="video/mp4" />
        </video>
      </div>
      <div className="relative z-20 text-center px-4 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="mb-6 inline-block">
          <span className="px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-medium tracking-wide">CHEZ OSI</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          Les saveurs qui <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">font revenir.</span>
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }} className="text-lg md:text-xl text-charcoal-200 mb-10 max-w-2xl mx-auto">
          Découvrez nos chawarmas généreux et notre dèguè signature. Une expérience gourmande inoubliable au cœur de Womey.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a href="tel:+22997179911" className="btn-primary w-full sm:w-auto"><Phone className="w-5 h-5" />Appeler pour commander</a>
          <button onClick={() => navigateToTab('commander')} className="btn-secondary w-full sm:w-auto"><ShoppingBag className="w-5 h-5" />Commander en ligne</button>
        </motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce text-charcoal-400">
        <ChevronDown className="w-6 h-6" />
      </motion.div>
    </section>
  )
}

// ─── Spécialités ──────────────────────────────────────────────────────────────
function Specialties() {
  const items = [
    { title: "Le Chawarma", desc: "Généreux, bien épicé et garni avec des produits frais. Notre recette signature.", image: "/chawarma..avif" },
    { title: "Dèguè au Couscous", desc: "Un dessert traditionnel revisité, onctueux et rafraîchissant.", image: "/degue.png" },
  ]
  return (
    <Section id="specialites">
      <SectionTitle>Nos Spécialités</SectionTitle>
      <div className="grid md:grid-cols-2 gap-8">
        {items.map((item, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.2 }} className="group relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-video cursor-pointer">
            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${item.image}')` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/40 to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 md:p-8">
              <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-charcoal-200">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

// ─── Pourquoi nous ────────────────────────────────────────────────────────────
function WhyUs() {
  const features = [
    { icon: Utensils, text: "Repas sur place" },
    { icon: Car, text: "Drive disponible" },
    { icon: ShoppingBag, text: "Livraison" },
    { icon: Clock, text: "Ouvert tous les jours, 11h–01h" },
  ]
  return (
    <Section className="bg-charcoal-800/50 rounded-3xl my-10">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Pourquoi choisir <br /><span className="text-orange-500">Chez OSI ?</span></h2>
          <p className="text-charcoal-300 mb-8 leading-relaxed">Un service rapide, des plats de qualité et une ambiance conviviale. Budget moyen : 1 000 à 2 000 F CFA.</p>
          <div className="grid grid-cols-2 gap-6">
            {features.map((F, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0"><F.icon className="w-5 h-5 text-orange-500" /></div>
                <span className="text-charcoal-100 font-medium pt-2">{F.text}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center">
          <div className="flex gap-1 text-orange-500 mb-4">{[...Array(5)].map((_, i) => <Star key={i} className={`w-8 h-8 ${i < 4 ? 'fill-current' : 'fill-current opacity-40'}`} />)}</div>
          <div className="text-5xl font-bold text-white mb-2">4,4<span className="text-2xl text-charcoal-400">/5</span></div>
          <p className="text-charcoal-300 mb-6">Sur la base de 80 avis vérifiés sur Google Maps</p>
          <a href="https://maps.app.goo.gl/43R5nFaJ18b1mPpo7" target="_blank" rel="noopener noreferrer" className="btn-secondary">Lire les avis sur Google</a>
        </div>
      </div>
    </Section>
  )
}

// ─── Avis ─────────────────────────────────────────────────────────────────────
function Reviews() {
  const reviews = [
    { text: "Chawarmas savoureux et généreux. Je recommande vivement !", author: "Client Google" },
    { text: "Bon rapport qualité-prix. Le dèguè est une merveille.", author: "Cliente Google" },
    { text: "Une adresse appréciée à Calavi / Godomey. Service rapide.", author: "Client Google" },
  ]
  return (
    <Section>
      <SectionTitle>Ce que disent nos clients</SectionTitle>
      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 rounded-2xl border border-white/5 relative">
            <Star className="w-6 h-6 text-orange-500/20 absolute top-6 right-6 fill-current" />
            <div className="flex gap-1 mb-4 text-orange-500">{[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-current" />)}</div>
            <p className="text-charcoal-200 mb-4 leading-relaxed italic">"{r.text}"</p>
            <p className="text-sm font-semibold text-white">— {r.author}</p>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

// ─── Fidélité (vérification publique) ────────────────────────────────────────
function LoyaltyCheck() {
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const check = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError(''); setResult(null)
    try {
      const { data, error } = await supabase.from('clients').select('total_visits, loyalty_points').eq('phone_number', phone).single()
      if (error || !data) setError('Aucun compte trouvé avec ce numéro.')
      else setResult(data)
    } catch { setError('Erreur lors de la vérification.') }
    setLoading(false)
  }
  return (
    <Section className="max-w-2xl">
      <div className="bg-gradient-to-br from-orange-500/10 to-orange-900/20 border border-orange-500/20 p-8 rounded-3xl text-center relative overflow-hidden">
        <Gift className="absolute -top-10 -right-10 w-40 h-40 text-orange-500/10 -rotate-12" />
        <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Récompensons votre fidélité</h2>
        <p className="text-charcoal-300 mb-6 relative z-10">Entrez votre numéro de téléphone pour consulter vos points.</p>
        <form onSubmit={check} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative z-10">
          <input type="tel" placeholder="Ex: 0197179911" value={phone} onChange={e => setPhone(e.target.value)}
            className="flex-1 bg-charcoal-900/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500 transition-colors" required />
          <button type="submit" disabled={loading} className="btn-primary sm:w-auto w-full">{loading ? 'Recherche...' : 'Vérifier'}</button>
        </form>
        {error && <p className="text-red-400 mt-4 relative z-10">{error}</p>}
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-6 bg-charcoal-900/40 p-4 rounded-xl border border-orange-500/30 inline-block relative z-10">
            <p className="text-white font-medium mb-1">Passages totaux : <span className="text-orange-400 font-bold">{result.total_visits}</span></p>
            <p className="text-white font-medium">Points de fidélité : <span className="text-orange-400 font-bold">{result.loyalty_points}</span></p>
          </motion.div>
        )}
      </div>
    </Section>
  )
}

// ─── Localisation ─────────────────────────────────────────────────────────────
function Location() {
  return (
    <Section>
      <div className="rounded-3xl overflow-hidden glass-panel border border-white/5">
        <div className="grid md:grid-cols-2">
          <div className="p-10 flex flex-col justify-center">
            <h2 className="text-3xl font-bold text-white mb-4">Venez nous rendre visite</h2>
            <div className="flex items-start gap-3 mb-6">
              <MapPin className="w-6 h-6 text-orange-500 shrink-0 mt-1" />
              <div><p className="text-white font-medium text-lg">C836+MW5</p><p className="text-charcoal-300">Godomey, Bénin</p></div>
            </div>
            <a href="https://maps.app.goo.gl/43R5nFaJ18b1mPpo7" target="_blank" rel="noopener noreferrer" className="btn-primary self-start"><MapPin className="w-4 h-4" /> Obtenir l'itinéraire</a>
          </div>
          <a href="https://maps.app.goo.gl/43R5nFaJ18b1mPpo7" target="_blank" rel="noopener noreferrer" className="relative h-64 md:h-auto bg-charcoal-800 block group overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-50 group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform"><MapPin className="w-8 h-8 text-white" /></div>
            </div>
          </a>
        </div>
      </div>
    </Section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const faqs = [
    { q: "Où se trouve Chez OSI ?", a: "Nous sommes situés à C836+MW5, Godomey, Bénin." },
    { q: "Quels sont les horaires ?", a: "Nous sommes ouverts tous les jours de 11 h à 01 h." },
    { q: "Faites-vous la livraison ?", a: "Oui, nous proposons un service de livraison rapide." },
    { q: "Le drive est-il disponible ?", a: "Oui, vous pouvez commander et récupérer sans quitter votre véhicule." },
    { q: "Comment commander ?", a: "Appelez-nous au 01 97 17 99 11 ou commandez via WhatsApp." },
  ]
  return (
    <Section>
      <SectionTitle>Questions Fréquentes</SectionTitle>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <details key={i} className="group bg-charcoal-800/50 rounded-xl border border-white/5 overflow-hidden">
            <summary className="p-5 font-medium text-white cursor-pointer select-none flex justify-between items-center hover:bg-charcoal-800 transition-colors">
              {faq.q}<ChevronDown className="w-5 h-5 text-charcoal-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-5 pt-0 text-charcoal-300 leading-relaxed border-t border-white/5">{faq.a}</div>
          </details>
        ))}
      </div>
    </Section>
  )
}

// ─── Onglet Commander ────────────────────────────────────────────────────────
function CommanderSection({ client, setClient, navigateToTab }: {
  client: ClientSession
  setClient: (c: ClientSession) => void
  navigateToTab: (t: Tab) => void
}) {
  const supabase = createClient()
  const [cart, setCart] = useState<CartItem[]>([])
  const [deguePrix, setDeguePrix] = useState<Record<string, string>>({})
  const [deguePrixError, setDeguePrixError] = useState<Record<string, string>>({})
  const [deliveryMode, setDeliveryMode] = useState('sur_place')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const updateQty = (id: string, name: string, delta: number) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === id)
      if (!ex && delta > 0) return [...prev, { id, name, qty: 1 }]
      return prev.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i).filter(i => i.qty > 0)
    })
  }
  const toggleDegue = (id: string, name: string) => {
    const prix = parseInt(deguePrix[id] || '0', 10)
    if (prix <= 0) { setDeguePrixError(p => ({ ...p, [id]: 'Veuillez entrer un montant valide' })); return }
    setDeguePrixError(p => ({ ...p, [id]: '' }))
    setCart(prev => {
      const ex = prev.find(i => i.id === id)
      return ex ? prev.filter(i => i.id !== id) : [...prev, { id, name, qty: 1, prix }]
    })
  }
  const handlePrixChange = (id: string, value: string) => {
    const cleaned = value.replace(/\D/g, '')
    setDeguePrix(p => ({ ...p, [id]: cleaned }))
    setCart(prev => prev.filter(i => i.id !== id))
    if (parseInt(cleaned, 10) > 0) setDeguePrixError(p => ({ ...p, [id]: '' }))
  }
  const getQty = (id: string) => cart.find(i => i.id === id)?.qty ?? 0
  const inCart = (id: string) => cart.some(i => i.id === id)
  const totalItems = cart.reduce((s, i) => s + i.qty, 0)

  const handleOrder = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    const { error } = await supabase.from('orders').insert({
      client_id: client.id,
      items: cart.map(i => ({ id: i.id, name: i.name, qty: i.qty, prix: i.prix ?? null })),
      mode: deliveryMode, total_items: totalItems, status: 'pending', notes: notes.trim() || null,
    })
    if (error) { console.error(error); setSubmitting(false); return }
    const newPoints = (client.loyalty_points ?? 0) + 1
    await supabase.from('clients').update({ loyalty_points: newPoints, last_visit_date: new Date().toISOString().split('T')[0] }).eq('id', client.id)
    const updated = { ...client, loyalty_points: newPoints }
    localStorage.setItem('chezosi_client', JSON.stringify(updated))
    setClient(updated)
    setSuccess(true)
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-10 h-10 text-green-400" /></div>
          <h2 className="text-2xl font-bold text-white mb-2">Commande envoyée !</h2>
          <p className="text-charcoal-300 mb-2">Votre commande a bien été reçue. Nous la préparons rapidement !</p>
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-full px-4 py-2 text-sm font-medium mb-8">
            <Star className="w-4 h-4 fill-orange-400" /> +1 point de fidélité crédité !
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setSuccess(false); setCart([]); setDeguePrix({}); setNotes('') }} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors">Passer une autre commande</button>
            <button onClick={() => { setSuccess(false); setCart([]); setDeguePrix({}); setNotes(''); navigateToTab('commandes') }} className="w-full bg-charcoal-800 hover:bg-charcoal-700 text-white font-semibold py-3 rounded-xl transition-colors">Voir mes commandes</button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 pb-36">
      {/* Carte client */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-charcoal-800 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
        <div><p className="text-charcoal-400 text-sm">Bonjour 👋</p><p className="text-white font-bold text-lg">{client.name}</p></div>
        <div className="inline-flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full px-3 py-1">
          <Star className="w-4 h-4 text-orange-400 fill-orange-400" /><span className="text-orange-400 font-bold">{client.loyalty_points} pts</span>
        </div>
      </motion.div>

      {/* Menu */}
      <div>
        <h2 className="text-white font-bold text-xl mb-4">Choisissez vos plats</h2>
        <div className="space-y-3">
          {MENU.map((item, idx) => {
            const qty = getQty(item.id)
            const itemInCart = inCart(item.id)
            const prixVal = deguePrix[item.id] || ''
            const prixErr = deguePrixError[item.id] || ''
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                className={`bg-charcoal-800 border rounded-2xl overflow-hidden transition-all ${itemInCart || qty > 0 ? 'border-orange-500/40' : 'border-white/5'}`}>
                <div className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-charcoal-700">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold">{item.name}</p>
                    <p className="text-charcoal-400 text-sm truncate">{item.desc}</p>
                  </div>
                  {item.type === 'quantite' ? (
                    <div className="flex items-center gap-3 shrink-0">
                      <button onClick={() => updateQty(item.id, item.name, -1)} disabled={qty === 0} className="w-8 h-8 rounded-full bg-charcoal-700 hover:bg-charcoal-600 disabled:opacity-30 flex items-center justify-center transition-colors"><Minus className="w-4 h-4 text-white" /></button>
                      <span className="text-white font-bold w-5 text-center">{qty}</span>
                      <button onClick={() => updateQty(item.id, item.name, 1)} className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center transition-colors"><Plus className="w-4 h-4 text-white" /></button>
                    </div>
                  ) : (
                    <button onClick={() => toggleDegue(item.id, item.name)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 ${itemInCart ? 'bg-orange-500 text-white' : 'bg-charcoal-700 text-charcoal-300 hover:bg-charcoal-600 hover:text-white'}`}>
                      {itemInCart ? '✓ Ajouté' : 'Ajouter'}
                    </button>
                  )}
                </div>
                {item.type === 'prix' && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3">
                    <label className="text-charcoal-400 text-xs mb-1.5 block">Montant à payer</label>
                    <div className="relative">
                      <input type="number" min="0" placeholder="Ex : 500" value={prixVal} onChange={e => handlePrixChange(item.id, e.target.value)}
                        className="w-full bg-charcoal-700 border border-white/10 rounded-xl px-4 py-2.5 pr-16 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 text-sm" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-500 text-sm pointer-events-none">FCFA</span>
                    </div>
                    {prixErr && <p className="flex items-center gap-1 text-red-400 text-xs mt-1.5"><AlertCircle className="w-3 h-3" /> {prixErr}</p>}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mode de retrait */}
      <div>
        <h2 className="text-white font-bold text-xl mb-4">Mode de retrait</h2>
        <div className="grid grid-cols-3 gap-3">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setDeliveryMode(id)} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${deliveryMode === id ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-charcoal-800 border-white/5 text-charcoal-400 hover:text-white'}`}>
              <Icon className="w-6 h-6" /><span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-white font-bold text-sm mb-2 block">Instructions spéciales (optionnel)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
          placeholder={deliveryMode === 'livraison' ? 'Indiquez votre adresse de livraison...' : 'Ex : sans oignon, sauce extra...'}
          className="w-full bg-charcoal-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 resize-none text-sm" />
      </div>

      {/* Bouton Commander flottant */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-16 md:bottom-0 left-0 right-0 p-4 bg-charcoal-900/95 backdrop-blur-lg border-t border-white/10 z-40">
            <div className="max-w-2xl mx-auto">
              <button onClick={handleOrder} disabled={submitting} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-3 text-lg">
                {submitting
                  ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <><ShoppingBag className="w-5 h-5" />Commander · {totalItems} article{totalItems > 1 ? 's' : ''} <Star className="w-4 h-4 fill-white/50" /> +1 pt</>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Onglet Mes commandes ────────────────────────────────────────────────────
function CommandesSection({ client }: { client: ClientSession }) {
  const supabase = createClient()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('orders').select('id, created_at, items, mode, status').eq('client_id', client.id).order('created_at', { ascending: false }).limit(20)
      if (data) setOrders(data as OrderRecord[])
      setLoading(false)
    }
    load()
  }, [client.id])

  const statusLabel: Record<string, { label: string; color: string }> = {
    pending:   { label: 'En attente',     color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
    preparing: { label: 'En préparation', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
    ready:     { label: 'Prête',          color: 'text-green-400 bg-green-400/10 border-green-400/20' },
    delivered: { label: 'Livrée',         color: 'text-charcoal-400 bg-charcoal-800 border-white/10' },
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-white font-bold text-2xl mb-6">Mes commandes</h2>
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-charcoal-400">
          <ClipboardList className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="text-lg">Aucune commande pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const s = statusLabel[order.status] ?? statusLabel['pending']
            return (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-charcoal-800 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-white text-sm font-semibold">{new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-charcoal-400 text-xs capitalize">{order.mode?.replace('_', ' ')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${s.color}`}>{s.label}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(order.items as any[]).map((it, j) => (
                    <span key={j} className="text-xs bg-charcoal-700 text-charcoal-200 px-2.5 py-1 rounded-full">
                      {it.qty}× {it.name}{it.prix ? ` — ${it.prix} FCFA` : ''}
                    </span>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Onglet Réservation ────────────────────────────────────────────────────────
function ReserverSection({ client, navigateToTab }: { client: ClientSession, navigateToTab: (t: Tab) => void }) {
  const supabase = createClient()
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [guests, setGuests] = useState('2')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReservations = useCallback(async () => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('client_id', client.id)
      .order('reservation_date_time', { ascending: false })
    if (data) setReservations(data)
    setLoading(false)
  }, [client.id, supabase])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !guests) return
    setSubmitting(true)
    const dateTime = new Date(`${date}T${time}`).toISOString()
    const { error } = await supabase.from('reservations').insert({
      client_id: client.id,
      reservation_date_time: dateTime,
      number_of_guests: parseInt(guests, 10),
      status: 'pending',
      notes: notes.trim() || null
    })
    setSubmitting(false)
    if (!error) {
      setDate('')
      setTime('')
      setGuests('2')
      setNotes('')
      fetchReservations()
    } else {
      console.error(error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed': return { label: 'Confirmée', color: 'bg-green-500/10 text-green-400 border-green-500/20' }
      case 'pending': return { label: 'En attente', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
      case 'cancelled': return { label: 'Annulée', color: 'bg-red-500/10 text-red-400 border-red-500/20' }
      case 'completed': return { label: 'Terminée', color: 'bg-charcoal-700 text-charcoal-300 border-charcoal-600' }
      default: return { label: 'En attente', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' }
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 pb-36">
      <h2 className="text-white font-bold text-2xl mb-2">Réserver une table</h2>
      <p className="text-charcoal-400 text-sm mb-8">Venez passer un bon moment sur place.</p>

      <form onSubmit={handleReserve} className="space-y-5 bg-charcoal-800/40 p-6 rounded-2xl border border-white/5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-white font-semibold text-sm mb-2 block">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]}
              className="w-full bg-charcoal-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50" />
          </div>
          <div>
            <label className="text-white font-semibold text-sm mb-2 block">Heure</label>
            <input type="time" required value={time} onChange={e => setTime(e.target.value)} min="11:00" max="23:59"
              className="w-full bg-charcoal-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50" />
          </div>
        </div>
        
        <div>
          <label className="text-white font-semibold text-sm mb-2 block">Nombre de personnes</label>
          <input type="number" required min="1" max="20" value={guests} onChange={e => setGuests(e.target.value)}
            className="w-full bg-charcoal-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50" />
        </div>

        <div>
          <label className="text-white font-semibold text-sm mb-2 block">Notes spéciales (optionnel)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
            placeholder="Ex : Anniversaire, chaise haute..."
            className="w-full bg-charcoal-800 border border-white/5 rounded-xl px-4 py-3 text-white placeholder:text-charcoal-500 focus:outline-none focus:border-orange-500/50 resize-none text-sm" />
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg mt-4">
          {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CalendarDays className="w-5 h-5" /> Confirmer la réservation</>}
        </button>
      </form>

      {/* Mes Réservations */}
      <div className="mt-12 space-y-6">
        <h3 className="text-white font-bold text-lg">Mes réservations</h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reservations.length === 0 ? (
          <p className="text-charcoal-500 text-sm italic bg-charcoal-800/20 p-6 rounded-2xl border border-white/5 text-center">Vous n'avez pas encore de réservations.</p>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const dt = new Date(res.reservation_date_time)
              const badge = getStatusBadge(res.status)
              return (
                <div key={res.id} className="bg-charcoal-800/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Le {dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} à {dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-charcoal-400 text-xs mt-1">
                      {res.number_of_guests} personne{res.number_of_guests > 1 ? 's' : ''}
                      {res.notes && ` · "${res.notes}"`}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function Home() {
  const [client, setClient] = useState<ClientSession | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('accueil')
  const router = useRouter()

  useEffect(() => {
    const stored = localStorage.getItem('chezosi_client')
    if (stored) {
      try {
        const parsed: ClientSession = JSON.parse(stored)
        setClient(parsed)
        // Lire le tab demandé depuis l'URL
        const params = new URLSearchParams(window.location.search)
        const tab = params.get('tab') as Tab | null
        if (tab && ['commander', 'commandes', 'reserver'].includes(tab)) setActiveTab(tab)
      } catch {}
    }
  }, [])

  const navigateToTab = (tab: Tab) => {
    // Protéger les onglets commander et commandes
    if (tab !== 'accueil' && !client) {
      router.push('/auth/')
      return
    }
    setActiveTab(tab)
    const url = new URL(window.location.href)
    if (tab === 'accueil') url.searchParams.delete('tab')
    else url.searchParams.set('tab', tab)
    window.history.pushState({}, '', url.toString())
  }

  const handleLogout = () => {
    localStorage.removeItem('chezosi_client')
    setClient(null)
    setActiveTab('accueil')
    window.history.pushState({}, '', '/')
  }

  return (
    <main className="min-h-screen pb-16 md:pb-0">
      <StatusBanner />
      <Header client={client} activeTab={activeTab} navigateToTab={navigateToTab} onLogout={handleLogout} />

      <AnimatePresence mode="wait">
        {activeTab === 'accueil' && (
          <motion.div key="accueil" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div id="accueil"><Hero navigateToTab={navigateToTab} /></div>
            <Specialties />
            <WhyUs />
            <Reviews />
            <div id="fidelite"><LoyaltyCheck /></div>
            <div id="contact"><Location /></div>
            <FAQ />
          </motion.div>
        )}

        {activeTab === 'commander' && client && (
          <motion.div key="commander" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-20">
            <CommanderSection client={client} setClient={setClient} navigateToTab={navigateToTab} />
          </motion.div>
        )}

        {activeTab === 'reserver' && client && (
          <motion.div key="reserver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-20">
            <ReserverSection client={client} navigateToTab={navigateToTab} />
          </motion.div>
        )}

        {activeTab === 'commandes' && client && (
          <motion.div key="commandes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="pt-20">
            <CommandesSection client={client} />
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav activeTab={activeTab} navigateToTab={navigateToTab} client={client} />
    </main>
  )
}
