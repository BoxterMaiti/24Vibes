import { Users, Award, Lightbulb, Smile, Heart, Users2 } from 'lucide-react';

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

export interface Colleague {
  id: string;
  name?: string;
  email: string;
  department?: string;
  position?: string;
  "job title"?: string;
  avatar?: string;
  "display name"?: string;
  joined?: string;
  [key: string]: any; // Allow for additional properties
}