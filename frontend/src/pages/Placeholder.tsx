export default function Placeholder({ titulo }: { titulo: string }) {
  return (
    <section className="card">
      <h1 className="font-display text-xl font-bold">{titulo}</h1>
      <p className="mt-2 text-ink-soft">Módulo disponible en próximos sprints.</p>
    </section>
  )
}
