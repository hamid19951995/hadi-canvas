// Endpoints are sourced from provider documentation or the project owner's supplied Neon URL.
export const MCP_CATALOG = Object.freeze([
  { id: 'figma', name: 'Figma', category: 'Design', endpoint: 'https://mcp.figma.com/mcp', transport: 'streamable-http', auth: 'oauth', docs: 'https://developers.figma.com/docs/figma-mcp-server/remote-server-installation/', description: 'دسترسی به زمینه طراحی و فایل‌های Figma؛ احراز هویت در کلاینت سازگار انجام می‌شود.' },
  { id: 'linear', name: 'Linear', category: 'Project management', endpoint: 'https://mcp.linear.app/mcp', transport: 'streamable-http', auth: 'oauth-or-token', docs: 'https://linear.app/docs/mcp', description: 'خواندن و مدیریت issueها، پروژه‌ها و دیدگاه‌ها؛ سطح دسترسی به مجوز حساب وابسته است.' },
  { id: 'neon', name: 'Neon', category: 'Database', endpoint: 'https://mcp.neon.tech/mcp', transport: 'streamable-http', auth: 'provider-auth', docs: 'https://neon.tech/docs', description: 'اتصال MCP مربوط به Neon؛ دسترسی واقعی به حساب و مجوزهای Neon نیاز دارد.' },
  { id: 'supabase', name: 'Supabase', category: 'Database', endpoint: 'https://{project-ref}.supabase.co/functions/v1/mcp', transport: 'streamable-http', auth: 'project-config', docs: 'https://supabase.com/docs/guides/ai-tools/byo-mcp', description: 'الگوی endpoint برای MCP مستقرشده در پروژه خودتان؛ این URL به‌صورت خودکار برای پروژه شما ساخته نمی‌شود.' }
])

export function getCatalogEntry(id) { return MCP_CATALOG.find(item => item.id === id) || null }
