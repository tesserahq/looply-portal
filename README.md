<p align="center">
  <img width="200px" src="./public/images/logo-full.png">
  
  <h2 align="center">Looply Portal</h2>
  <p align="center">
    A modern web portal for contact management and waitlist administration
  </p>
</p>

---

## Overview

**Looply Portal** is a modern, responsive web application for managing contacts, organizing them into lists, and handling waitlist workflows. Built with React and Remix, it provides an intuitive user interface with powerful features like advanced search, status tracking, and multi-list organization.

## Features

### 📇 Contact Management

- **Intuitive contact interface**: Clean, modern UI for viewing and managing contact information
- **Advanced search & filtering**: Powerful search capabilities across all contact fields with real-time results
- **Contact forms**: User-friendly forms for adding and editing contact details
- **Contact organization**: Organize contacts by type, status, and custom categories
- **Bulk operations**: Select and manage multiple contacts simultaneously

### 📋 Contact Lists

- **Visual list management**: Create and organize contacts into custom lists with drag-and-drop functionality
- **Interactive member management**: Easy-to-use interface for adding and removing contacts from lists
- **List overview dashboard**: Visual representation of list membership and statistics
- **Quick actions**: Streamlined workflows for common list operations

### ⏳ Waiting Lists

- **Interactive status management**: Visual workflow for managing waiting list members with intuitive status updates
- **Status workflow visualization**: Clear visual indicators for each status:
  - `pending` - Awaiting approval or notification
  - `approved` - Approved for the waitlist
  - `rejected` - Rejected from the waitlist
  - `notified` - Member has been notified
  - `accepted` - Member accepted their spot
  - `declined` - Member declined their spot
  - `active` - Currently active
  - `inactive` - Currently inactive
  - `cancelled` - Cancelled participation
- **Advanced filtering**: Filter and search members by status with real-time updates
- **Bulk status updates**: Select multiple members and update their status simultaneously
- **Timeline view**: Track member history and status changes with visual timeline

### 👤 User Experience

- **Modern authentication**: Seamless login experience with Auth0 integration
- **Responsive design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light themes**: Toggle between themes for comfortable viewing
- **Internationalization**: Multi-language support with i18next
- **Accessibility**: Built with accessibility best practices and keyboard navigation

### 🎨 User Interface Features

- **Modern design system**: Consistent, professional UI built with TailwindCSS and Radix UI
- **Interactive components**: Rich, interactive components for better user engagement
- **Data tables**: Advanced table functionality with sorting, filtering, and pagination
- **Real-time updates**: Live data updates without page refreshes
- **Toast notifications**: User-friendly feedback for actions and errors
- **Loading states**: Smooth loading indicators and skeleton screens
- **Form validation**: Real-time form validation with helpful error messages

## Technology Stack

- **Framework**: Remix (React-based full-stack web framework)
- **Frontend**: React 18 with TypeScript
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI primitives with custom components
- **Authentication**: Auth0 (OAuth 2.0 / OpenID Connect)
- **Validation**: Zod for schema validation
- **Data Tables**: TanStack Table for advanced table functionality
- **Icons**: Lucide React and Font Awesome
- **Build Tool**: Vite with TypeScript
- **Code Quality**: ESLint, Prettier

## Getting Started

### Prerequisites

- **Node.js**: Version 22.21.1
- **Package Manager**: bun 1.3.5

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd looply-portal
   ```

2. **Set up environment variables**

   Create a `.env` file in the root directory with the following variables:

   ```env
   # Auth0 Configuration
   AUTH0_CLIENT_ID=your_auth0_client_id
   AUTH0_DOMAIN=your_auth0_domain
   AUTH0_AUDIENCE=your_auth0_audience
   AUTH0_ORGANIZATION_ID=your_auth0_organization_id

   # Application Configuration
   HOST_URL=http://localhost:3000
   NODE_ENV=development
   API_URL=https://api.example.com
   IDENTIES_API_URL=https://example.com/api
   IDENTIES_HOST=https://example.com/api
   ```

3. **Run the development server**

   ```bash
   bun install
   ```

   ```bash
   bun run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to view the application.

### Run with docker

1. Build the image

   ```bash
   docker build -t looply-portal .
   ```

2. Run the container

   ```bash
   docker run -p 3000:3000 looply-portal:latest
   ```

### Production Build

1. **Build the application**

   ```bash
   bun run build
   ```

2. **Start the production server**
   ```bash
   bun run start
   ```

### Available Scripts

- `dev` - Start the development server
- `build` - Build the application for production
- `start` - Start the production server
- `lint` - Run ESLint for code linting
- `typecheck` - Run TypeScript type checking
- `format` - Format code with Prettier

### Development Notes

- The application uses Vite for fast development builds and hot module replacement
- TypeScript is configured for strict type checking
- ESLint and Prettier are configured for consistent code formatting
- The app includes internationalization support with i18next
- Authentication is handled through Auth0 integration
