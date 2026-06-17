const fs = require('fs');
const file = 'src/components/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to add logic to Layout to group nav items if module === 'workspace'

content = content.replace(
  /<nav className="mt-6 md:mt-2 flex-1 overflow-y-auto" aria-label="Navegação Lateral">[\s\S]*?<\/nav>/,
  `
        <nav className="mt-6 md:mt-2 flex-1 overflow-y-auto" aria-label="Navegação Lateral">
          {module === 'workspace' ? (
            <div className="px-3 pb-4">
              <div className="mb-6">
                <p className={cn("px-4 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Canais</p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/workspace/chat/geral"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname === '/workspace/chat/geral' || location.pathname === '/workspace' 
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <span className="font-light text-lg opacity-70">#</span>
                      <span className={cn(location.pathname === '/workspace/chat/geral' || location.pathname === '/workspace' ? "font-bold" : "")}>geral</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workspace/chat/projetos"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname === '/workspace/chat/projetos' 
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <span className="font-light text-lg opacity-70">#</span>
                      <span className={cn(location.pathname === '/workspace/chat/projetos' ? "font-bold" : "")}>projetos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workspace/chat/anuncios"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname === '/workspace/chat/anuncios' 
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <span className="font-light text-lg opacity-70">#</span>
                      <span className={cn(location.pathname === '/workspace/chat/anuncios' ? "font-bold" : "")}>anúncios</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <p className={cn("px-4 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Mensagens Diretas</p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/workspace/dm/1"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname === '/workspace/dm/1' 
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <div className="relative">
                        <img src="https://i.pravatar.cc/150?u=1" alt="Ana" className="w-5 h-5 rounded" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                      </div>
                      <span className={cn(location.pathname === '/workspace/dm/1' ? "font-bold" : "")}>Ana Júlia</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workspace/dm/2"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname === '/workspace/dm/2' 
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <div className="relative">
                        <img src="https://i.pravatar.cc/150?u=2" alt="Carlos" className="w-5 h-5 rounded" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-transparent border-2 border-slate-400 rounded-full"></div>
                      </div>
                      <span className={cn(location.pathname === '/workspace/dm/2' ? "font-bold" : "")}>Carlos S.</span>
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className={cn("px-4 text-xs font-bold uppercase tracking-wider mb-2", theme.roleText)}>Organização</p>
                <ul className="space-y-1">
                  <li>
                    <Link
                      to="/workspace/projects"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname.startsWith('/workspace/projects')
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <Briefcase size={16} className={location.pathname.startsWith('/workspace/projects') ? theme.iconActive : theme.iconInactive} />
                      <span className={cn(location.pathname.startsWith('/workspace/projects') ? "font-bold" : "")}>Projetos</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/workspace/calendar"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-1.5 rounded-md text-sm transition-all duration-300 group",
                        location.pathname.startsWith('/workspace/calendar')
                          ? theme.itemActiveBg
                          : theme.itemInactiveBg
                      )}
                    >
                      <Calendar size={16} className={location.pathname.startsWith('/workspace/calendar') ? theme.iconActive : theme.iconInactive} />
                      <span className={cn(location.pathname.startsWith('/workspace/calendar') ? "font-bold" : "")}>Agenda</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <ul className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== (module === 'nutrition' ? '/nutrition' : module === 'workspace' ? '/workspace' : module === 'communication' ? '/communication' : '/admin') && location.pathname.startsWith(item.path));
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all duration-300 group",
                          isActive ? theme.itemActiveBg : theme.itemInactiveBg
                        )}
                      >
                        <item.icon size={20} className={isActive ? theme.iconActive : theme.moduleName} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
  `
);

fs.writeFileSync(file, content);
console.log('Layout workspace sidebar modified');
