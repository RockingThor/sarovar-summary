import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

// Department data
const departments = [
  "Engineering",
  "HR",
  "Hotel Admin",
  "Security",
  "IT",
  "Housekeeping",
  "Front Office",
];

// Category data
const categories = [
  "Fire Life Safety",
  "Engineering",
  "Guest Rooms",
  "Public Areas",
  "Security",
  "F&B",
  "Back of House",
  "IT & Systems",
];

// Question data based on the hotel pre-opening checklist
const questions = [
  // Fire Life Safety - Engineering
  { serialNo: 1, category: "Fire Life Safety", department: "Engineering", checklistItem: "Fire alarm & detection system commissioned (detectors, panels, integration)" },
  { serialNo: 2, category: "Fire Life Safety", department: "Engineering", checklistItem: "Sprinkler, hydrant & hose reel systems pressure-tested" },
  { serialNo: 3, category: "Fire Life Safety", department: "Engineering", checklistItem: "Kitchen hood fire suppression (ANSUL/FM200) system installed" },
  { serialNo: 4, category: "Fire Life Safety", department: "Engineering", checklistItem: "Fire exits, fire doors & emergency signage verified" },
  { serialNo: 5, category: "Fire Life Safety", department: "HR", checklistItem: "Fire drills conducted with all staff" },
  { serialNo: 6, category: "Fire Life Safety", department: "Hotel Admin", checklistItem: "Fire NOC Received" },

  // Engineering - Engineering
  { serialNo: 7, category: "Engineering", department: "Engineering", checklistItem: "Main electrical panels & breakers commissioned" },
  { serialNo: 8, category: "Engineering", department: "Engineering", checklistItem: "DG set load test completed" },
  { serialNo: 9, category: "Engineering", department: "Engineering", checklistItem: "HVAC/VRV commissioning completed" },
  { serialNo: 10, category: "Engineering", department: "Engineering", checklistItem: "Heat pump & hot water system tested" },
  { serialNo: 11, category: "Engineering", department: "Engineering", checklistItem: "WTP/RO water testing results approved" },
  { serialNo: 12, category: "Engineering", department: "Engineering", checklistItem: "Water connection pressure-tested" },
  { serialNo: 13, category: "Engineering", department: "Engineering", checklistItem: "STP/ETP commissioned and functional" },
  { serialNo: 14, category: "Engineering", department: "Engineering", checklistItem: "Gas bank & manifold system commissioned" },
  { serialNo: 15, category: "Engineering", department: "Engineering", checklistItem: "Kitchen exhaust, scrubbers & ducting tested" },
  { serialNo: 16, category: "Engineering", department: "Engineering", checklistItem: "Building façade & exterior lighting 100% complete" },
  { serialNo: 17, category: "Engineering", department: "Engineering", checklistItem: "Internal & external signage installation complete" },
  { serialNo: 18, category: "Engineering", department: "Engineering", checklistItem: "Landscaping & irrigation fully functional" },

  // Security
  { serialNo: 19, category: "Security", department: "Security", checklistItem: "Driveway, main gate & boom barrier tested" },
  { serialNo: 20, category: "Security", department: "Security", checklistItem: "CCTV system installed and recording" },
  { serialNo: 21, category: "Security", department: "Security", checklistItem: "Access control systems operational" },
  { serialNo: 22, category: "Security", department: "Security", checklistItem: "Security personnel hired and trained" },
  { serialNo: 23, category: "Security", department: "Security", checklistItem: "Emergency evacuation plan documented" },
  { serialNo: 24, category: "Security", department: "Security", checklistItem: "Parking demarcation for guest & staff complete" },

  // Guest Rooms
  { serialNo: 25, category: "Guest Rooms", department: "Housekeeping", checklistItem: "All rooms snag-free & deep cleaned" },
  { serialNo: 26, category: "Guest Rooms", department: "Engineering", checklistItem: "HVAC, switches & lighting tested for all rooms" },
  { serialNo: 27, category: "Guest Rooms", department: "Engineering", checklistItem: "Bathroom plumbing & drainage tested" },
  { serialNo: 28, category: "Guest Rooms", department: "IT", checklistItem: "RFID/mobile key access functional" },
  { serialNo: 29, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Room amenities & linens stocked (3 par)" },
  { serialNo: 30, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Minibar setup & testing completed" },
  { serialNo: 31, category: "Guest Rooms", department: "IT", checklistItem: "TV channel mapping completed" },
  { serialNo: 32, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Public area restrooms ready for operation" },
  { serialNo: 33, category: "Guest Rooms", department: "Engineering", checklistItem: "Physically challenged rooms verified for accessibility" },

  // Public Areas
  { serialNo: 34, category: "Public Areas", department: "Front Office", checklistItem: "Lobby ready – furniture, artwork, scenting & AV setup" },
  { serialNo: 35, category: "Public Areas", department: "Engineering", checklistItem: "Elevators commissioned with valid certification" },
  { serialNo: 36, category: "Public Areas", department: "Engineering", checklistItem: "Escalators (if applicable) commissioned" },
  { serialNo: 37, category: "Public Areas", department: "Housekeeping", checklistItem: "Corridors fully furnished & lit" },
  { serialNo: 38, category: "Public Areas", department: "Engineering", checklistItem: "Swimming pool water quality tested & certified" },
  { serialNo: 39, category: "Public Areas", department: "Engineering", checklistItem: "Gym equipment installed & tested" },
  { serialNo: 40, category: "Public Areas", department: "Engineering", checklistItem: "Spa/wellness area ready for operation" },

  // F&B - Food & Beverage
  { serialNo: 41, category: "F&B", department: "Engineering", checklistItem: "Kitchen equipment commissioned & tested" },
  { serialNo: 42, category: "F&B", department: "Engineering", checklistItem: "Walk-in chillers & freezers temperature verified" },
  { serialNo: 43, category: "F&B", department: "Engineering", checklistItem: "Exhaust hoods & ventilation balanced" },
  { serialNo: 44, category: "F&B", department: "Housekeeping", checklistItem: "Restaurant furniture & décor complete" },
  { serialNo: 45, category: "F&B", department: "Housekeeping", checklistItem: "Bar setup & equipment ready" },
  { serialNo: 46, category: "F&B", department: "Hotel Admin", checklistItem: "FSSAI license obtained" },
  { serialNo: 47, category: "F&B", department: "Hotel Admin", checklistItem: "Liquor license obtained" },
  { serialNo: 48, category: "F&B", department: "Housekeeping", checklistItem: "Banquet halls ready – AV, lighting, furniture" },
  { serialNo: 49, category: "F&B", department: "Housekeeping", checklistItem: "Room service setup & equipment ready" },

  // Back of House
  { serialNo: 50, category: "Back of House", department: "HR", checklistItem: "Staff cafeteria ready & operational" },
  { serialNo: 51, category: "Back of House", department: "HR", checklistItem: "Locker rooms & washrooms ready" },
  { serialNo: 52, category: "Back of House", department: "HR", checklistItem: "Staff uniform distribution complete" },
  { serialNo: 53, category: "Back of House", department: "Housekeeping", checklistItem: "Laundry equipment commissioned" },
  { serialNo: 54, category: "Back of House", department: "Housekeeping", checklistItem: "Linen & uniform storage organized" },
  { serialNo: 55, category: "Back of House", department: "Engineering", checklistItem: "Loading dock & service areas functional" },
  { serialNo: 56, category: "Back of House", department: "Housekeeping", checklistItem: "Waste management & garbage room ready" },
  { serialNo: 57, category: "Back of House", department: "Engineering", checklistItem: "Central stores organized & stocked" },

  // IT & Systems
  { serialNo: 58, category: "IT & Systems", department: "IT", checklistItem: "PMS (Property Management System) configured & tested" },
  { serialNo: 59, category: "IT & Systems", department: "IT", checklistItem: "POS system integration complete" },
  { serialNo: 60, category: "IT & Systems", department: "IT", checklistItem: "Channel manager & booking engine connected" },
  { serialNo: 61, category: "IT & Systems", department: "IT", checklistItem: "Guest WiFi network configured & tested" },
  { serialNo: 62, category: "IT & Systems", department: "IT", checklistItem: "Staff network & internal systems operational" },
  { serialNo: 63, category: "IT & Systems", department: "IT", checklistItem: "IPTV system configured with content" },
  { serialNo: 64, category: "IT & Systems", department: "IT", checklistItem: "Telephone system (EPABX) commissioned" },
  { serialNo: 65, category: "IT & Systems", department: "IT", checklistItem: "BMS (Building Management System) integration complete" },
  { serialNo: 66, category: "IT & Systems", department: "IT", checklistItem: "Digital signage & displays configured" },
  { serialNo: 67, category: "IT & Systems", department: "IT", checklistItem: "Payment gateway integration tested" },

  // Hotel Admin & Compliance
  { serialNo: 68, category: "Public Areas", department: "Hotel Admin", checklistItem: "Occupancy Certificate obtained" },
  { serialNo: 69, category: "Public Areas", department: "Hotel Admin", checklistItem: "Trade license obtained" },
  { serialNo: 70, category: "Public Areas", department: "Hotel Admin", checklistItem: "Tourism department registration complete" },
  { serialNo: 71, category: "Public Areas", department: "Hotel Admin", checklistItem: "Police registration for foreigners complete" },
  { serialNo: 72, category: "Public Areas", department: "Hotel Admin", checklistItem: "PCB (Pollution Control Board) consent obtained" },
  { serialNo: 73, category: "Public Areas", department: "Hotel Admin", checklistItem: "Lift NOC & safety certificate obtained" },
  { serialNo: 74, category: "Public Areas", department: "Hotel Admin", checklistItem: "Insurance policies in place (fire, liability, etc.)" },

  // HR & Training
  { serialNo: 75, category: "Back of House", department: "HR", checklistItem: "All department heads hired & onboarded" },
  { serialNo: 76, category: "Back of House", department: "HR", checklistItem: "All staff hired as per manning guide" },
  { serialNo: 77, category: "Back of House", department: "HR", checklistItem: "Brand standards training completed" },
  { serialNo: 78, category: "Back of House", department: "HR", checklistItem: "Department-specific SOPs training done" },
  { serialNo: 79, category: "Back of House", department: "HR", checklistItem: "Emergency response training completed" },
  { serialNo: 80, category: "Back of House", department: "HR", checklistItem: "Cross-training between departments done" },
];

async function main() {
  console.log("🌱 Starting seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.taskProgress.deleteMany();
  await prisma.question.deleteMany();
  await prisma.category.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();

  // Create departments
  console.log("Creating departments...");
  const departmentRecords: Record<string, string> = {};
  for (const name of departments) {
    const dept = await prisma.department.create({
      data: { name },
    });
    departmentRecords[name] = dept.id;
  }

  // Create categories
  console.log("Creating categories...");
  const categoryRecords: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.create({
      data: { name },
    });
    categoryRecords[name] = cat.id;
  }

  // Create questions
  console.log("Creating questions...");
  for (const q of questions) {
    await prisma.question.create({
      data: {
        serialNo: q.serialNo,
        checklistItem: q.checklistItem,
        categoryId: categoryRecords[q.category],
        departmentId: departmentRecords[q.department],
      },
    });
  }

  // Create a demo admin user (for development)
  console.log("Creating demo admin user...");
  await prisma.user.create({
    data: {
      email: "admin@sarovar.com",
      name: "Admin User",
      role: UserRole.ADMIN,
      firebaseUid: "demo-admin-uid", // Replace with actual Firebase UID in production
      hotelId: null,
    },
  });

  console.log("✅ Seed completed!");
  console.log(`   - ${departments.length} departments`);
  console.log(`   - ${categories.length} categories`);
  console.log(`   - ${questions.length} questions`);
  console.log(`   - 1 demo admin user`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

