import { cookies } from "next/headers";
import Link from "next/link";

import { AtmosphericBackground } from "@/components/ui/atmospheric-background";
import { Container } from "@/components/ui/container";
import { defaultLocale, dictionaries, isLocale, LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

const FAQ: Record<Locale, Array<{ question: string; answer: string }>> = {
  es: [
    { question: "¿Cómo calculo mi carta natal?", answer: "Entra en el formulario, añade tu fecha, hora y ciudad de nacimiento, y SARITA calculará tu carta." },
    { question: "¿Necesito saber la hora exacta de nacimiento?", answer: "Sí, cuanto más exacta sea la hora, mejor. El Ascendente y las casas cambian rápido." },
    { question: "¿Qué incluye el plan gratuito?", answer: "Incluye la carta natal completa y un acceso limitado a lecturas del mes." },
    { question: "¿Cómo cancelo mi suscripción?", answer: "Desde tu cuenta, usando el botón de gestión de facturación." },
    { question: "¿Qué es la Revolución Solar?", answer: "Es la carta del momento en que el Sol vuelve a su posición natal. Muestra temas del año." },
    { question: "¿Qué es el Lavado Intestinal?", answer: "Es una guía digital de Laghoo Shankhaprakshala, una práctica corta de limpieza intestinal." },
    { question: "¿Mis datos están seguros?", answer: "Usamos Supabase para proteger cuentas y datos, y Stripe para pagos. Puedes pedir eliminación cuando quieras." },
    { question: "¿Cómo contacto con soporte?", answer: "Escríbenos a hola@saritashakti.com." },
  ],
  en: [
    { question: "How do I calculate my natal chart?", answer: "Open the form, add your birth date, time and city, and SARITA will calculate your chart." },
    { question: "Do I need my exact birth time?", answer: "Yes, the more exact the time, the better. The Ascendant and houses move quickly." },
    { question: "What is included in the free plan?", answer: "It includes the full natal chart and limited access to monthly readings." },
    { question: "How do I cancel my subscription?", answer: "From your account, using the billing management button." },
    { question: "What is the Solar Return?", answer: "It is the chart for the moment the Sun returns to its natal position. It shows themes for the year." },
    { question: "What is the Intestinal Cleanse?", answer: "It is a digital guide to Laghoo Shankhaprakshala, a short intestinal cleansing practice." },
    { question: "Is my data safe?", answer: "We use Supabase to protect accounts and data, and Stripe for payments. You can request deletion anytime." },
    { question: "How do I contact support?", answer: "Write to hola@saritashakti.com." },
  ],
  it: [
    { question: "Come calcolo la mia carta natale?", answer: "Apri il modulo, inserisci data, ora e città di nascita, e SARITA calcolerà la tua carta." },
    { question: "Mi serve l’ora esatta di nascita?", answer: "Sì, più è precisa l’ora, meglio è. Ascendente e case cambiano rapidamente." },
    { question: "Cosa include il piano gratuito?", answer: "Include la carta natale completa e un accesso limitato alle letture mensili." },
    { question: "Come cancello il mio abbonamento?", answer: "Dal tuo account, usando il pulsante di gestione fatturazione." },
    { question: "Che cos’è la Rivoluzione Solare?", answer: "È la carta del momento in cui il Sole torna alla sua posizione natale. Mostra i temi dell’anno." },
    { question: "Che cos’è il Lavaggio Intestinale?", answer: "È una guida digitale a Laghoo Shankhaprakshala, una pratica breve di pulizia intestinale." },
    { question: "I miei dati sono al sicuro?", answer: "Usiamo Supabase per proteggere account e dati, e Stripe per i pagamenti. Puoi chiedere l’eliminazione quando vuoi." },
    { question: "Come contatto il supporto?", answer: "Scrivici a hola@saritashakti.com." },
  ],
};

export default async function HelpPage() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_STORAGE_KEY)?.value;
  const locale = cookieLocale && isLocale(cookieLocale) ? cookieLocale : defaultLocale;
  const dictionary = dictionaries[locale];

  return (
    <main className="premium-noise relative isolate min-h-screen overflow-hidden bg-cosmic-950">
      <AtmosphericBackground variant="page" />
      <section className="relative py-10 sm:py-14">
        <Container className="min-h-screen">
          <div className="mx-auto max-w-3xl">
            <Link href="/" className="text-xs font-medium uppercase tracking-[0.24em] text-[#3a3048] transition hover:text-ivory">
              {dictionary.result.back}
            </Link>
            <h1 className="mt-10 font-serif text-[48px] leading-tight text-ivory sm:text-[64px]">
              {dictionary.nav.help}
            </h1>
            <div className="mt-10 border-t border-black/10">
              {FAQ[locale].map((item) => (
                <details key={item.question} className="border-b border-black/10 py-5">
                  <summary className="cursor-pointer list-none font-serif text-xl text-ivory">{item.question}</summary>
                  <p className="mt-3 text-sm leading-7 text-[#3a3048]">{item.answer}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 text-center">
              <p className="text-sm leading-7 text-[#3a3048]">Email: hola@saritashakti.com</p>
              <a
                href="mailto:hola@saritashakti.com"
                className="mt-5 inline-flex border border-dusty-gold/35 bg-dusty-gold/12 px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.2em] text-dusty-gold transition hover:bg-dusty-gold/18"
              >
                hola@saritashakti.com
              </a>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
