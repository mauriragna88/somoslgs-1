'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   HowItWorks — "Así funciona SomosLagos" con animación interactiva
   - Teléfono mockup (SVG/HTML) que reproduce en loop:
     1) Busca   → escribe "restaurante" + lista de resultados
     2) Conecta → chat de WhatsApp con mensajes + typing dots
     3) Pide    → confirmación de pedido a domicilio
   - La tarjeta activa se resalta según el paso
   - Pausa al hover del teléfono
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

const QUERY_TEXT = 'restaurante'

const SEARCH_RESULTS = [
  { name: 'Tacos El Compa', cat: '🌮 Taquería', rating: '4.9' },
  { name: 'Restaurante La Parroquia', cat: '🍽️ Comida típica', rating: '4.8' },
  { name: 'Pizzería Bella Napoli', cat: '🍕 Pizza', rating: '4.7' },
]

const CHAT_MESSAGES = [
  { from: 'user', text: 'Hola, ¿tienen menu? 🍽️' },
  { from: 'biz', text: '¡Hola! Claro, estos son nuestros platillos:' },
  { from: 'user', text: 'Quiero 2 tacos de birria y una agua.' },
  { from: 'biz', text: 'Perfecto, su pedido va en camino 🛵' },
]

const ORDER = {
  items: [
    { name: 'Tacos de Birria x2', price: '$60' },
    { name: 'Agua de Horchata', price: '$25' },
  ],
  total: '$85',
}

const STEPS = [
  { id: 1, title: 'Busca', body: 'Encuentra negocios locales por categoría, nombre o ubicación.', color: '#FF6B35' },
  { id: 2, title: 'Conecta', body: 'Llama, manda WhatsApp o visita el negocio directo desde su perfil.', color: '#F5B942' },
  { id: 3, title: 'Pide', body: 'Ordena productos en línea y recíbelos en tu puerta.', color: '#0D9488' },
]

/* Helper: tipo animado del query */
function useTypewriter(text: string, active: boolean, speed = 90) {
  const [len, setLen] = useState(0)
  useEffect(() => {
    if (!active) { setLen(0); return }
    setLen(0)
    const interval = setInterval(() => {
      setLen(prev => {
        if (prev >= text.length) { clearInterval(interval); return prev }
        return prev + 1
      })
    }, speed)
    return () => clearInterval(interval)
  }, [active, text, speed])
  return text.slice(0, len)
}

export default function HowItWorks() {
  const [step, setStep] = useState(1)
  const [paused, setPaused] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [chatIndex, setChatIndex] = useState(0)
  const [orderVisible, setOrderVisible] = useState(false)

  const typedQuery = useTypewriter(QUERY_TEXT, step === 1, 90)

  // Bucle de pasos (pausable)
  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setStep(prev => (prev >= 3 ? 1 : prev + 1))
      setSearchDone(false)
      setChatIndex(0)
      setOrderVisible(false)
    }, 3600)
    return () => clearInterval(interval)
  }, [paused])

  // Dentro del paso 1: mostrar resultados tras escribir
  useEffect(() => {
    if (step === 1 && typedQuery.length >= QUERY_TEXT.length) {
      const t = setTimeout(() => setSearchDone(true), 500)
      return () => clearTimeout(t)
    }
  }, [step, typedQuery])

  // Dentro del paso 2: mensajes del chat aparecen secuencialmente
  useEffect(() => {
    if (step !== 2) return
    if (chatIndex < CHAT_MESSAGES.length) {
      const t = setTimeout(() => setChatIndex(prev => prev + 1), 850)
      return () => clearTimeout(t)
    }
  }, [step, chatIndex])

  // Dentro del paso 3: mostrar confirmación
  useEffect(() => {
    if (step === 3) {
      const t = setTimeout(() => setOrderVisible(true), 700)
      return () => clearTimeout(t)
    }
  }, [step])

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: '#FFFDF8' }}>
      {/* Blobs decorativos */}
      <div className="absolute -top-16 -right-20 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,107,53,0.07)' }} />
      <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,185,66,0.1)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4" style={{ background: 'rgba(245,185,66,0.15)', color: 'var(--gold)' }}>
            ¿Cómo funciona?
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
            Así funciona <span style={{ color: 'var(--coral)' }}>SomosLagos</span>
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--ink-soft)' }}>
            Conectar con negocios locales nunca fue tan fácil.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* ── Pasos ── */}
          <div className="space-y-4">
            {STEPS.map((s) => {
              const active = step === s.id
              const done = step > s.id
              return (
                <motion.div
                  key={s.id}
                  animate={{
                    scale: active ? 1.02 : 1,
                    boxShadow: active ? `0 12px 32px -8px ${s.color}44` : '0 2px 12px rgba(31,41,55,0.06)',
                  }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex items-start gap-4 p-5 rounded-2xl border cursor-default"
                  style={{
                    background: 'white',
                    borderColor: active ? `${s.color}55` : 'rgba(31,41,55,0.06)',
                  }}
                >
                  {/* Número */}
                  <motion.div
                    animate={{ scale: active ? 1.1 : 1 }}
                    className="w-11 h-11 rounded-full flex items-center justify-center font-black text-lg text-white flex-shrink-0"
                    style={{ background: s.color, boxShadow: `0 4px 14px ${s.color}55` }}
                  >
                    {done ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : s.id}
                  </motion.div>

                  <div className="min-w-0">
                    <h3 className="font-black text-xl mb-1" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                      {s.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{s.body}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── Teléfono mockup ── */}
          <div className="flex justify-center">
            <div
              className="relative rounded-[38px] p-3 bg-white"
              style={{ boxShadow: '0 24px 64px -16px rgba(31,41,55,0.25), 0 0 0 1px rgba(31,41,55,0.06)', width: 300 }}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              {/* Notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black/90 rounded-full z-20" />
              {/* Punto cámara */}
              <div className="absolute top-4.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-700 rounded-full z-20" />

              {/* Pantalla */}
              <div className="relative rounded-[28px] overflow-hidden h-[520px]" style={{ background: '#FAFAFA' }}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <PhoneSearch key="search" typed={typedQuery} results={searchDone} />
                  )}
                  {step === 2 && (
                    <PhoneChat key="chat" messages={CHAT_MESSAGES.slice(0, chatIndex)} typing={chatIndex === CHAT_MESSAGES.length - 1 && chatIndex < CHAT_MESSAGES.length} />
                  )}
                  {step === 3 && (
                    <PhoneOrder key="order" visible={orderVisible} />
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ═══ Pantalla 1: Buscar ═══ */
function PhoneSearch({ typed, results }: { typed: string; results: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="absolute inset-0 flex flex-col">
      {/* Barra superior */}
      <div className="px-5 pt-10 pb-4 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-lg font-black" style={{ color: 'var(--coral)' }}>SomosLagos</span>
          <span className="text-[9px] font-semibold uppercase text-gray-400 ml-auto">Buscar</span>
        </div>
      </div>

      {/* Campo de búsqueda */}
      <div className="px-5 pt-5">
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all" style={{ borderColor: '#FF6B35', background: 'white', boxShadow: '0 4px 16px rgba(255,107,53,0.08)' }}>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-sm font-medium text-gray-800">
            {typed}
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="inline-block w-0.5 h-4 bg-[#FF6B35] ml-0.5 align-middle"
            />
          </span>
        </div>
      </div>

      {/* Resultados */}
      <div className="px-5 pt-4 space-y-2">
        <AnimatePresence>
          {results && SEARCH_RESULTS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.12, duration: 0.35, ease: EASE }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(255,107,53,0.12)' }}>{r.cat.split(' ')[0]}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-gray-800 truncate">{r.name}</p>
                <p className="text-[11px] text-gray-400">{r.cat}</p>
              </div>
              <span className="text-[11px] font-bold text-amber-500 flex-shrink-0">★ {r.rating}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ═══ Pantalla 2: Chat de WhatsApp ═══ */
function PhoneChat({ messages, typing }: { messages: typeof CHAT_MESSAGES; typing: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="absolute inset-0 flex flex-col" style={{ background: '#ECE5DD' }}>
      {/* Header chat */}
      <div className="px-4 pt-10 pb-3 flex items-center gap-3" style={{ background: '#075E54' }}>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">T</div>
        <div className="min-w-0">
          <p className="text-white text-sm font-semibold leading-tight truncate">Tacos El Compa</p>
          <p className="text-white/70 text-[10px]">en línea</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 px-3 py-3 space-y-2 overflow-hidden">
        <AnimatePresence>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-[12px] leading-snug shadow-sm ${
                  m.from === 'user' ? 'bg-[#DCF8C6] rounded-br-sm' : 'bg-white rounded-bl-sm'
                }`}
                style={{ color: '#1a1a1a' }}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <div className="bg-white px-3 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex gap-1">
              {[0, 1, 2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-3 py-2 bg-gray-100 flex items-center gap-2">
        <div className="flex-1 h-9 bg-white rounded-full px-3 flex items-center text-gray-400 text-[11px]">Escribe un mensaje…</div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#25D366' }}>
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══ Pantalla 3: Pedido a domicilio ═══ */
function PhoneOrder({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }} className="absolute inset-0 flex flex-col" style={{ background: '#FFFDF8' }}>
      <div className="px-5 pt-10 pb-4 bg-white border-b border-gray-100">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tu pedido</p>
        <p className="text-lg font-black" style={{ color: '#0D9488' }}>¡A domicilio! 🛵</p>
      </div>

      <div className="flex-1 px-5 pt-4 space-y-3">
        <AnimatePresence>
          {visible && ORDER.items.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.18, duration: 0.35, ease: EASE }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{ background: 'rgba(13,148,136,0.12)' }}>🍽️</div>
                <div>
                  <p className="text-[13px] font-bold text-gray-800">{item.name}</p>
                  <p className="text-[11px] text-gray-400">x1</p>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gray-800">{item.price}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="p-5 border-t border-gray-100" style={{ background: 'white' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500 font-semibold">Total</span>
          <span className="text-xl font-black" style={{ color: '#0D9488' }}>{ORDER.total}</span>
        </div>
        <motion.div
          initial={false}
          animate={{ scale: visible ? 1 : 0.96, opacity: visible ? 1 : 0.6 }}
          className="w-full h-12 rounded-2xl flex items-center justify-center text-white font-bold text-sm"
          style={{ background: 'linear-gradient(135deg, #0D9488, #14B8A6)' }}
        >
          Confirmar pedido
        </motion.div>
      </div>
    </motion.div>
  )
}
