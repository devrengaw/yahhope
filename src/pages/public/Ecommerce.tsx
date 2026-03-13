import { ShoppingCart } from 'lucide-react';

export function Ecommerce() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Loja Solidária</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Adquira produtos exclusivos e ajude a financiar os projetos da YAHope.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
            <div className="aspect-square bg-slate-100 p-4">
              <img 
                src={`https://picsum.photos/seed/product${i}/400/400`} 
                alt="Produto" 
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Camiseta YAHope</h2>
              <p className="text-slate-500 text-sm mb-4">100% Algodão, edição limitada</p>
              
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xl font-bold text-emerald-600">R$ 59,90</span>
                <button className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors">
                  <ShoppingCart size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
