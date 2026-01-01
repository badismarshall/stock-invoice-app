// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { expand } from "dotenv-expand";
expand(config());

import { faker } from "@faker-js/faker/locale/fr";
import { eq } from "drizzle-orm";
import { db, connection } from "@/db";
import {
  user,
  organization,
  category,
  product,
  partner,
  stockCurrent,
  purchaseOrder,
  purchaseOrderItem,
  deliveryNote,
  deliveryNoteItem,
  invoice,
  invoiceItem,
  payment,
  stockMovement,
} from "@/db/schema";
import { generateId } from "@/lib/data-table/id";
import env from "@/env";

// Configuration
const CONFIG = {
  users: 50,
  organizations: 5,
  categories: 20,
  products: 500,
  clients: 100,
  suppliers: 50,
  purchaseOrders: 200,
  deliveryNotes: 300,
  invoices: 400,
  paymentsPerInvoice: 0.7, // 70% of invoices have payments
};

// Helper function to generate random date in the past
function randomPastDate(daysAgo: number = 365): Date {
  return faker.date.past({ years: daysAgo / 365 });
}

// Helper function to generate random date between two dates
function randomDateBetween(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

async function seedUsers() {
  console.log("🌱 Seeding users...");
  const users = [];
  for (let i = 0; i < CONFIG.users; i++) {
    const roles = ["admin", "user", "moderator", null];
    users.push({
      id: generateId("user"),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      emailVerified: faker.datatype.boolean({ probability: 0.8 }),
      image: faker.datatype.boolean({ probability: 0.3 }) ? faker.image.avatar() : null,
      role: faker.helpers.arrayElement(roles),
      banned: faker.datatype.boolean({ probability: 0.05 }),
      banReason: null,
      banExpires: null,
      createdAt: randomPastDate(180),
      updatedAt: new Date(),
    });
  }
  await db.insert(user).values(users).onConflictDoNothing();
  console.log(`✅ Seeded ${users.length} users`);
  return users;
}

async function seedOrganizations() {
  console.log("🌱 Seeding organizations...");
  const organizations = [];
  for (let i = 0; i < CONFIG.organizations; i++) {
    const name = faker.company.name();
    organizations.push({
      id: generateId("org"),
      name,
      slug: faker.helpers.slugify(name).toLowerCase(),
      logo: faker.datatype.boolean({ probability: 0.5 }) ? faker.image.url() : null,
      createdAt: randomPastDate(730),
      metadata: null,
    });
  }
  await db.insert(organization).values(organizations).onConflictDoNothing();
  console.log(`✅ Seeded ${organizations.length} organizations`);
  return organizations;
}

async function seedCategories() {
  console.log("🌱 Seeding categories...");
  const categories = [];
  const categoryNames = [
    "Électronique",
    "Vêtements",
    "Alimentaire",
    "Mobilier",
    "Outils",
    "Jouets",
    "Livres",
    "Cosmétiques",
    "Sport",
    "Automobile",
    "Informatique",
    "Médical",
    "Bricolage",
    "Jardinage",
    "Cuisine",
    "Décoration",
    "Bijoux",
    "Musique",
    "Photo",
    "Téléphonie",
  ];
  
  for (let i = 0; i < CONFIG.categories; i++) {
    const name = i < categoryNames.length 
      ? categoryNames[i] 
      : faker.commerce.department();
    categories.push({
      id: generateId("cat"),
      name,
      description: faker.commerce.productDescription(),
      isActive: faker.datatype.boolean({ probability: 0.9 }),
      createdAt: randomPastDate(365),
    });
  }
  await db.insert(category).values(categories).onConflictDoNothing();
  console.log(`✅ Seeded ${categories.length} categories`);
  return categories;
}

async function seedProducts(categories: Array<{ id: string }>) {
  console.log("🌱 Seeding products...");
  const products = [];
  const units = ["kg", "g", "L", "mL", "m", "cm", "unité", "paquet", "boîte", "carton"];
  
  for (let i = 0; i < CONFIG.products; i++) {
    const purchasePrice = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));
    const margin = faker.number.float({ min: 0.1, max: 0.5 }); // 10-50% margin
    const salePriceLocal = purchasePrice * (1 + margin);
    const salePriceExport = salePriceLocal * (1 + faker.number.float({ min: 0.05, max: 0.2 }));
    
    products.push({
      id: generateId("prod"),
      code: `PROD-${String(i + 1).padStart(6, "0")}`,
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      categoryId: faker.helpers.arrayElement(categories).id,
      unitOfMeasure: faker.helpers.arrayElement(units),
      purchasePrice: purchasePrice.toFixed(2),
      salePriceLocal: salePriceLocal.toFixed(2),
      salePriceExport: salePriceExport.toFixed(2),
      taxRate: faker.helpers.arrayElement(["0", "7", "19"]),
      isActive: faker.datatype.boolean({ probability: 0.95 }),
      createdAt: randomPastDate(365),
      updatedAt: new Date(),
    });
  }
  await db.insert(product).values(products).onConflictDoNothing();
  console.log(`✅ Seeded ${products.length} products`);
  return products;
}

async function seedPartners() {
  console.log("🌱 Seeding partners...");
  const partners = [];
  
  // Seed clients
  for (let i = 0; i < CONFIG.clients; i++) {
    partners.push({
      id: generateId("partner"),
      name: faker.company.name(),
      contact: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress({ useFullAddress: true }),
      credit: faker.number.float({ min: 0, max: 50000 }).toFixed(2),
      nif: faker.string.numeric(10),
      rc: faker.string.alphanumeric(8).toUpperCase(),
      type: "client" as const,
      createdAt: randomPastDate(365),
      updatedAt: new Date(),
    });
  }
  
  // Seed suppliers
  for (let i = 0; i < CONFIG.suppliers; i++) {
    partners.push({
      id: generateId("partner"),
      name: faker.company.name(),
      contact: faker.person.fullName(),
      phone: faker.phone.number(),
      email: faker.internet.email(),
      address: faker.location.streetAddress({ useFullAddress: true }),
      credit: faker.number.float({ min: 0, max: 10000 }).toFixed(2),
      nif: faker.string.numeric(10),
      rc: faker.string.alphanumeric(8).toUpperCase(),
      type: "fournisseur" as const,
      createdAt: randomPastDate(365),
      updatedAt: new Date(),
    });
  }
  
  await db.insert(partner).values(partners).onConflictDoNothing();
  console.log(`✅ Seeded ${partners.length} partners (${CONFIG.clients} clients, ${CONFIG.suppliers} suppliers)`);
  return partners;
}

async function seedStockCurrent(products: Array<{ id: string }>) {
  console.log("🌱 Seeding stock current...");
  const stockData = [];
  
  for (const product of products) {
    const quantity = faker.number.float({ min: 0, max: 10000, fractionDigits: 3 });
    const averageCost = faker.number.float({ min: 10, max: 1000, fractionDigits: 2 });
    
    stockData.push({
      id: generateId("stock"),
      productId: product.id,
      quantityAvailable: quantity.toFixed(3),
      averageCost: averageCost.toFixed(2),
      lastMovementDate: randomPastDate(30).toISOString().split("T")[0],
      lastUpdated: new Date(),
    });
  }
  
  await db.insert(stockCurrent).values(stockData).onConflictDoNothing();
  console.log(`✅ Seeded ${stockData.length} stock records`);
  return stockData;
}

async function seedPurchaseOrders(
  suppliers: Array<{ id: string }>,
  users: Array<{ id: string }>
) {
  console.log("🌱 Seeding purchase orders...");
  const orders = [];
  const statuses = ["pending", "received", "cancelled"] as const;
  
  for (let i = 0; i < CONFIG.purchaseOrders; i++) {
    const orderDate = randomPastDate(180);
    const status = faker.helpers.arrayElement(statuses);
    const receptionDate = status === "received" 
      ? randomDateBetween(orderDate, new Date())
      : null;
    
    orders.push({
      id: generateId("po"),
      orderNumber: `PO-${String(i + 1).padStart(6, "0")}`,
      supplierId: faker.helpers.arrayElement(suppliers).id,
      orderDate: orderDate.toISOString().split("T")[0],
      receptionDate: receptionDate?.toISOString().split("T")[0] || null,
      status,
      supplierOrderNumber: faker.datatype.boolean({ probability: 0.5 }) 
        ? `SUP-${faker.string.alphanumeric(8)}` 
        : null,
      totalAmount: null, // Will be calculated from items
      notes: faker.datatype.boolean({ probability: 0.3 }) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: orderDate,
      updatedAt: new Date(),
    });
  }
  
  await db.insert(purchaseOrder).values(orders).onConflictDoNothing();
  console.log(`✅ Seeded ${orders.length} purchase orders`);
  return orders;
}

async function seedPurchaseOrderItems(
  purchaseOrders: Array<{ id: string }>,
  products: Array<{ id: string }>
) {
  console.log("🌱 Seeding purchase order items...");
  const items = [];
  
  for (const order of purchaseOrders) {
    const itemCount = faker.number.int({ min: 1, max: 10 });
    let orderTotal = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const quantity = faker.number.float({ min: 1, max: 100, fractionDigits: 3 });
      const unitCost = parseFloat(faker.commerce.price({ min: 5, max: 500 }));
      const lineTotal = quantity * unitCost;
      orderTotal += lineTotal;
      
      items.push({
        id: generateId("poi"),
        purchaseOrderId: order.id,
        productId: faker.helpers.arrayElement(products).id,
        quantity: quantity.toFixed(3),
        unitCost: unitCost.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      });
    }
    
    // Update order total
    await db
      .update(purchaseOrder)
      .set({ totalAmount: orderTotal.toFixed(2) })
      .where(eq(purchaseOrder.id, order.id));
  }
  
  // Insert in batches for better performance
  const batchSize = 1000;
  for (let i = 0; i < items.length; i += batchSize) {
    await db.insert(purchaseOrderItem).values(items.slice(i, i + batchSize));
  }
  
  console.log(`✅ Seeded ${items.length} purchase order items`);
  return items;
}

async function seedDeliveryNotes(
  clients: Array<{ id: string }>,
  users: Array<{ id: string }>
) {
  console.log("🌱 Seeding delivery notes...");
  const notes = [];
  const noteTypes = ["local", "export"] as const;
  const statuses = ["active", "cancelled"] as const;
  
  for (let i = 0; i < CONFIG.deliveryNotes; i++) {
    const noteDate = randomPastDate(120);
    notes.push({
      id: generateId("dn"),
      noteNumber: `DN-${String(i + 1).padStart(6, "0")}`,
      noteType: faker.helpers.arrayElement(noteTypes),
      clientId: faker.helpers.arrayElement(clients).id,
      noteDate: noteDate.toISOString().split("T")[0],
      status: faker.helpers.arrayElement(statuses),
      currency: faker.helpers.arrayElement(["DZD", "EUR", "USD"]),
      destinationCountry: faker.helpers.arrayElement(noteTypes) === "export"
        ? faker.location.country()
        : null,
      deliveryLocation: faker.location.city(),
      notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: noteDate,
      updatedAt: new Date(),
    });
  }
  
  await db.insert(deliveryNote).values(notes).onConflictDoNothing();
  console.log(`✅ Seeded ${notes.length} delivery notes`);
  return notes;
}

async function seedDeliveryNoteItems(
  deliveryNotes: Array<{ id: string }>,
  products: Array<{ id: string }>
) {
  console.log("🌱 Seeding delivery note items...");
  const items = [];
  
  for (const note of deliveryNotes) {
    const itemCount = faker.number.int({ min: 1, max: 15 });
    
    for (let i = 0; i < itemCount; i++) {
      const quantity = faker.number.float({ min: 1, max: 200, fractionDigits: 3 });
      const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));
      const discountPercent = faker.number.float({ min: 0, max: 20, fractionDigits: 2 });
      const lineTotal = quantity * unitPrice * (1 - discountPercent / 100);
      
      items.push({
        id: generateId("dni"),
        deliveryNoteId: note.id,
        productId: faker.helpers.arrayElement(products).id,
        quantity: quantity.toFixed(3),
        unitPrice: unitPrice.toFixed(2),
        discountPercent: discountPercent.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      });
    }
  }
  
  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < items.length; i += batchSize) {
    await db.insert(deliveryNoteItem).values(items.slice(i, i + batchSize));
  }
  
  console.log(`✅ Seeded ${items.length} delivery note items`);
  return items;
}

async function seedInvoices(
  clients: Array<{ id: string }>,
  suppliers: Array<{ id: string }>,
  deliveryNotes: Array<{ id: string } | null>,
  purchaseOrders: Array<{ id: string } | null>,
  users: Array<{ id: string }>
) {
  console.log("🌱 Seeding invoices...");
  const invoices = [];
  const invoiceTypes = ["sale_local", "sale_export", "proforma", "purchase", "delivery_note_invoice"] as const;
  const paymentStatuses = ["unpaid", "partially_paid", "paid"] as const;
  const statuses = ["active", "cancelled"] as const;
  const paymentMethods = ["cash", "check", "transfer", "other"] as const;
  
  for (let i = 0; i < CONFIG.invoices; i++) {
    const invoiceDate = randomPastDate(90);
    const invoiceType = faker.helpers.arrayElement(invoiceTypes);
    const isPurchase = invoiceType === "purchase";
    const clientId = !isPurchase ? faker.helpers.arrayElement(clients).id : null;
    const supplierId = isPurchase ? faker.helpers.arrayElement(suppliers).id : null;
    
    invoices.push({
      id: generateId("inv"),
      invoiceNumber: `INV-${String(i + 1).padStart(6, "0")}`,
      invoiceType,
      clientId,
      supplierId,
      deliveryNoteId: invoiceType === "delivery_note_invoice" && deliveryNotes.length > 0
        ? faker.helpers.arrayElement(deliveryNotes.filter((dn): dn is { id: string } => dn !== null)).id
        : null,
      purchaseOrderId: isPurchase && purchaseOrders.length > 0
        ? faker.helpers.arrayElement(purchaseOrders.filter((po): po is { id: string } => po !== null)).id
        : null,
      invoiceDate: invoiceDate.toISOString().split("T")[0],
      dueDate: faker.date.future({ years: 0.5, refDate: invoiceDate }).toISOString().split("T")[0],
      currency: faker.helpers.arrayElement(["DZD", "EUR", "USD"]),
      destinationCountry: invoiceType === "sale_export" ? faker.location.country() : null,
      deliveryLocation: faker.location.city(),
      supplierOrderNumber: faker.datatype.boolean({ probability: 0.3 }) 
        ? `SUP-${faker.string.alphanumeric(8)}` 
        : null,
      subtotal: "0", // Will be calculated from items
      taxAmount: "0", // Will be calculated from items
      totalAmount: "0", // Will be calculated from items
      paymentStatus: faker.helpers.arrayElement(paymentStatuses),
      status: faker.helpers.arrayElement(statuses),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: invoiceDate,
      updatedAt: new Date(),
    });
  }
  
  await db.insert(invoice).values(invoices).onConflictDoNothing();
  console.log(`✅ Seeded ${invoices.length} invoices`);
  return invoices;
}

async function seedInvoiceItems(
  invoices: Array<{ id: string }>,
  products: Array<{ id: string }>
) {
  console.log("🌱 Seeding invoice items...");
  const items = [];
  
  for (const inv of invoices) {
    const itemCount = faker.number.int({ min: 1, max: 20 });
    let subtotal = 0;
    let taxAmount = 0;
    
    for (let i = 0; i < itemCount; i++) {
      const quantity = faker.number.float({ min: 1, max: 150, fractionDigits: 3 });
      const unitPrice = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));
      const discountPercent = faker.number.float({ min: 0, max: 25, fractionDigits: 2 });
      const taxRate = parseFloat(faker.helpers.arrayElement(["0", "7", "19"]));
      
      const lineSubtotal = quantity * unitPrice * (1 - discountPercent / 100);
      const lineTax = lineSubtotal * (taxRate / 100);
      const lineTotal = lineSubtotal + lineTax;
      
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      
      items.push({
        id: generateId("ivi"),
        invoiceId: inv.id,
        productId: faker.helpers.arrayElement(products).id,
        quantity: quantity.toFixed(3),
        unitPrice: unitPrice.toFixed(2),
        discountPercent: discountPercent.toFixed(2),
        taxRate: taxRate.toFixed(2),
        lineSubtotal: lineSubtotal.toFixed(2),
        lineTax: lineTax.toFixed(2),
        lineTotal: lineTotal.toFixed(2),
      });
    }
    
    const totalAmount = subtotal + taxAmount;
    
    // Update invoice totals
    await db
      .update(invoice)
      .set({
        subtotal: subtotal.toFixed(2),
        taxAmount: taxAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
      })
      .where(eq(invoice.id, inv.id));
  }
  
  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < items.length; i += batchSize) {
    await db.insert(invoiceItem).values(items.slice(i, i + batchSize));
  }
  
  console.log(`✅ Seeded ${items.length} invoice items`);
  return items;
}

async function seedPayments(
  invoices: Array<{ id: string; clientId: string | null; supplierId: string | null; totalAmount: string; paymentStatus: string }>,
  users: Array<{ id: string }>
) {
  console.log("🌱 Seeding payments...");
  const payments = [];
  const paymentMethods = ["cash", "check", "transfer", "other"] as const;
  
  const invoicesWithPayments = invoices.filter(() => 
    faker.datatype.boolean({ probability: CONFIG.paymentsPerInvoice })
  );
  
  for (const invoice of invoicesWithPayments) {
    const paymentDate = randomPastDate(60);
    const totalAmount = parseFloat(invoice.totalAmount);
    const paymentStatus = invoice.paymentStatus;
    
    let amount: number;
    if (paymentStatus === "paid") {
      amount = totalAmount;
    } else if (paymentStatus === "partially_paid") {
      amount = totalAmount * faker.number.float({ min: 0.3, max: 0.9 });
    } else {
      amount = totalAmount * faker.number.float({ min: 0.1, max: 0.5 });
    }
    
    payments.push({
      id: generateId("pay"),
      paymentNumber: `PAY-${String(payments.length + 1).padStart(6, "0")}`,
      invoiceId: invoice.id,
      clientId: invoice.clientId,
      supplierId: invoice.supplierId,
      paymentDate: paymentDate.toISOString().split("T")[0],
      amount: amount.toFixed(2),
      paymentMethod: faker.helpers.arrayElement(paymentMethods),
      reference: faker.datatype.boolean({ probability: 0.5 }) 
        ? faker.string.alphanumeric(12).toUpperCase()
        : null,
      notes: faker.datatype.boolean({ probability: 0.2 }) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: paymentDate,
    });
  }
  
  await db.insert(payment).values(payments).onConflictDoNothing();
  console.log(`✅ Seeded ${payments.length} payments`);
  return payments;
}

async function seedStockMovements(
  products: Array<{ id: string }>,
  purchaseOrders: Array<{ id: string }>,
  deliveryNotes: Array<{ id: string }>,
  invoices: Array<{ id: string }>,
  users: Array<{ id: string }>
) {
  console.log("🌱 Seeding stock movements...");
  const movements = [];
  const movementTypes = ["in", "out", "adjustment"] as const;
  const movementSources = ["purchase", "sale_local", "sale_export", "delivery_note", "adjustment", "return"] as const;
  
  // Generate movements from purchase orders
  for (const po of purchaseOrders.slice(0, Math.floor(purchaseOrders.length * 0.8))) {
    const productId = faker.helpers.arrayElement(products).id;
    const quantity = faker.number.float({ min: 10, max: 500, fractionDigits: 3 });
    const unitCost = faker.number.float({ min: 5, max: 500, fractionDigits: 2 });
    
    movements.push({
      id: generateId("sm"),
      productId,
      movementType: "in" as const,
      movementSource: "purchase" as const,
      referenceType: "purchase_order",
      referenceId: po.id,
      quantity: quantity.toFixed(3),
      unitCost: unitCost.toFixed(2),
      movementDate: randomPastDate(180).toISOString().split("T")[0],
      notes: faker.datatype.boolean({ probability: 0.1 }) ? faker.lorem.sentence() : null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: randomPastDate(180),
    });
  }
  
  // Generate movements from delivery notes
  for (const dn of deliveryNotes.slice(0, Math.floor(deliveryNotes.length * 0.7))) {
    const productId = faker.helpers.arrayElement(products).id;
    const quantity = faker.number.float({ min: 5, max: 200, fractionDigits: 3 });
    
    movements.push({
      id: generateId("sm"),
      productId,
      movementType: "out" as const,
      movementSource: "delivery_note" as const,
      referenceType: "delivery_note",
      referenceId: dn.id,
      quantity: quantity.toFixed(3),
      unitCost: null,
      movementDate: randomPastDate(120).toISOString().split("T")[0],
      notes: null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: randomPastDate(120),
    });
  }
  
  // Generate movements from invoices
  for (const inv of invoices.slice(0, Math.floor(invoices.length * 0.6))) {
    const productId = faker.helpers.arrayElement(products).id;
    const quantity = faker.number.float({ min: 1, max: 150, fractionDigits: 3 });
    const source = faker.helpers.arrayElement(["sale_local", "sale_export"]);
    
    movements.push({
      id: generateId("sm"),
      productId,
      movementType: "out" as const,
      movementSource: source as "sale_local" | "sale_export",
      referenceType: "invoice",
      referenceId: inv.id,
      quantity: quantity.toFixed(3),
      unitCost: null,
      movementDate: randomPastDate(90).toISOString().split("T")[0],
      notes: null,
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: randomPastDate(90),
    });
  }
  
  // Generate adjustment movements
  for (let i = 0; i < 50; i++) {
    const productId = faker.helpers.arrayElement(products).id;
    const quantity = faker.number.float({ min: -100, max: 100, fractionDigits: 3 });
    const movementType: "in" | "out" = quantity > 0 ? "in" : "out";
    
    movements.push({
      id: generateId("sm"),
      productId,
      movementType,
      movementSource: "adjustment" as const,
      referenceType: "adjustment",
      referenceId: generateId("adj"),
      quantity: Math.abs(quantity).toFixed(3),
      unitCost: null,
      movementDate: randomPastDate(60).toISOString().split("T")[0],
      notes: faker.lorem.sentence(),
      createdBy: faker.helpers.arrayElement(users).id,
      createdAt: randomPastDate(60),
    });
  }
  
  // Insert in batches
  const batchSize = 1000;
  for (let i = 0; i < movements.length; i += batchSize) {
    await db.insert(stockMovement).values(movements.slice(i, i + batchSize));
  }
  
  console.log(`✅ Seeded ${movements.length} stock movements`);
  return movements;
}

async function main() {
  console.log("🚀 Starting database seeding...\n");
  
  if (!env.DB_SEEDING) {
    throw new Error('You must set DB_SEEDING to "true" when running seed script');
  }
  
  // Validate database connection - use env object which is already validated
  const dbUrl = env.DATABASE_URL || process.env.DATABASE_URL;
  console.log(dbUrl);

  if (!dbUrl) {
    throw new Error('DATABASE_URL is not set in environment variables. Please check your .env file.');
  }
  
  // Check if DATABASE_URL looks valid
  if (!dbUrl.includes('://') || !dbUrl.includes('@')) {
    console.warn('⚠️  Warning: DATABASE_URL format may be incorrect.');
    console.warn('Expected format: postgresql://username:password@host:port/database');
  }
  
  // Verify the connection is using the correct DATABASE_URL
  // Recreate connection if needed to ensure it uses the loaded env
  const actualDbUrl = process.env.DATABASE_URL;
  if (actualDbUrl !== dbUrl) {
    console.warn('⚠️  Warning: Connection might be using a different DATABASE_URL');
    console.warn(`   Expected: ${dbUrl.substring(0, 30)}...`);
    console.warn(`   Actual: ${actualDbUrl?.substring(0, 30) || 'undefined'}...`);
  }
  
  // Test database connection first
  console.log("🔌 Testing database connection...");
  try {
    await connection`SELECT 1`;
    console.log("✅ Database connection successful\n");
  } catch (connError) {
    console.error("❌ Database connection failed!");
    if (connError instanceof Error) {
      if (connError.message.includes("password authentication failed")) {
        console.error("\n💡 Authentication Error:");
        console.error("   The database username or password is incorrect.");
        console.error("   Please check your DATABASE_URL in .env file.");
        console.error("   Format: postgresql://username:password@host:port/database");
        
        // Try to extract info from DATABASE_URL without exposing password
        try {
          const url = new URL(dbUrl.replace('postgresql://', 'http://').replace('postgres://', 'http://'));
          console.error(`   Current connection: ${url.username}@${url.hostname}:${url.port || 5432}/${url.pathname.slice(1)}`);
        } catch {
          console.error("   Could not parse DATABASE_URL");
        }
      } else if (connError.message.includes("does not exist")) {
        console.error("\n💡 Database Error:");
        console.error("   The database does not exist. Please create it first.");
      } else if (connError.message.includes("ECONNREFUSED") || connError.message.includes("connection")) {
        console.error("\n💡 Connection Error:");
        console.error("   Cannot connect to PostgreSQL server.");
        console.error("   Make sure PostgreSQL is running and check DB_HOST and DB_PORT.");
      }
    }
    throw connError;
  }
  
  try {
    // Seed data (adding to existing data, not deleting)
    console.log("📦 Adding seed data to existing database...\n");
    
    // Seed data
    const users = await seedUsers();
    const organizations = await seedOrganizations();
    const categories = await seedCategories();
    const products = await seedProducts(categories);
    const partners = await seedPartners();
    const clients = partners.filter(p => p.type === "client");
    const suppliers = partners.filter(p => p.type === "fournisseur");
    await seedStockCurrent(products);
    const purchaseOrders = await seedPurchaseOrders(suppliers, users);
    await seedPurchaseOrderItems(purchaseOrders, products);
    const deliveryNotes = await seedDeliveryNotes(clients, users);
    await seedDeliveryNoteItems(deliveryNotes, products);
    const invoices = await seedInvoices(clients, suppliers, deliveryNotes, purchaseOrders, users);
    await seedInvoiceItems(invoices, products);
    await seedPayments(invoices, users);
    await seedStockMovements(products, purchaseOrders, deliveryNotes, invoices, users);
    
    console.log("\n✨ Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Organizations: ${organizations.length}`);
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Partners: ${partners.length} (${clients.length} clients, ${suppliers.length} suppliers)`);
    console.log(`   - Purchase Orders: ${purchaseOrders.length}`);
    console.log(`   - Delivery Notes: ${deliveryNotes.length}`);
    console.log(`   - Invoices: ${invoices.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    
    // Provide helpful error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes("password authentication failed")) {
        console.error("\n💡 Tip: Check your DATABASE_URL in .env file.");
        console.error("   Format: postgresql://username:password@host:port/database");
        console.error("   Make sure the username and password are correct.");
      } else if (error.message.includes("connection") || error.message.includes("ECONNREFUSED")) {
        console.error("\n💡 Tip: Make sure PostgreSQL is running and accessible.");
        console.error("   Check your DB_HOST and DB_PORT in .env file.");
      } else if (error.message.includes("database") && error.message.includes("does not exist")) {
        console.error("\n💡 Tip: The database specified in DATABASE_URL does not exist.");
        console.error("   Create it first or update DATABASE_URL with the correct database name.");
      }
    }
    
    throw error;
  } finally {
    await connection.end();
  }
}

main();

