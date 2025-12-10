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
// const questions = [
//   // Fire Life Safety - Engineering
//   { serialNo: 1, category: "Fire Life Safety", department: "Engineering", checklistItem: "Fire alarm & detection system commissioned (detectors, panels, integration)" },
//   { serialNo: 2, category: "Fire Life Safety", department: "Engineering", checklistItem: "Sprinkler, hydrant & hose reel systems pressure-tested" },
//   { serialNo: 3, category: "Fire Life Safety", department: "Engineering", checklistItem: "Kitchen hood fire suppression (ANSUL/FM200) system installed" },
//   { serialNo: 4, category: "Fire Life Safety", department: "Engineering", checklistItem: "Fire exits, fire doors & emergency signage verified" },
//   { serialNo: 5, category: "Fire Life Safety", department: "HR", checklistItem: "Fire drills conducted with all staff" },
//   { serialNo: 6, category: "Fire Life Safety", department: "Hotel Admin", checklistItem: "Fire NOC Received" },

//   // Engineering - Engineering
//   { serialNo: 7, category: "Engineering", department: "Engineering", checklistItem: "Main electrical panels & breakers commissioned" },
//   { serialNo: 8, category: "Engineering", department: "Engineering", checklistItem: "DG set load test completed" },
//   { serialNo: 9, category: "Engineering", department: "Engineering", checklistItem: "HVAC/VRV commissioning completed" },
//   { serialNo: 10, category: "Engineering", department: "Engineering", checklistItem: "Heat pump & hot water system tested" },
//   { serialNo: 11, category: "Engineering", department: "Engineering", checklistItem: "WTP/RO water testing results approved" },
//   { serialNo: 12, category: "Engineering", department: "Engineering", checklistItem: "Water connection pressure-tested" },
//   { serialNo: 13, category: "Engineering", department: "Engineering", checklistItem: "STP/ETP commissioned and functional" },
//   { serialNo: 14, category: "Engineering", department: "Engineering", checklistItem: "Gas bank & manifold system commissioned" },
//   { serialNo: 15, category: "Engineering", department: "Engineering", checklistItem: "Kitchen exhaust, scrubbers & ducting tested" },
//   { serialNo: 16, category: "Engineering", department: "Engineering", checklistItem: "Building façade & exterior lighting 100% complete" },
//   { serialNo: 17, category: "Engineering", department: "Engineering", checklistItem: "Internal & external signage installation complete" },
//   { serialNo: 18, category: "Engineering", department: "Engineering", checklistItem: "Landscaping & irrigation fully functional" },

//   // Security
//   { serialNo: 19, category: "Security", department: "Security", checklistItem: "Driveway, main gate & boom barrier tested" },
//   { serialNo: 20, category: "Security", department: "Security", checklistItem: "CCTV system installed and recording" },
//   { serialNo: 21, category: "Security", department: "Security", checklistItem: "Access control systems operational" },
//   { serialNo: 22, category: "Security", department: "Security", checklistItem: "Security personnel hired and trained" },
//   { serialNo: 23, category: "Security", department: "Security", checklistItem: "Emergency evacuation plan documented" },
//   { serialNo: 24, category: "Security", department: "Security", checklistItem: "Parking demarcation for guest & staff complete" },

//   // Guest Rooms
//   { serialNo: 25, category: "Guest Rooms", department: "Housekeeping", checklistItem: "All rooms snag-free & deep cleaned" },
//   { serialNo: 26, category: "Guest Rooms", department: "Engineering", checklistItem: "HVAC, switches & lighting tested for all rooms" },
//   { serialNo: 27, category: "Guest Rooms", department: "Engineering", checklistItem: "Bathroom plumbing & drainage tested" },
//   { serialNo: 28, category: "Guest Rooms", department: "IT", checklistItem: "RFID/mobile key access functional" },
//   { serialNo: 29, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Room amenities & linens stocked (3 par)" },
//   { serialNo: 30, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Minibar setup & testing completed" },
//   { serialNo: 31, category: "Guest Rooms", department: "IT", checklistItem: "TV channel mapping completed" },
//   { serialNo: 32, category: "Guest Rooms", department: "Housekeeping", checklistItem: "Public area restrooms ready for operation" },
//   { serialNo: 33, category: "Guest Rooms", department: "Engineering", checklistItem: "Physically challenged rooms verified for accessibility" },

//   // Public Areas
//   { serialNo: 34, category: "Public Areas", department: "Front Office", checklistItem: "Lobby ready – furniture, artwork, scenting & AV setup" },
//   { serialNo: 35, category: "Public Areas", department: "Engineering", checklistItem: "Elevators commissioned with valid certification" },
//   { serialNo: 36, category: "Public Areas", department: "Engineering", checklistItem: "Escalators (if applicable) commissioned" },
//   { serialNo: 37, category: "Public Areas", department: "Housekeeping", checklistItem: "Corridors fully furnished & lit" },
//   { serialNo: 38, category: "Public Areas", department: "Engineering", checklistItem: "Swimming pool water quality tested & certified" },
//   { serialNo: 39, category: "Public Areas", department: "Engineering", checklistItem: "Gym equipment installed & tested" },
//   { serialNo: 40, category: "Public Areas", department: "Engineering", checklistItem: "Spa/wellness area ready for operation" },

//   // F&B - Food & Beverage
//   { serialNo: 41, category: "F&B", department: "Engineering", checklistItem: "Kitchen equipment commissioned & tested" },
//   { serialNo: 42, category: "F&B", department: "Engineering", checklistItem: "Walk-in chillers & freezers temperature verified" },
//   { serialNo: 43, category: "F&B", department: "Engineering", checklistItem: "Exhaust hoods & ventilation balanced" },
//   { serialNo: 44, category: "F&B", department: "Housekeeping", checklistItem: "Restaurant furniture & décor complete" },
//   { serialNo: 45, category: "F&B", department: "Housekeeping", checklistItem: "Bar setup & equipment ready" },
//   { serialNo: 46, category: "F&B", department: "Hotel Admin", checklistItem: "FSSAI license obtained" },
//   { serialNo: 47, category: "F&B", department: "Hotel Admin", checklistItem: "Liquor license obtained" },
//   { serialNo: 48, category: "F&B", department: "Housekeeping", checklistItem: "Banquet halls ready – AV, lighting, furniture" },
//   { serialNo: 49, category: "F&B", department: "Housekeeping", checklistItem: "Room service setup & equipment ready" },

//   // Back of House
//   { serialNo: 50, category: "Back of House", department: "HR", checklistItem: "Staff cafeteria ready & operational" },
//   { serialNo: 51, category: "Back of House", department: "HR", checklistItem: "Locker rooms & washrooms ready" },
//   { serialNo: 52, category: "Back of House", department: "HR", checklistItem: "Staff uniform distribution complete" },
//   { serialNo: 53, category: "Back of House", department: "Housekeeping", checklistItem: "Laundry equipment commissioned" },
//   { serialNo: 54, category: "Back of House", department: "Housekeeping", checklistItem: "Linen & uniform storage organized" },
//   { serialNo: 55, category: "Back of House", department: "Engineering", checklistItem: "Loading dock & service areas functional" },
//   { serialNo: 56, category: "Back of House", department: "Housekeeping", checklistItem: "Waste management & garbage room ready" },
//   { serialNo: 57, category: "Back of House", department: "Engineering", checklistItem: "Central stores organized & stocked" },

//   // IT & Systems
//   { serialNo: 58, category: "IT & Systems", department: "IT", checklistItem: "PMS (Property Management System) configured & tested" },
//   { serialNo: 59, category: "IT & Systems", department: "IT", checklistItem: "POS system integration complete" },
//   { serialNo: 60, category: "IT & Systems", department: "IT", checklistItem: "Channel manager & booking engine connected" },
//   { serialNo: 61, category: "IT & Systems", department: "IT", checklistItem: "Guest WiFi network configured & tested" },
//   { serialNo: 62, category: "IT & Systems", department: "IT", checklistItem: "Staff network & internal systems operational" },
//   { serialNo: 63, category: "IT & Systems", department: "IT", checklistItem: "IPTV system configured with content" },
//   { serialNo: 64, category: "IT & Systems", department: "IT", checklistItem: "Telephone system (EPABX) commissioned" },
//   { serialNo: 65, category: "IT & Systems", department: "IT", checklistItem: "BMS (Building Management System) integration complete" },
//   { serialNo: 66, category: "IT & Systems", department: "IT", checklistItem: "Digital signage & displays configured" },
//   { serialNo: 67, category: "IT & Systems", department: "IT", checklistItem: "Payment gateway integration tested" },

//   // Hotel Admin & Compliance
//   { serialNo: 68, category: "Public Areas", department: "Hotel Admin", checklistItem: "Occupancy Certificate obtained" },
//   { serialNo: 69, category: "Public Areas", department: "Hotel Admin", checklistItem: "Trade license obtained" },
//   { serialNo: 70, category: "Public Areas", department: "Hotel Admin", checklistItem: "Tourism department registration complete" },
//   { serialNo: 71, category: "Public Areas", department: "Hotel Admin", checklistItem: "Police registration for foreigners complete" },
//   { serialNo: 72, category: "Public Areas", department: "Hotel Admin", checklistItem: "PCB (Pollution Control Board) consent obtained" },
//   { serialNo: 73, category: "Public Areas", department: "Hotel Admin", checklistItem: "Lift NOC & safety certificate obtained" },
//   { serialNo: 74, category: "Public Areas", department: "Hotel Admin", checklistItem: "Insurance policies in place (fire, liability, etc.)" },

//   // HR & Training
//   { serialNo: 75, category: "Back of House", department: "HR", checklistItem: "All department heads hired & onboarded" },
//   { serialNo: 76, category: "Back of House", department: "HR", checklistItem: "All staff hired as per manning guide" },
//   { serialNo: 77, category: "Back of House", department: "HR", checklistItem: "Brand standards training completed" },
//   { serialNo: 78, category: "Back of House", department: "HR", checklistItem: "Department-specific SOPs training done" },
//   { serialNo: 79, category: "Back of House", department: "HR", checklistItem: "Emergency response training completed" },
//   { serialNo: 80, category: "Back of House", department: "HR", checklistItem: "Cross-training between departments done" },
// ];

const questions = [
  {
    serialNo: 1,
    category: "Security",
    department: "Engineering",
    keyWords: [
      "Fire Alarm"
    ],
    checklistItem: "Fire alarm & detection system commissioned",
    importance: "High",
    scoring: 3.5
  },
  {
    serialNo: 2,
    category: "Security",
    department: "Engineering",
    keyWords: [
      "Sprinkler",
      "Hydrant"
    ],
    checklistItem: "Sprinkler, hydrant & hose reel systems pressure-tested",
    importance: "High",
    scoring: 2.5
  },
  {
    serialNo: 3,
    category: "Security",
    department: "Engineering",
    keyWords: [
      "Kitchen Hood"
    ],
    checklistItem: "Kitchen hood fire suppression (ANSUL/FM200) installed",
    importance: "High",
    scoring: 3.0
  },
  {
    serialNo: 4,
    category: "Security",
    department: "Engineering",
    keyWords: [
      "Fire  Signages"
    ],
    checklistItem: "Fire exits, fire doors & emergency signage verified",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 5,
    category: "Security",
    department: "Hotel Admin",
    keyWords: [
      "Fire Noc"
    ],
    checklistItem: "Fire NOC received",
    importance: "Very High ",
    scoring: 4.0
  },
  {
    serialNo: 6,
    category: "Security",
    department: "HR",
    keyWords: [
      "Fire Drills"
    ],
    checklistItem: "Fire drills conducted with all staff",
    importance: "Med",
    scoring: 0.5
  },
  {
    serialNo: 7,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Main Electrical Panels"
    ],
    checklistItem: "Main electrical panels, breakers & DG load test completed",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 8,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "HVAC Commissioning"
    ],
    checklistItem: "HVAC/VRV commissioning & balancing completed",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 9,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Hot Water System"
    ],
    checklistItem: "Heat pump, hot water system & plumbing tested",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 10,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "WTP",
      "RO"
    ],
    checklistItem: "WTP/RO results approved & pressure-tested",
    importance: "Low",
    scoring: 0.5
  },
  {
    serialNo: 11,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "STP",
      "ETP"
    ],
    checklistItem: "STP/ETP fully commissioned & functional",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 12,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Gas Bank"
    ],
    checklistItem: "Gas bank & manifold system commissioned",
    importance: "Med",
    scoring: 2.0
  },
  {
    serialNo: 13,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Kitchen Exhaust"
    ],
    checklistItem: "Kitchen exhaust, scrubbers & ducting tested",
    importance: "Low",
    scoring: 0.5
  },
  {
    serialNo: 14,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Facade",
      "Signange"
    ],
    checklistItem: "Facade, external lighting & signage installation complete",
    importance: "Med",
    scoring: 2.0
  },
  {
    serialNo: 15,
    category: "Engineering",
    department: "Engineering",
    keyWords: [
      "Landscaping"
    ],
    checklistItem: "Landscaping & irrigation functional",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 16,
    category: "Security",
    department: "Security",
    keyWords: [
      "Main Gate",
      "Driveway"
    ],
    checklistItem: "Main gate, driveway & boom barrier tested",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 17,
    category: "Guest Areas ",
    department: "Hotel Admin",
    keyWords: [
      "Rooms -Snag-Free"
    ],
    checklistItem: "All rooms snag-free & deep cleaned, Approved by GM ",
    importance: "High",
    scoring: 4.0
  },
  {
    serialNo: 18,
    category: "Guest Areas ",
    department: "Engineering",
    keyWords: [
      "Lighting"
    ],
    checklistItem: "Room lighting, HVAC & plumbing tested",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 19,
    category: "Guest Areas ",
    department: "IT",
    keyWords: [
      "RFID"
    ],
    checklistItem: "RFID/mobile key access & TV mapping completed",
    importance: "High",
    scoring: 3.0
  },
  {
    serialNo: 20,
    category: "Housekeeping",
    department: "Housekeeping",
    keyWords: [
      "Linen"
    ],
    checklistItem: "All linens & amenities stocked (3 par) including minibars",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 21,
    category: "Guest Areas ",
    department: "Front Office",
    keyWords: [
      "Lobby Readiness"
    ],
    checklistItem: "Lobby fully ready – furniture, scenting & AV",
    importance: "Med",
    scoring: 2.0
  },
  {
    serialNo: 22,
    category: "Guest Areas ",
    department: "Security",
    keyWords: [
      "Parking demarcation"
    ],
    checklistItem: "Parking demarcation for guest & staff areas",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 23,
    category: "Security",
    department: "Security",
    keyWords: [
      "CCTV"
    ],
    checklistItem: "CCTV installed with 30-day recording backup",
    importance: "Very High ",
    scoring: 3.0
  },
  {
    serialNo: 24,
    category: "F&B",
    department: "Kitchen",
    keyWords: [
      "Kitchen Load"
    ],
    checklistItem: "All kitchens commissioned with full load testing",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 25,
    category: "F&B",
    department: "Engineering",
    keyWords: [
      "Cold rooms"
    ],
    checklistItem: "Cold rooms & freezers tested for temperature stability",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 26,
    category: "F&B",
    department: "Culinary",
    keyWords: [
      "Recipie"
    ],
    checklistItem: "Menu engineering & recipe costing finalized",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 27,
    category: "F&B",
    department: "Culinary",
    keyWords: [
      "Menus"
    ],
    checklistItem: "**All menus finalized for all outlets & IRD**",
    importance: "High",
    scoring: 3.0
  },
  {
    serialNo: 28,
    category: "F&B",
    department: "IT",
    keyWords: [
      "POS"
    ],
    checklistItem: "POS installed & functional in all F&B outlets",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 29,
    category: "F&B",
    department: "F&B",
    keyWords: [
      "Outlets"
    ],
    checklistItem: "Buffet counters, bar setup & par stock ready",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 30,
    category: "F&B",
    department: "F&B",
    keyWords: [
      "FSSAI"
    ],
    checklistItem: "Food safety audit completed & FSSAI compliance verified",
    importance: "Very High ",
    scoring: 5.0
  },
  {
    serialNo: 31,
    category: "HR",
    department: "HR",
    keyWords: [
      "Recruitment"
    ],
    checklistItem: "Manpower hiring completed ",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 32,
    category: "HR",
    department: "HR",
    keyWords: [
      "BOH readiness"
    ],
    checklistItem: "Uniforms issued; Employee restaurant, Admin offices lockers & washrooms ready",
    importance: "High",
    scoring: 3.0
  },
  {
    serialNo: 33,
    category: "HR",
    department: "HR",
    keyWords: [
      "Induction",
      "Sop"
    ],
    checklistItem: "Induction, SOP  training , Departmentwise completed for Team members Joined 15 days before ",
    importance: "Low",
    scoring: 0.5
  },
  {
    serialNo: 34,
    category: "Security",
    department: "Security",
    keyWords: [
      "Visitor",
      "Contractor"
    ],
    checklistItem: "Visitor|contractor management system operational",
    importance: "Low",
    scoring: 0.5
  },
  {
    serialNo: 35,
    category: "Security",
    department: "Security",
    keyWords: [
      "Baggage Scanner"
    ],
    checklistItem: "Baggage scanner, HHMD & screening systems tested",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 36,
    category: "Security",
    department: "Security",
    keyWords: [
      "Security"
    ],
    checklistItem: "Security control room fully operational",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 37,
    category: "IT",
    department: "IT",
    keyWords: [
      "Server Room"
    ],
    checklistItem: "Server room operational with redundancy",
    importance: "High",
    scoring: 2.0
  },
  {
    serialNo: 38,
    category: "IT",
    department: "IT",
    keyWords: [
      "IDS"
    ],
    checklistItem: "PMS/IDS integrated with booking engine",
    importance: "High",
    scoring: 2.5
  },
  {
    serialNo: 39,
    category: "IT",
    department: "IT",
    keyWords: [
      "Wi-Fi",
      "Epabx"
    ],
    checklistItem: "Wi-Fi, EPABX & telephone tested property-wide",
    importance: "High",
    scoring: 3.0
  },
  {
    serialNo: 40,
    category: "IT",
    department: "IT",
    keyWords: [
      "CUG"
    ],
    checklistItem: "All CUG numbers activated & reachable",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 41,
    category: "Marketing",
    department: "Marketing",
    keyWords: [
      "Photography",
      "Videography"
    ],
    checklistItem: "Professional hotel photography |Videography  completed",
    importance: "Very High ",
    scoring: 3.5
  },
  {
    serialNo: 42,
    category: "Marketing",
    department: "Marketing",
    keyWords: [
      "Distribution"
    ],
    checklistItem: "Website updated; OTA content, rates & inventory loaded",
    importance: "Very High ",
    scoring: 3.5
  },
  {
    serialNo: 43,
    category: "Marketing",
    department: "Marketing",
    keyWords: [
      "Launch Plan"
    ],
    checklistItem: "Marketing launch plan & annual plan  approved",
    importance: "High",
    scoring: 1.5
  },
  {
    serialNo: 44,
    category: "Housekeeping",
    department: "Laundry ",
    keyWords: [
      "Laundry"
    ],
    checklistItem: "Laundry fully functional; machines & chemicals ready",
    importance: "High",
    scoring: 1.5
  },
  {
    serialNo: 45,
    category: "Housekeeping",
    department: "Housekeeping",
    keyWords: [
      "Floor Pantries"
    ],
    checklistItem: "Floor pantries fully stocked",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 46,
    category: "Finance",
    department: "Finance",
    keyWords: [
      "Vendor Contracts"
    ],
    checklistItem: "Vendor contracts & service agreements completed",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 47,
    category: "Finance",
    department: "Finance",
    keyWords: [
      "Budget"
    ],
    checklistItem: "First Year Budget Approved by the commerical Team ",
    importance: "High",
    scoring: 2.5
  },
  {
    serialNo: 48,
    category: "Finance",
    department: "Finance",
    keyWords: [
      "Licence & Insurance"
    ],
    checklistItem: "Statutory license folder compiled & verified & All listed Insurances applied and received ",
    importance: "Very High ",
    scoring: 6.0
  },
  {
    serialNo: 49,
    category: "Guest Areas ",
    department: "Engineering",
    keyWords: [
      "Recreation"
    ],
    checklistItem: "Gym equipment installed & tested,Kids Area fully operational  , Spa ready for operation",
    importance: "Med",
    scoring: 1.0
  },
  {
    serialNo: 50,
    category: "Guest Areas ",
    department: "Hotel Admin",
    keyWords: [
      "Trial Run"
    ],
    checklistItem: "Full guest journey Mock up (Arrival Experience ,Turn Down Amenity, Local Tour Experiences )",
    importance: "Very High ",
    scoring: 3.5
  }
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
    // Create department if it doesn't exist
    if (!departmentRecords[q.department]) {
      const dept = await prisma.department.create({
        data: { name: q.department },
      });
      departmentRecords[q.department] = dept.id;
    }
    
    // Create category if it doesn't exist
    if (!categoryRecords[q.category]) {
      const cat = await prisma.category.create({
        data: { name: q.category },
      });
      categoryRecords[q.category] = cat.id;
    }
    
    await prisma.question.create({
      data: {
        serialNo: q.serialNo,
        checklistItem: q.checklistItem,
        categoryId: categoryRecords[q.category],
        departmentId: departmentRecords[q.department],
        keyWords: q.keyWords,
        importance: q.importance,
        scoring: q.scoring,
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

