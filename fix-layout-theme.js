const fs = require('fs');
const file = 'src/components/Layout.tsx';
let content = fs.readFileSync(file, 'utf8');

const mappingStr = `
  const getThemeClasses = () => {
    if (isLightSidebar) {
      return {
        mobileHeader: "bg-white text-slate-900",
        sidebarBg: "bg-white border-slate-100 text-slate-600",
        moduleName: "text-slate-400",
        itemActiveBg: "bg-amber-50 text-amber-600 shadow-sm",
        itemInactiveBg: "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
        iconActive: "text-amber-500",
        iconInactive: "text-slate-400",
        borderTop: "border-slate-100",
        backLink: "text-slate-400 hover:text-slate-600",
        avatarBg: "bg-amber-500 border-amber-400 group-hover:border-amber-600",
        roleText: "text-slate-400",
        logoutBtn: "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
      };
    }
    switch (module) {
      case 'nutrition':
        return {
          mobileHeader: "bg-emerald-700 text-white",
          sidebarBg: "bg-emerald-800 border-transparent text-emerald-50",
          moduleName: "text-emerald-300",
          itemActiveBg: "bg-emerald-900/40 text-slate-50 shadow-inner",
          itemInactiveBg: "text-emerald-200 hover:bg-emerald-600/50 hover:text-white",
          iconActive: "text-emerald-100",
          iconInactive: "text-emerald-300",
          borderTop: "border-emerald-700/50",
          backLink: "text-emerald-200 hover:text-white",
          avatarBg: "bg-emerald-600 border-emerald-500 group-hover:border-white",
          roleText: "text-emerald-300",
          logoutBtn: "text-emerald-300 hover:text-white hover:bg-emerald-700/50"
        };
      case 'workspace':
        return {
          mobileHeader: "bg-[#1E1F21] text-white",
          sidebarBg: "bg-[#2b092a] border-transparent text-slate-300",
          moduleName: "text-slate-400",
          itemActiveBg: "bg-[#1164A3] text-white shadow-inner",
          itemInactiveBg: "text-slate-300 hover:bg-white/5 hover:text-white",
          iconActive: "text-white",
          iconInactive: "text-slate-400",
          borderTop: "border-white/10",
          backLink: "text-slate-400 hover:text-white",
          avatarBg: "bg-[#1164A3] border-blue-500 group-hover:border-white",
          roleText: "text-slate-400",
          logoutBtn: "text-slate-400 hover:text-white hover:bg-white/10"
        };
      case 'communication':
        return {
          mobileHeader: "bg-indigo-700 text-white",
          sidebarBg: "bg-indigo-800 border-transparent text-indigo-50",
          moduleName: "text-indigo-300",
          itemActiveBg: "bg-indigo-900/40 text-slate-50 shadow-inner",
          itemInactiveBg: "text-indigo-200 hover:bg-indigo-600/50 hover:text-white",
          iconActive: "text-indigo-100",
          iconInactive: "text-indigo-300",
          borderTop: "border-indigo-700/50",
          backLink: "text-indigo-200 hover:text-white",
          avatarBg: "bg-indigo-600 border-indigo-500 group-hover:border-white",
          roleText: "text-indigo-300",
          logoutBtn: "text-indigo-300 hover:text-white hover:bg-indigo-700/50"
        };
      case 'admin':
      default:
        return {
          mobileHeader: "bg-slate-700 text-white",
          sidebarBg: "bg-slate-800 border-transparent text-slate-50",
          moduleName: "text-slate-300",
          itemActiveBg: "bg-slate-900/40 text-slate-50 shadow-inner",
          itemInactiveBg: "text-slate-200 hover:bg-slate-600/50 hover:text-white",
          iconActive: "text-slate-100",
          iconInactive: "text-slate-300",
          borderTop: "border-slate-700/50",
          backLink: "text-slate-200 hover:text-white",
          avatarBg: "bg-slate-600 border-slate-500 group-hover:border-white",
          roleText: "text-slate-300",
          logoutBtn: "text-slate-300 hover:text-white hover:bg-slate-700/50"
        };
    }
  };

  const theme = getThemeClasses();
`;

content = content.replace(/const themeColor =[\s\S]*?'slate';/, mappingStr);

content = content.replace(/isLightSidebar \? "bg-white text-slate-900" : `bg-\${themeColor}-700 text-white`/, 'theme.mobileHeader');
content = content.replace(/isLightSidebar \? "bg-white border-slate-100 text-slate-600" : `bg-\${themeColor}-800 border-transparent text-\${themeColor}-50`/, 'theme.sidebarBg');
content = content.replace(/isLightSidebar \? "text-slate-400" : `text-\${themeColor}-300`/g, 'theme.moduleName');
content = content.replace(/isActive \?\s*\(isLightSidebar \? "bg-amber-50 text-amber-600 shadow-sm" : `bg-\${themeColor}-900\/40 text-slate-50 shadow-inner`\)\s*:\s*\(isLightSidebar \? "text-slate-500 hover:bg-slate-50 hover:text-slate-900" : `text-\${themeColor}-200 hover:bg-\${themeColor}-600\/50 hover:text-white`\)/, 'isActive ? theme.itemActiveBg : theme.itemInactiveBg');
content = content.replace(/isActive \? \(isLightSidebar \? "text-amber-500" : `text-\${themeColor}-100`\) : \(isLightSidebar \? "text-slate-400" : `text-\${themeColor}-300`\)/, 'isActive ? theme.iconActive : theme.iconInactive');
content = content.replace(/isLightSidebar \? "border-slate-100" : `border-\${themeColor}-700\/50`/, 'theme.borderTop');
content = content.replace(/isLightSidebar \? "text-slate-400 hover:text-slate-600" : `text-\${themeColor}-200 hover:text-white`/, 'theme.backLink');
content = content.replace(/isLightSidebar \? "bg-amber-500 border-amber-400 group-hover:border-amber-600" : `bg-\${themeColor}-600 border-\${themeColor}-500 group-hover:border-white`/, 'theme.avatarBg');
content = content.replace(/isLightSidebar \? "text-slate-400 hover:text-slate-600 hover:bg-slate-50" : `text-\${themeColor}-300 hover:text-white hover:bg-\${themeColor}-700\/50`/, 'theme.logoutBtn');
content = content.replace(/isLightSidebar \? "text-slate-400" : `text-\${themeColor}-300`/g, 'theme.roleText');

fs.writeFileSync(file, content);
console.log('Layout patched');
