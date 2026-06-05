export function Blog() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Blog YAHope</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Acompanhe nossas histórias, novidades e o impacto que estamos causando nas comunidades.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-slate-200">
              <img 
                src={`https://picsum.photos/seed/hope${i}/600/400`} 
                alt="Blog post cover" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6">
              <div className="text-sm text-emerald-600 font-medium mb-2">Impacto Social</div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                Transformando vidas na comunidade
              </h2>
              <p className="text-slate-600 mb-4 line-clamp-3">
                Veja como o projeto de nutrição infantil tem ajudado dezenas de famílias a superarem a desnutrição e garantirem um futuro melhor para suas crianças.
              </p>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>12 de Março, 2024</span>
                <span>Ler mais &rarr;</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
