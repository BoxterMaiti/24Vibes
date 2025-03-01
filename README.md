# 24Vibes - Anonymous Appreciation Platform

![24Vibes Logo](https://i.postimg.cc/Prm0LcST/24viibes-logo-0-00-00-00.png)

24Vibes is a web application that allows employees to send anonymous appreciation messages to colleagues. It provides a simple, engaging way to foster a positive workplace culture through peer recognition.

## Features

- **Anonymous Appreciation**: Send appreciation cards to colleagues without revealing your identity
- **Categorized Templates**: Choose from various appreciation categories (Excellence, Leadership, Positivity, etc.)
- **User Profiles**: Manage your profile information and preferences
- **Admin Dashboard**: Administrators can manage users and their permissions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Page transitions and interactive elements with Framer Motion

## Tech Stack

- **Frontend Framework**: React 18.3.1 with TypeScript
- **Styling**: Tailwind CSS 3.4.1
- **Routing**: React Router 6.22.3
- **Animations**: Framer Motion 11.0.8
- **Icons**: Lucide React 0.344.0
- **Build Tool**: Vite 5.4.2
- **Database/Auth**: Firebase 10.9.0 (Firestore + Authentication)

## Project Structure

```
/src
  /components - Reusable UI components
  /contexts - React context providers (AuthContext)
  /firebase - Firebase configuration
  /pages - Main application pages
  /services - Service layer for data operations
  /types - TypeScript type definitions
/public - Static assets and configuration files
```

## Database Structure

The application uses Firebase Firestore with the following collections:

### Vibes Collection
Stores all appreciation messages sent between users.

```typescript
{
  id: string;
  message: string;
  sender: string; // Email address
  recipient: string; // Email address
  createdAt: Date;
  category?: string;
  personalMessage?: string;
  recipientName?: string;
  recipientDepartment?: string;
  recipientAvatar?: string;
  templateId?: string;
}
```

### Colleagues Collection
Stores user profile information.

```typescript
{
  id: string;
  name?: string;
  email: string;
  department?: string;
  position?: string;
  avatar?: string;
  "display name"?: string;
  joined?: string;
}
```

### UserColleagues Collection
Maps Firebase user IDs to colleague records.

```typescript
{
  userId: string; // Auth user ID
  colleagueId: string; // Reference to colleagues collection
  email: string;
  isAdmin: "yes" | "no"; // Admin status
  linkedAt: string; // ISO date string
}
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account (for database and authentication)

### Installation

1. Clone the repository
   ```bash
   git clone [repository-url]
   cd 24vibes
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Configure Firebase
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com)
   - Enable Firestore and Authentication (with Google provider)
   - Update the Firebase configuration in `src/firebase/config.ts` with your project credentials

4. Start the development server
   ```bash
   npm run dev
   ```

## Deployment

The project is configured for deployment on Netlify, but can be adapted for other hosting platforms:

1. Build the project
   ```bash
   npm run build
   ```

2. Deploy the `dist` directory to your hosting provider
   - The project includes `netlify.toml` and `public/_redirects` for Netlify configuration
   - Ensure your hosting provider supports client-side routing

## Customization

### Branding

- Update the logo in the `Header` component
- Modify the color scheme in `tailwind.config.js`
- Customize the card templates in `public/Card_templates.json`

### Authentication

The application currently uses Firebase Authentication with Google sign-in. To use a different authentication provider:

1. Update the auth context in `src/contexts/AuthContext.tsx`
2. Implement the required authentication methods

## Migrating to a Different Database

To migrate from Firebase to a different database:

1. Update the service layer in:
   - `src/services/colleagueService.ts`
   - `src/services/vibeService.ts`

2. Ensure your new database implementation supports the same data structure or adapt the application accordingly

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Firebase](https://firebase.google.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)