const fs = require('fs');
const file = 'src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove ErpDashboard and Team imports
content = content.replace(/import \{ ErpDashboard \} from '\.\/pages\/erp\/ErpDashboard';\n/, '');
content = content.replace(/import \{ Team \} from '\.\/pages\/erp\/Team';\n/, '');

// Add WorkspaceChat import
content = content.replace(
  /import \{ Finance \} from '\.\/pages\/erp\/Finance';/,
  "import { Finance } from './pages/erp/Finance';\nimport { WorkspaceChat } from './pages/erp/WorkspaceChat';"
);

// Update /workspace routing
content = content.replace(
  /<Route path="\/" element=\{<ErpDashboard \/>\} \/>\n\s*<Route path="\/projects" element=\{<Navigate to="\/admin\/settings" replace \/>\} \/>\n\s*<Route path="\/finance" element=\{<Finance \/>\} \/>\n\s*<Route path="\/team" element=\{<Team \/>\} \/>/,
  `<Route path="/" element={<Navigate to="/workspace/chat/geral" replace />} />
                        <Route path="/chat/:id" element={<WorkspaceChat />} />
                        <Route path="/dm/:id" element={<WorkspaceChat />} />
                        <Route path="/projects/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Projetos em desenvolvimento</h1></div>} />
                        <Route path="/finance" element={<Finance />} />`
);

fs.writeFileSync(file, content);
console.log('App.tsx updated');
