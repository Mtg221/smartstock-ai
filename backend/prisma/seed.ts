import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed SmartStock AI...');

  // ─── Rôles ──────────────────────────────────────────────────────────────────
  const superadminRole = await prisma.role.upsert({
    where: { name: 'superadmin' },
    update: {},
    create: {
      name: 'superadmin',
      permissions: { all: true, manage_companies: true, manage_users: true },
    },
  });

  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'admin' },
      update: {},
      create: {
        name: 'admin',
        permissions: { all: true, manage_users: true, manage_company: true, view_reports: true, manage_ai: true },
      },
    }),
    prisma.role.upsert({
      where: { name: 'directeur' },
      update: {},
      create: {
        name: 'directeur',
        permissions: { view_reports: true, view_forecasts: true, view_analytics: true },
      },
    }),
    prisma.role.upsert({
      where: { name: 'gestionnaire' },
      update: {},
      create: {
        name: 'gestionnaire',
        permissions: { manage_products: true, manage_suppliers: true, manage_stock: true, view_reports: true },
      },
    }),
    prisma.role.upsert({
      where: { name: 'employe' },
      update: {},
      create: {
        name: 'employe',
        permissions: { create_sales: true, view_products: true },
      },
    }),
  ]);

  const [adminRole, directeurRole, gestionnaireRole, employeRole] = roles;
  console.log('✅ Rôles créés');

  // ─── Entreprise démo ────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: 'demo-company-001' },
    update: {},
    create: {
      id: 'demo-company-001',
      name: 'DIALLO & Frères SARL',
      country: 'SN',
      currency: 'XOF',
    },
  });
  console.log('✅ Entreprise créée:', company.name);

  // ─── Utilisateurs démo ──────────────────────────────────────────────────────
  const demoPass = process.env.DEMO_PASSWORD || 'SmartStock2024!';
  const password = await bcrypt.hash(demoPass, 12);

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@smartstock.demo' },
      update: {},
      create: {
        email: 'admin@smartstock.demo',
        passwordHash: password,
        firstName: 'Amadou',
        lastName: 'Diallo',
        roleId: adminRole.id,
        companyId: company.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'directeur@smartstock.demo' },
      update: {},
      create: {
        email: 'directeur@smartstock.demo',
        passwordHash: password,
        firstName: 'Fatou',
        lastName: 'Mbaye',
        roleId: directeurRole.id,
        companyId: company.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'gestionnaire@smartstock.demo' },
      update: {},
      create: {
        email: 'gestionnaire@smartstock.demo',
        passwordHash: password,
        firstName: 'Ousmane',
        lastName: 'Sow',
        roleId: gestionnaireRole.id,
        companyId: company.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'employe@smartstock.demo' },
      update: {},
      create: {
        email: 'employe@smartstock.demo',
        passwordHash: password,
        firstName: 'Mariama',
        lastName: 'Ba',
        roleId: employeRole.id,
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Utilisateurs créés (mot de passe: SmartStock2024!)');

  // ─── Catégories ─────────────────────────────────────────────────────────────
  const [alimentation, boissons, hygiene, electronique] = await Promise.all([
    prisma.category.upsert({ where: { id: 'cat-alim' }, update: {}, create: { id: 'cat-alim', name: 'Alimentation' } }),
    prisma.category.upsert({ where: { id: 'cat-bois' }, update: {}, create: { id: 'cat-bois', name: 'Boissons' } }),
    prisma.category.upsert({ where: { id: 'cat-hyg' }, update: {}, create: { id: 'cat-hyg', name: 'Hygiène & Beauté' } }),
    prisma.category.upsert({ where: { id: 'cat-elec' }, update: {}, create: { id: 'cat-elec', name: 'Électronique' } }),
  ]);
  console.log('✅ Catégories créées');

  // ─── Fournisseurs ────────────────────────────────────────────────────────────
  const [supplier1, supplier2] = await Promise.all([
    prisma.supplier.upsert({
      where: { id: 'sup-001' },
      update: {},
      create: {
        id: 'sup-001',
        name: 'Dakar Import Export',
        email: 'contact@dakar-ie.sn',
        phone: '+221 33 820 0000',
        rating: 4.5,
        companyId: company.id,
      },
    }),
    prisma.supplier.upsert({
      where: { id: 'sup-002' },
      update: {},
      create: {
        id: 'sup-002',
        name: 'West Africa Supplies',
        email: 'info@was.sn',
        phone: '+221 33 860 0000',
        rating: 4.2,
        companyId: company.id,
      },
    }),
  ]);
  console.log('✅ Fournisseurs créés');

  // ─── Produits démo ──────────────────────────────────────────────────────────
  const productsData = [
    { id: 'prod-001', name: 'Riz Parfumé 25kg', sku: 'RIZ-25KG', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 12000, salePrice: 15000, quantity: 50, alertThreshold: 20 },
    { id: 'prod-002', name: 'Huile d\'arachide 5L', sku: 'HUILE-5L', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 4500, salePrice: 5500, quantity: 8, alertThreshold: 15 },
    { id: 'prod-003', name: 'Sucre cristallisé 50kg', sku: 'SUC-50KG', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 25000, salePrice: 30000, quantity: 35, alertThreshold: 10 },
    { id: 'prod-004', name: 'Eau minérale Kirène 1.5L (pack 6)', sku: 'EAU-KIREN-6', categoryId: boissons.id, supplierId: supplier2.id, purchasePrice: 1800, salePrice: 2200, quantity: 120, alertThreshold: 30 },
    { id: 'prod-005', name: 'Jus de bissap 1L', sku: 'JUS-BIS-1L', categoryId: boissons.id, supplierId: supplier2.id, purchasePrice: 800, salePrice: 1200, quantity: 5, alertThreshold: 20 },
    { id: 'prod-006', name: 'Savon Lux (boîte 12)', sku: 'SAV-LUX-12', categoryId: hygiene.id, supplierId: supplier2.id, purchasePrice: 3600, salePrice: 4800, quantity: 40, alertThreshold: 10 },
    { id: 'prod-007', name: 'Lait Candia 1L (pack 12)', sku: 'LAIT-CAN-12', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 9600, salePrice: 12000, quantity: 25, alertThreshold: 12 },
    { id: 'prod-008', name: 'Farine de blé 25kg', sku: 'FAR-25KG', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 10000, salePrice: 13000, quantity: 3, alertThreshold: 10 },
    { id: 'prod-009', name: 'Téléphone Tecno Spark (8GB)', sku: 'TEL-TECNO-8G', categoryId: electronique.id, supplierId: supplier2.id, purchasePrice: 65000, salePrice: 85000, quantity: 15, alertThreshold: 3 },
    { id: 'prod-010', name: 'Tomate concentrée (carton 24)', sku: 'TOM-CONC-24', categoryId: alimentation.id, supplierId: supplier1.id, purchasePrice: 7200, salePrice: 9600, quantity: 60, alertThreshold: 15 },
  ];

  for (const p of productsData) {
    await prisma.product.upsert({ where: { id: p.id }, update: {}, create: { ...p, companyId: company.id } });
  }
  console.log('✅ 10 produits créés');

  // ─── Ventes historiques (30 derniers jours) ─────────────────────────────────
  const admin = await prisma.user.findUnique({ where: { email: 'admin@smartstock.demo' } });
  const products = await prisma.product.findMany({ where: { companyId: company.id } });

  let salesCreated = 0;
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const saleDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000);
    const numSales = Math.floor(Math.random() * 4) + 1;

    for (let s = 0; s < numSales; s++) {
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = products.sort(() => Math.random() - 0.5).slice(0, numItems);
      const items = selectedProducts.map(p => ({
        productId: p.id,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: Number(p.salePrice),
      }));
      const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

      await prisma.sale.create({
        data: {
          userId: admin!.id,
          companyId: company.id,
          totalAmount,
          saleDate,
          saleItems: { create: items },
        },
      });
      salesCreated++;
    }
  }
  console.log(`✅ ${salesCreated} ventes de démonstration créées`);

  // ─── Superadmin ─────────────────────────────────────────────────────────────
  const superEmail = process.env.SUPERADMIN_EMAIL;
  const superPwd = process.env.SUPERADMIN_PASSWORD;
  if (!superEmail || !superPwd) {
    console.warn('⚠️  SUPERADMIN_EMAIL ou SUPERADMIN_PASSWORD manquant — superadmin ignoré');
  } else {
    const superPassword = await bcrypt.hash(superPwd, 12);
    await prisma.user.upsert({
      where: { email: superEmail },
      update: { passwordHash: superPassword },
      create: {
        email: superEmail,
        passwordHash: superPassword,
        firstName: 'Super',
        lastName: 'Admin',
        roleId: superadminRole.id,
      },
    });
    console.log(`✅ Superadmin créé : ${superEmail}`);
  }

  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n📋 Comptes de démo :');
  console.log('   Superadmin → superadmin@smartstock.ai / SuperAdmin2024!');
  console.log('   Admin      → admin@smartstock.demo');
  console.log('   Directeur  → directeur@smartstock.demo');
  console.log('   Gestionnaire → gestionnaire@smartstock.demo');
  console.log('   Employé    → employe@smartstock.demo');
  console.log('   Mot de passe démo : SmartStock2024!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
