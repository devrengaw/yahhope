import { ShoppingCart } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

export function Ecommerce() {
  const { products } = useStore();
  const activeProducts = products.filter(p => p.status === 'active');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Loja Solidária</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Adquira produtos exclusivos e ajude a financiar os projetos da YAHope.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {activeProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col group">
            <div className="aspect-square bg-slate-100 p-4 relative overflow-hidden">
              <img 
                src={product.image_url || 'https://images.unsplash.com/photo-1555487505-8603a1a69755?w=800&q=80'} 
                alt={product.name} 
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {product.stock_quantity < 10 && product.stock_quantity > 0 && (
                <div className="absolute top-6 left-6 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                  Últimas unidades
                </div>
              )}
              {product.stock_quantity === 0 && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
                  <div className="bg-slate-900 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg">
                    Esgotado
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md mb-2 inline-block">
                  {product.category || 'Geral'}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{product.name}</h2>
                <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{product.description}</p>
              </div>
              
              <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-2xl font-black text-emerald-600 tracking-tighter">
                  <span className="text-sm font-bold text-emerald-600/60 mr-1">R$</span>
                  {product.sale_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                <button 
                  disabled={product.stock_quantity === 0}
                  className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:hover:bg-slate-900 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
                >
                  <ShoppingCart size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {activeProducts.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-[2rem] border border-slate-100">
            <ShoppingCart className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-xl font-bold text-slate-900 mb-2">Loja em atualização</h3>
            <p className="text-slate-500">Estamos preparando novos produtos para você. Volte em breve!</p>
          </div>
        )}
      </div>
    </div>
  );
}
