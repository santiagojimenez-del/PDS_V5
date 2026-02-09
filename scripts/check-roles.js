const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection('mysql://root:devroot123@localhost:3309/prodrones_application');

  // Get all unique role values from User_Meta
  const [roles] = await conn.execute("SELECT DISTINCT meta_value FROM User_Meta WHERE meta_key = 'roles'");
  console.log('=== All role arrays used ===');
  const allRoles = new Set();
  roles.forEach(r => {
    console.log('  ' + r.meta_value);
    try {
      const arr = JSON.parse(r.meta_value);
      arr.forEach(id => allRoles.add(id));
    } catch(e) {}
  });
  console.log('\nAll unique role IDs:', [...allRoles].sort((a,b) => a-b));

  // Check if there's a roles config in Configuration
  const [roleConfig] = await conn.execute("SELECT * FROM Configuration WHERE Name LIKE '%role%' OR Name LIKE '%Role%'");
  console.log('\n=== Role-related Configuration ===');
  roleConfig.forEach(c => console.log('  [' + c.Application + '] ' + c.Name + ' = ' + c.Value.substring(0, 300)));

  // Check all pages with their full data
  const [allPages] = await conn.execute('SELECT * FROM Pages ORDER BY Application, Priority');
  console.log('\n=== All Pages ===');
  allPages.forEach(p => {
    const design = typeof p.Design === 'string' ? JSON.parse(p.Design) : p.Design;
    const navGroup = p.NavGroup ? (typeof p.NavGroup === 'string' ? JSON.parse(p.NavGroup) : p.NavGroup) : null;
    console.log('  [' + p.Application + '] ' + p.Page + ' | Priority:' + p.Priority + ' | Hidden:' + p.Hidden + ' | Wrapper:' + p.Wrapper);
    console.log('    Title: ' + design.title + ' | Icon: ' + (design.icon || 'none'));
    if (navGroup) console.log('    NavGroup: ' + JSON.stringify(navGroup));
    if (p.RoleAccess) console.log('    RoleAccess: ' + JSON.stringify(p.RoleAccess));
    if (p.PermissionAccess) console.log('    PermissionAccess: ' + JSON.stringify(p.PermissionAccess));
  });

  // Products
  const [products] = await conn.execute('SELECT * FROM Products');
  console.log('\n=== Products ===');
  products.forEach(p => console.log('  ' + p.id + ' | ' + p.name + ' | template: ' + p.deliverable_template));

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
