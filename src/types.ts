import { Users, Award, Lightbulb, Smile, Heart, Users2 } from 'lucide-react';

export interface Reaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface Vibe {
  id: string;
  message: string;
  sender: string;
  recipient: string;
  createdAt: Date;
  category?: string;
  personalMessage?: string;
  recipientName?: string | null;
  recipientDepartment?: string | null;
  recipientAvatar?: string | null;
  senderName?: string | null;
  senderDepartment?: string | null;
  senderAvatar?: string | null;
  templateId?: string | null;
  reactions?: Reaction[];
}

export interface CardTemplate {
  id: string;
  Excellence?: string;
  Leadership?: string;
  Positivity?: string;
  "Showing up"?: string;
  "Team Player"?: string;
}

export type CategoryType = "All" | "Excellence" | "Leadership" | "Positivity" | "Showing up" | "Team Player";

export const categoryColors: Record<CategoryType, string> = {
  "All": "bg-gray-800 text-white",
  "Excellence": "bg-indigo-100 text-indigo-800",
  "Leadership": "bg-orange-100 text-orange-800",
  "Positivity": "bg-yellow-100 text-yellow-800",
  "Showing up": "bg-blue-100 text-blue-800",
  "Team Player": "bg-emerald-100 text-emerald-800"
};

export const categoryBackgroundColors: Record<CategoryType, string> = {
  "All": "bg-white",
  "Excellence": "bg-indigo-200",
  "Leadership": "bg-orange-200",
  "Positivity": "bg-yellow-200",
  "Showing up": "bg-blue-200",
  "Team Player": "bg-emerald-200"
};

export const categoryIcons: Record<CategoryType, React.ElementType> = {
  "All": Users,
  "Excellence": Award,
  "Leadership": Lightbulb,
  "Positivity": Smile,
  "Showing up": Heart,
  "Team Player": Users2
};

export const EMOJI_REACTIONS = [
  { emoji: "❤️", label: "heart" },
  { emoji: "😍", label: "heart eyes" },
  { emoji: "🙏", label: "pray" },
  { emoji: "🤩", label: "star eyes" },
  { emoji: "😂", label: "joy" }
];

export type Location = "Malang" | "Lima" | "Kyiv" | "Copenhagen";

export const LOCATIONS: Location[] = ["Malang", "Lima", "Kyiv", "Copenhagen"];

export const DEPARTMENTS = [
  "CSR",
  "Customer Success",
  "Customer Support",
  "Design",
  "Executive",
  "Facilities",
  "Finance",
  "IT",
  "Leadership Team",
  "Marketing",
  "New Business",
  "Office Administration",
  "Office Security",
  "Operation",
  "People Success",
  "Product",
  "Research & Development"
];

export const JOB_TITLES = [
  "Administration and Information System",
  "Asset Lead",
  "Associate Design Manager",
  "Back End Developer",
  "Backend PHP dev",
  "Business Analyst",
  "Business Development Manager",
  "CEO",
  "CSR Partner",
  "Chief Delivery Officer",
  "Chief Impact Officer",
  "Chief Marketing Officer",
  "Chief People Officer",
  "Content Editor",
  "Content Manager",
  "Content Writer",
  "Custom Task Manager",
  "Customer Success Manager",
  "Customer Support",
  "Data Analyst",
  "Data Entry Trainer and Freelance Supervisor",
  "Design Lead",
  "Design Manager",
  "Design Manager RnD",
  "Designer",
  "DevOps Engineer",
  "Engineering manager",
  "English Teacher",
  "Enterprise Business Development Manager",
  "Executive Assistant",
  "Facility Care",
  "Facility Care Capt",
  "Finance & Accounting Business Partner",
  "Finance Manager",
  "Finance Operation Lead",
  "Front-end Developer",
  "Head of Customer Success",
  "Head of Customer Support",
  "Head of Design",
  "Head of People Success, Indonesia",
  "Head of RnD",
  "IT Support & Helpdesk",
  "Inhouse Design Manager",
  "Inhouse Designer",
  "Junior Associate Design Manager",
  "Junior Customer Support",
  "Junior Designer",
  "Junior Graphic Designer",
  "Junior IT Support",
  "Junior Project Manager",
  "Office Administrator",
  "Office Assistant",
  "Ops Lead",
  "Payroll and Cashier Officer",
  "People & Impact Manager",
  "People Development Manager",
  "People Experience Manager",
  "People Success Partner",
  "Product Manager",
  "Product designer",
  "Project Manager",
  "Project Manager Enterprise",
  "QA Engineer",
  "QA Support",
  "Quality Assurance Engineer Lead",
  "Security",
  "Security Capt",
  "Senior Designer",
  "Senior Inhouse Designer",
  "Senior Project Manager",
  "Senior QA Engineer",
  "Smash Junior",
  "Smash Manager",
  "Smash Senior",
  "Support Lead",
  "Talent Acquisition Specialist",
  "Talent Development Manager",
  "Talent Development Specialist",
  "Top Funnel Marketer",
  "UI/UX Designer"
];

export const VIBER_LEVELS = [
  { name: 'Vibe Rookie', requirement: 1, color: 'bg-gray-400' },
  { name: 'Vibe Contender', requirement: 5, color: 'bg-green-400' },
  { name: 'Vibe Hero', requirement: 15, color: 'bg-blue-400' },
  { name: 'Vibe Connoisseur', requirement: 30, color: 'bg-purple-400' },
  { name: 'Vibe Master', requirement: 50, color: 'bg-yellow-400' },
  { name: 'Vibe President', requirement: 75, color: 'bg-pink-400' },
  { name: 'Super Viber', requirement: 100, color: 'bg-red-400' },
  { name: 'Premium Viber', requirement: 150, color: 'bg-indigo-400' },
  { name: 'Vibe Champion', requirement: 200, color: 'bg-orange-400' },
  { name: 'Vibe Legend', requirement: 300, color: 'bg-amber-400' },
  { name: 'Vibe Icon', requirement: 500, color: 'bg-emerald-400' },
  { name: 'Vibe God', requirement: 1000, color: 'bg-violet-400' },
  { name: 'Vibe Eternal', requirement: 2000, color: 'bg-cyan-400' },
  { name: 'Vibe Universe', requirement: 5000, color: 'bg-rose-400' }
];

export interface LeaderboardEntry {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  department?: string;
  count: number;
  level: typeof VIBER_LEVELS[number];
  progress: number;
}

export type TimeFilter = 'all' | 'month' | 'year';

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface TimeFilterState {
  type: TimeFilter;
  selectedMonth?: number;
  selectedYear?: number;
}