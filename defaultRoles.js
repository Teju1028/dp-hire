// server/config/defaultRoles.js
const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();

const defaultJobRoles = [
  {
    id: 'role-python-dev',
    title: 'Python Developer',
    department: 'Software Engineering',
    location: 'Coimbatore, India (On-site / Hybrid)',
    experienceLevel: 'Mid to Senior (3-6 years)',
    minExperienceYears: 3,
    status: 'Active',
    description: 'Looking for a skilled Python developer to build robust backend microservices, data processing pipelines, and AI-enabled workflows at DataPage.',
    version: 1,
    criteria: [
      { id: 'c1', name: 'Python Programming', category: 'Required Skill', weight: 30, description: 'Core Python, async programming, data structures, and best practices' },
      { id: 'c2', name: 'SQL & Database Design', category: 'Required Skill', weight: 20, description: 'PostgreSQL/MySQL, schema design, query optimization, indexing' },
      { id: 'c3', name: 'Machine Learning / AI', category: 'Preferred Skill', weight: 20, description: 'Familiarity with ML frameworks (PyTorch, TensorFlow, Scikit-Learn) or LLM APIs' },
      { id: 'c4', name: 'Communication & Teamwork', category: 'Soft Skill', weight: 10, description: 'Cross-functional collaboration, technical documentation, agile communication' },
      { id: 'c5', name: 'Problem Solving & Algorithms', category: 'Technical Skill', weight: 10, description: 'System design, algorithm optimization, debugging complexity' },
      { id: 'c6', name: 'Education (B.Tech/BE/MCA/M.Sc)', category: 'Education', weight: 10, description: 'Bachelor or Master degree in Computer Science, IT, or related engineering discipline' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-java-dev',
    title: 'Java Developer',
    department: 'Enterprise Solutions',
    location: 'Coimbatore, India',
    experienceLevel: 'Mid-Level (2-5 years)',
    minExperienceYears: 2,
    status: 'Active',
    description: 'Seeking a proficient Java Software Engineer to develop scalable enterprise microservices using Spring Boot and cloud-native architecture.',
    version: 1,
    criteria: [
      { id: 'c1', name: 'Core Java & Multi-threading', category: 'Required Skill', weight: 35, description: 'Java 17+, Concurrency, JVM internals, Collections framework' },
      { id: 'c2', name: 'OOP Concepts & Design Patterns', category: 'Required Skill', weight: 20, description: 'SOLID principles, clean architecture, enterprise design patterns' },
      { id: 'c3', name: 'SQL & Relational Databases', category: 'Required Skill', weight: 15, description: 'Complex queries, transactions, ORM (Hibernate/JPA)' },
      { id: 'c4', name: 'Spring Boot & Microservices', category: 'Technical Skill', weight: 15, description: 'REST APIs, Spring Cloud, Docker, Kafka or MQ' },
      { id: 'c5', name: 'Problem Solving', category: 'Soft Skill', weight: 10, description: 'Troubleshooting production issues, logical reasoning' },
      { id: 'c6', name: 'Education (Degree in CS/IT)', category: 'Education', weight: 5, description: 'B.E / B.Tech / MCA or relevant technical qualification' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'role-frontend-react',
    title: 'Frontend React Developer',
    department: 'UI/UX Engineering',
    location: 'Coimbatore, India',
    experienceLevel: '2-4 years',
    minExperienceYears: 2,
    status: 'Active',
    description: 'Seeking a React frontend specialist with strong TypeScript, modern CSS, and component design skills to create responsive user interfaces.',
    version: 1,
    criteria: [
      { id: 'c1', name: 'React.js & Hooks', category: 'Required Skill', weight: 35, description: 'Custom hooks, state management, performance optimization, React 18+' },
      { id: 'c2', name: 'JavaScript (ES6+) & TypeScript', category: 'Required Skill', weight: 25, description: 'Type safety, async flows, modern DOM APIs' },
      { id: 'c3', name: 'Tailwind CSS & Responsive UI', category: 'Technical Skill', weight: 15, description: 'Modern responsive design, animations, accessible components' },
      { id: 'c4', name: 'REST & GraphQL API Integration', category: 'Technical Skill', weight: 10, description: 'API fetching, error handling, caching' },
      { id: 'c5', name: 'Code Quality & Testing', category: 'Technical Skill', weight: 10, description: 'Unit testing (Vitest/Jest), clean code, Git practices' },
      { id: 'c6', name: 'Education', category: 'Education', weight: 5, description: 'Degree in Engineering or Computer Science' }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

module.exports = { defaultJobRoles };
