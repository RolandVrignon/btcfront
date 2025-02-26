import Image from "next/image"

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen items-center">
      <div className="banner h-96 w-full relative">
        <Image
          src="/assets/img/bg.jpg"
          alt="Bannière d'arrière-plan"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      <div className="relative w-full max-w-4xl -mt-24 px-4">
        <div className="flex flex-col items-center w-full p-12 bg-white rounded-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 text-center">BTP Consultants IA</h1>
          <h2 className="text-xl md:text-2xl font-medium text-center">Votre boîte à outils pour le Contrôle Technique</h2>
        </div>
      </div>

      <div className="flex flex-1 w-full max-w-7xl px-4 py-16">
        {/* Contenu principal ici */}
      </div>
    </main>
  )
}