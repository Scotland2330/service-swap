import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data…");

  // Clean slate
  await prisma.proposalEvent.deleteMany();
  await prisma.swapProposal.deleteMany();
  await prisma.service.deleteMany();
  await prisma.business.deleteMany();

  const pw = await bcrypt.hash("password123", 10);

  const brightleaf = await prisma.business.create({
    data: {
      email: "hello@brightleaf.studio",
      passwordHash: pw,
      name: "Brightleaf Studio",
      tagline: "Brand & web design for founders",
      bio: "We're a two-person design studio helping early-stage startups look established. Logos, brand systems, and clean marketing sites.",
      industry: "Creative & Media",
      location: "Austin, TX",
      website: "https://brightleaf.studio",
      logoColor: "#7c3aed",
    },
  });

  const ledgerly = await prisma.business.create({
    data: {
      email: "team@ledgerly.co",
      passwordHash: pw,
      name: "Ledgerly Bookkeeping",
      tagline: "Numbers handled so you can build",
      bio: "Bookkeeping and fractional finance for small businesses. QuickBooks cleanup, monthly close, and cash-flow forecasting.",
      industry: "Professional Services",
      location: "Remote",
      logoColor: "#2563eb",
    },
  });

  const cova = await prisma.business.create({
    data: {
      email: "sam@covalent.legal",
      passwordHash: pw,
      name: "Covalent Legal",
      tagline: "Startup legal, minus the big-firm bill",
      bio: "Solo attorney focused on early-stage companies. Incorporations, contracts, and IP basics.",
      industry: "Professional Services",
      location: "Denver, CO",
      logoColor: "#0891b2",
    },
  });

  const [design, brand] = await Promise.all([
    prisma.service.create({
      data: {
        businessId: brightleaf.id,
        title: "Marketing website design",
        description: "A clean, conversion-focused marketing site (up to 5 pages), designed in Figma and ready for handoff. Includes 2 rounds of revisions.",
        category: "Design & Branding",
        pricingModel: "HOURLY",
        hourlyRate: 75,
      },
    }),
    prisma.service.create({
      data: {
        businessId: brightleaf.id,
        title: "Logo & brand identity package",
        description: "Primary + secondary logo, color palette, typography, and a one-page brand guide.",
        category: "Design & Branding",
        pricingModel: "FIXED",
        fixedValue: 1500,
      },
    }),
  ]);

  const [books, forecast] = await Promise.all([
    prisma.service.create({
      data: {
        businessId: ledgerly.id,
        title: "Monthly bookkeeping",
        description: "Categorized transactions, reconciled accounts, and a monthly P&L. Priced per month of books.",
        category: "Accounting & Finance",
        pricingModel: "HOURLY",
        hourlyRate: 60,
      },
    }),
    prisma.service.create({
      data: {
        businessId: ledgerly.id,
        title: "Cash-flow forecast build",
        description: "A 12-month cash-flow model tailored to your business, with scenarios.",
        category: "Accounting & Finance",
        pricingModel: "FIXED",
        fixedValue: 900,
      },
    }),
  ]);

  const incorp = await prisma.service.create({
    data: {
      businessId: cova.id,
      title: "Startup incorporation + docs",
      description: "Entity formation, founder agreements, and standard contract templates.",
      category: "Legal",
      pricingModel: "FIXED",
      fixedValue: 1200,
    },
  });

  await prisma.service.create({
    data: {
      businessId: cova.id,
      title: "Contract review",
      description: "Review and redline of a business contract, with a plain-English summary.",
      category: "Legal",
      pricingModel: "HOURLY",
      hourlyRate: 120,
    },
  });

  // A sample pending proposal with a partial trade + cash top-up:
  // Ledgerly offers 20h bookkeeping ($1200) + $300 cash for Brightleaf's $1500 brand package.
  const p1 = await prisma.swapProposal.create({
    data: {
      initiatorId: ledgerly.id,
      recipientId: brightleaf.id,
      offeredServiceId: books.id,
      offeredQty: 20,
      offeredValue: 20 * 60,
      requestedServiceId: brand.id,
      requestedQty: 1,
      requestedValue: 1500,
      cashTopUp: 300,
      cashPayer: "INITIATOR",
      message: "Love your work — we need a real brand. I'll cover most of it in bookkeeping and add $300 to make it even.",
      terms: "Brand package delivered within 3 weeks; bookkeeping starts next month.",
      status: "PENDING",
    },
  });
  await prisma.proposalEvent.create({
    data: {
      proposalId: p1.id,
      actorId: ledgerly.id,
      actorName: ledgerly.name,
      kind: "CREATED",
      note: "Love your work — we need a real brand. I'll cover most of it in bookkeeping and add $300 to make it even.",
    },
  });

  // A posted request (Thumbtack-style) with an incoming offer.
  const siteRequest = await prisma.serviceRequest.create({
    data: {
      requesterId: cova.id,
      title: "Need a simple marketing website for my practice",
      description: "A clean 3-4 page site to bring in new clients. Home, services, about, contact. I can trade legal work and add a bit of cash if needed.",
      category: "Web Development",
      estimatedValue: 1500,
      offering: "Contract review, incorporation help, or a little cash to top up",
      status: "OPEN",
    },
  });

  // Brightleaf offers to build it (16h design, $1200) in exchange for Covalent's
  // incorporation service ($1200) — a balanced offer on the request.
  const offer = await prisma.swapProposal.create({
    data: {
      initiatorId: brightleaf.id,
      recipientId: cova.id,
      offeredServiceId: design.id,
      offeredQty: 16,
      offeredValue: 16 * 75,
      requestedServiceId: incorp.id,
      requestedQty: 1,
      requestedValue: 1200,
      requestId: siteRequest.id,
      message: "Happy to build your site! I'd love your incorporation package in return.",
      status: "PENDING",
    },
  });
  await prisma.proposalEvent.create({
    data: {
      proposalId: offer.id,
      actorId: brightleaf.id,
      actorName: brightleaf.name,
      kind: "CREATED",
      note: "Happy to build your site! I'd love your incorporation package in return.",
    },
  });

  // A completed swap: Covalent's incorporation for Brightleaf's design hours.
  const p2 = await prisma.swapProposal.create({
    data: {
      initiatorId: brightleaf.id,
      recipientId: cova.id,
      offeredServiceId: design.id,
      offeredQty: 16,
      offeredValue: 16 * 75,
      requestedServiceId: incorp.id,
      requestedQty: 1,
      requestedValue: 1200,
      message: "We'll build your new marketing site if you handle our incorporation.",
      status: "COMPLETED",
    },
  });
  await prisma.proposalEvent.createMany({
    data: [
      { proposalId: p2.id, actorId: brightleaf.id, actorName: brightleaf.name, kind: "CREATED" },
      { proposalId: p2.id, actorId: cova.id, actorName: cova.name, kind: "ACCEPTED" },
      { proposalId: p2.id, actorId: brightleaf.id, actorName: brightleaf.name, kind: "COMPLETED", note: "Site is live — thanks!" },
    ],
  });

  console.log("Seed complete.");
  console.log("Demo logins (password: password123):");
  console.log("  hello@brightleaf.studio");
  console.log("  team@ledgerly.co");
  console.log("  sam@covalent.legal");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
