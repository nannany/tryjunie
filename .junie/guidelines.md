# Project Guidelines

## Project Overview
This is a task management application built with React, TypeScript, and Vite. The application allows users to create, view, and manage tasks through a clean and intuitive interface.

### Key Features
- **Dashboard**: Displays task statistics and recent tasks
- **Task List**: Shows all tasks with filtering and sorting capabilities
- **Task Details**: Provides detailed information about individual tasks
- **Task Creation**: Allows users to create new tasks with various properties

### Technology Stack
- **Frontend Framework**: React with TypeScript
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI and custom components
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Backend Services**: Supabase

## Development Guidelines

### Code Structure
- **src/components**: Reusable UI components
  - **ui/**: Shared UI components (buttons, cards, etc.)
  - **layout/**: Layout components (header, footer, etc.)
- **src/pages**: Page components corresponding to routes
- **src/lib**: Utility functions and shared logic
- **src/hooks**: Custom React hooks
- **src/types**: TypeScript type definitions

### Coding Standards
- Use TypeScript for type safety
- Follow functional component patterns with hooks
- Use named exports for components
- Maintain consistent naming conventions
- Write self-documenting code with appropriate comments
- Implement responsive design using Tailwind CSS

### State Management
- Use React's built-in state management (useState, useContext) for simple state
- Consider using more robust state management for complex state requirements

### Styling Guidelines
- Use Tailwind CSS for styling
- Follow the utility-first approach
- Use the cn utility for conditional class names
- Maintain consistent spacing and layout

### Performance Considerations
- Optimize component rendering with React.memo where appropriate
- Use lazy loading for routes
- Implement proper data fetching strategies

## Workflow

### Development Process
1. Create a new branch for each feature or bug fix
2. Write clean, maintainable code following the guidelines
3. Test thoroughly before submitting a pull request
4. Request code reviews from team members

### Deployment
The application is deployed on Vercel at https://tryjunie.vercel.app/

## Resources
- [React Documentation](https://reactjs.org/docs/getting-started.html)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vite Documentation](https://vitejs.dev/guide/)
- [Radix UI Documentation](https://www.radix-ui.com/docs/primitives/overview/introduction)