import { connectDB, disconnectDB } from '../config/db.js';
import { Ticket, type TicketPriority, type TicketStatus } from '../models/Ticket.js';
import { User, type UserRole } from '../models/User.js';

const DEFAULT_PASSWORD = 'Password@123';

const SEED_USERS: Array<{ name: string; email: string; password: string; role: UserRole }> = [
  { name: 'Admin User', email: 'admin@test.com', password: DEFAULT_PASSWORD, role: 'admin' },
  { name: 'Support Agent', email: 'agent@test.com', password: DEFAULT_PASSWORD, role: 'agent' },
  {
    name: 'Employee One',
    email: 'employee1@test.com',
    password: DEFAULT_PASSWORD,
    role: 'employee',
  },
  {
    name: 'Employee Two',
    email: 'employee2@test.com',
    password: DEFAULT_PASSWORD,
    role: 'employee',
  },
];

interface SampleTicketTemplate {
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  ownerEmail: 'employee1@test.com' | 'employee2@test.com';
  assignToAgent: boolean;
  comments?: Array<{ by: 'owner' | 'agent'; text: string }>;
}

const SAMPLE_TICKETS: SampleTicketTemplate[] = [
  {
    title: 'VPN drops every 15 minutes on macOS',
    description: 'Corporate VPN disconnects repeatedly when switching between Wi-Fi access points.',
    priority: 'high',
    status: 'open',
    ownerEmail: 'employee1@test.com',
    assignToAgent: false,
    comments: [
      { by: 'owner', text: 'Happened three times again during this morning standup.' },
    ],
  },
  {
    title: 'Unable to access payroll portal',
    description: 'Receiving a 403 permission error after resetting my SSO password this morning.',
    priority: 'high',
    status: 'in_progress',
    ownerEmail: 'employee1@test.com',
    assignToAgent: true,
    comments: [
      { by: 'agent', text: 'Investigating your SSO group sync with HR.' },
      { by: 'owner', text: 'Thanks! Let me know if I should re-login.' },
    ],
  },
  {
    title: 'Request second monitor for workstation',
    description: 'Need a 27-inch external display for reviewing large analytics dashboards.',
    priority: 'low',
    status: 'open',
    ownerEmail: 'employee1@test.com',
    assignToAgent: false,
  },
  {
    title: 'Slack desktop notifications delayed',
    description: 'Desktop notifications arrive 5 to 10 minutes late while mobile alerts arrive instantly.',
    priority: 'medium',
    status: 'resolved',
    ownerEmail: 'employee1@test.com',
    assignToAgent: true,
    comments: [
      { by: 'agent', text: 'Cleared desktop cache and enabled background refresh. Issue resolved.' },
    ],
  },
  {
    title: 'Printer on 3rd floor jamming paper',
    description: 'LaserJet Pro in the north wing jams on every double-sided print job.',
    priority: 'low',
    status: 'closed',
    ownerEmail: 'employee1@test.com',
    assignToAgent: true,
  },
  {
    title: 'Laptop battery draining rapidly',
    description: 'Battery drops from 100% to 15% within 90 minutes even with low brightness.',
    priority: 'medium',
    status: 'open',
    ownerEmail: 'employee2@test.com',
    assignToAgent: false,
  },
  {
    title: 'Cannot clone internal Git repositories',
    description: 'SSH key authentication fails with permission denied after laptop migration.',
    priority: 'high',
    status: 'in_progress',
    ownerEmail: 'employee2@test.com',
    assignToAgent: true,
    comments: [
      { by: 'agent', text: 'Please share your public key fingerprint so I can verify your profile.' },
      { by: 'owner', text: 'Sent via internal chat—waiting for confirmation.' },
    ],
  },
  {
    title: 'Need Figma license added to account',
    description: 'Joined the product design review squad and need editor access in Figma.',
    priority: 'medium',
    status: 'resolved',
    ownerEmail: 'employee2@test.com',
    assignToAgent: true,
  },
  {
    title: 'Conference room HDMI adapter missing',
    description: 'Room B4 USB-C to HDMI dongle is missing before client demo tomorrow.',
    priority: 'medium',
    status: 'open',
    ownerEmail: 'employee2@test.com',
    assignToAgent: false,
  },
  {
    title: 'Update office Wi-Fi guest certificate',
    description: 'Guest network certificate expired on iOS devices used by visiting contractors.',
    priority: 'low',
    status: 'closed',
    ownerEmail: 'employee2@test.com',
    assignToAgent: true,
  },
];

async function seed(): Promise<void> {
  try {
    await connectDB();
    await Promise.all([Ticket.deleteMany({}), User.deleteMany({})]);

    const createdUsers = await User.create(SEED_USERS);
    const userByEmail = new Map(createdUsers.map((u) => [u.email, u]));

    const agent = userByEmail.get('agent@test.com');
    const now = Date.now();

    const ticketDocs = SAMPLE_TICKETS.map((item, idx) => {
      const owner = userByEmail.get(item.ownerEmail);
      if (!owner) {
        throw new Error(`Missing seeded user ${item.ownerEmail}`);
      }
      const createdAt = new Date(now - (SAMPLE_TICKETS.length - idx) * 3_600_000);
      const comments = (item.comments ?? []).map((c, cIdx) => ({
        text: c.text,
        author: c.by === 'agent' && agent ? agent._id : owner._id,
        createdAt: new Date(createdAt.getTime() + (cIdx + 1) * 600_000),
      }));

      return {
        title: item.title,
        description: item.description,
        priority: item.priority,
        status: item.status,
        createdBy: owner._id,
        assignedTo: item.assignToAgent && agent ? agent._id : null,
        comments,
        createdAt,
        updatedAt: createdAt,
      };
    });

    const createdTickets = await Ticket.create(ticketDocs);

    console.log('\nSeeded users:');
    console.table(
      createdUsers.map((u) => ({
        name: u.name,
        email: u.email,
        role: u.role,
        password: DEFAULT_PASSWORD,
      })),
    );
    console.log(`Seeded ${createdTickets.length} sample tickets across employee1 and employee2.`);
  } finally {
    await disconnectDB();
  }
}

void seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
