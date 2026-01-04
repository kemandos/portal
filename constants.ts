import { Resource } from './types';

// --- Shared Definitions to ensure consistency across views ---

// Allocation Helpers (Converted to PT: 160h = 20pt)
const ALLOC_OPTIMAL = { pt: 20, capacity: 20, status: 'optimal' as const };
const ALLOC_BALANCED = { pt: 15, capacity: 20, status: 'optimal' as const };
const ALLOC_UNDER = { pt: 10, capacity: 20, status: 'under' as const };
const ALLOC_EMPTY = { pt: 0, capacity: 20, status: 'empty' as const };

// Shared Projects
const PROJECT_CLOUD = { id: 'p1', name: 'Cloud Migration', subtext: 'Strategic Accounts • Cloud Lift', type: 'project' as const, initials: 'CM', status: 'Active' as const, avatar: 'https://cdn-icons-png.flaticon.com/128/2331/2331895.png', manager: 'Alice Wong' };
const PROJECT_ANDROID = { id: 'p2', name: 'Android App V2', subtext: 'Mobile Revamp • Active', type: 'project' as const, initials: 'AA', status: 'Active' as const, avatar: 'https://cdn-icons-png.flaticon.com/128/888/888859.png', manager: 'David Kim' };
const PROJECT_MAPS = { id: 'p3', name: 'Maps API Integration', subtext: 'Tech Stack • Critical', type: 'project' as const, initials: 'MA', status: 'At Risk' as const, avatar: 'https://cdn-icons-png.flaticon.com/128/684/684908.png', manager: 'Alice Wong' };
const PROJECT_STOREFRONT = { id: 'p4', name: 'Storefront Redesign', subtext: 'Holiday Prep • Planned', type: 'project' as const, initials: 'SR', status: 'Planning' as const, avatar: 'https://cdn-icons-png.flaticon.com/128/3144/3144456.png', manager: 'Sarah Jenkins' };
const PROJECT_MARKETING = { id: 'p5', name: 'Redesign - Q3 Marketing', subtext: 'Marketing • High Priority', type: 'project' as const, initials: 'RM', status: 'Active' as const, color: 'bg-rose-500', avatar: 'https://cdn-icons-png.flaticon.com/128/1998/1998087.png', manager: 'David Kim' };
const PROJECT_ALPHA = { id: 'p6', name: 'Alpha: Platform Revamp', subtext: 'Infrastructure', type: 'project' as const, initials: 'AP', status: 'Active' as const, color: 'bg-blue-500', avatar: 'https://cdn-icons-png.flaticon.com/128/8327/8327883.png', manager: 'Mike Ross' };
const PROJECT_BETA = { id: 'p7', name: 'Beta: Mobile API', subtext: 'API Team', type: 'project' as const, initials: 'BM', status: 'Active' as const, color: 'bg-orange-500', avatar: 'https://cdn-icons-png.flaticon.com/128/8017/8017833.png', manager: 'Mike Ross' };

// Shared Employees
// Departments: Engineering, Reporting, Project Management, Management
const EMP_JANE = { id: 'e1', name: 'Jane Doe', subtext: 'Senior Data Engineer', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', status: 'Active' as const, manager: 'David Kim', department: 'Engineering', skills: ['React', 'Node.js', 'Typescript'] };
const EMP_JOHN = { id: 'e2', name: 'John Smith', subtext: 'Data Engineer', type: 'employee' as const, initials: 'JS', status: 'Active' as const, manager: 'David Kim', department: 'Engineering', skills: ['Python', 'SQL', 'AWS'] };
const EMP_MIKE = { id: 'e6', name: 'Mike Ross', subtext: 'Junior Data Engineer', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', status: 'Active' as const, manager: 'David Kim', department: 'Engineering', skills: ['Java', 'Spring', 'Docker'] };

const EMP_ALICE = { id: 'e3', name: 'Alice Wong', subtext: 'Senior Data Consultant', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d', status: 'Active' as const, manager: 'David Kim', department: 'Reporting', skills: ['Tableau', 'Looker', 'Analytics'] };
const EMP_SARAH = { id: 'e5', name: 'Sarah Jenkins', subtext: 'Data Consultant', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024e', status: 'Active' as const, manager: 'David Kim', department: 'Reporting', skills: ['PowerBI', 'SQL', 'Excel'] };

const EMP_BOB = { id: 'e4', name: 'Bob Miller', subtext: 'Senior Project Manager', type: 'employee' as const, initials: 'BM', status: 'Active' as const, manager: 'David Kim', department: 'Project Management', skills: ['Agile', 'JIRA', 'Scrum'] };

const EMP_DAVID = { id: 'e7', name: 'David Kim', subtext: 'Managing Consultant', type: 'employee' as const, initials: 'DK', status: 'Active' as const, manager: 'CEO', department: 'Management', skills: ['Strategy', 'Leadership', 'Sales'] };

export const MONTHS = ["Jan '24", "Feb '24", "Mar '24", "Apr '24", "May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24"];

// --- Mock Data Construction ---

export const MOCK_PROJECTS: Resource[] = [
  {
    id: 'f1', name: 'Dealfolder: Strategic Accounts', subtext: '3 Projects', type: 'project', allocations: {}, isExpanded: true,
    children: [
        {
            ...PROJECT_CLOUD,
            isExpanded: true,
            allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL, "Apr '24": ALLOC_OPTIMAL, "May '24": ALLOC_UNDER, "Jun '24": ALLOC_UNDER },
            children: [
                { ...EMP_SARAH, role: 'Data Consultant', subtext: 'Data Consultant', allocations: { "Jan '24": { pt: 10, capacity: 20, status: 'optimal' }, "Feb '24": { pt: 10, capacity: 20, status: 'optimal' }, "Mar '24": { pt: 20, capacity: 20, status: 'optimal' } } },
                { ...EMP_BOB, role: 'Senior Project Manager', subtext: 'Senior Project Manager', allocations: { "Jan '24": { pt: 5, capacity: 20, status: 'optimal' }, "Feb '24": { pt: 5, capacity: 20, status: 'optimal' } } }
            ]
        },
        {
            ...PROJECT_MARKETING, // Redesign - Q3 Marketing
            isExpanded: false,
            allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL },
            children: [
                 { ...EMP_ALICE, role: 'Senior Data Consultant', subtext: 'Senior Data Consultant', allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL } }
            ]
        },
        {
             ...PROJECT_MAPS,
             allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL }
        }
    ]
  },
  {
    id: 'f2', name: 'Dealfolder: Mobile & Web', subtext: '4 Projects', type: 'project', allocations: {}, isExpanded: false,
    children: [
        { ...PROJECT_ANDROID, allocations: {}, children: [{...EMP_JANE, role: 'Senior Data Engineer', subtext: 'Senior Data Engineer', allocations: {"Jan '24": ALLOC_OPTIMAL}}] },
        { ...PROJECT_ALPHA, allocations: {}, children: [{...EMP_JANE, role: 'Senior Data Engineer', subtext: 'Senior Data Engineer', allocations: {"Jan '24": {pt: 10, capacity: 20, status: 'optimal'}}}] },
        { ...PROJECT_BETA, allocations: {}, children: [{...EMP_JANE, role: 'Senior Data Engineer', subtext: 'Senior Data Engineer', allocations: {"Jan '24": {pt: 10, capacity: 20, status: 'optimal'}}}] },
        { ...PROJECT_STOREFRONT, allocations: {}, children: [] }
    ]
  }
];

export const MOCK_PEOPLE: Resource[] = [
    {
        id: 'g1', name: 'Engineering', subtext: '3 Members', type: 'group', isExpanded: true, allocations: {},
        children: [
            {
                ...EMP_JANE,
                isExpanded: true,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL, "Apr '24": ALLOC_OPTIMAL, "May '24": ALLOC_UNDER },
                children: [
                    { ...PROJECT_ALPHA, allocations: { "Jan '24": { pt: 10, capacity: 0, status: 'optimal' } } },
                    { ...PROJECT_BETA, allocations: { "Jan '24": { pt: 5, capacity: 0, status: 'optimal' } } },
                    { ...PROJECT_ANDROID, color: 'bg-green-500', allocations: { "Jan '24": { pt: 5, capacity: 0, status: 'optimal' } } }
                ]
            },
            {
                ...EMP_JOHN,
                isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL },
                children: [
                     { ...PROJECT_MAPS, color: 'bg-purple-500', allocations: { "Jan '24": ALLOC_OPTIMAL } }
                ]
            },
            {
                ...EMP_MIKE,
                isExpanded: false,
                allocations: { "Jan '24": {pt: 5, capacity: 20, status: 'optimal'} },
                children: [
                    { ...PROJECT_CLOUD, color: 'bg-cyan-500', allocations: { "Jan '24": {pt: 5, capacity: 0, status: 'optimal'} } }
                ]
            }
        ]
    },
    {
        id: 'g2', name: 'Reporting', subtext: '2 Members', type: 'group', isExpanded: true, allocations: {},
        children: [
            {
                ...EMP_ALICE,
                isExpanded: true,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_UNDER },
                children: [
                    { ...PROJECT_MARKETING, allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": {pt: 12.5, capacity: 0, status: 'under'} } }
                ]
            },
            {
                ...EMP_SARAH,
                isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL },
                children: [
                    { ...PROJECT_CLOUD, color: 'bg-cyan-500', allocations: { "Jan '24": {pt: 10, capacity: 0, status: 'optimal'} } }
                ]
            }
        ]
    },
    {
        id: 'g3', name: 'Project Management', subtext: '1 Member', type: 'group', isExpanded: true, allocations: {},
        children: [
            {
                ...EMP_BOB,
                isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL },
                children: [
                    { ...PROJECT_STOREFRONT, color: 'bg-indigo-500', allocations: { "Jan '24": ALLOC_OPTIMAL } }
                ]
            }
        ]
    },
    {
        id: 'g4', name: 'Management', subtext: '1 Member', type: 'group', isExpanded: true, allocations: {},
        children: [
             {
                 ...EMP_DAVID,
                 isExpanded: false,
                 allocations: { "Jan '24": ALLOC_OPTIMAL },
                 children: []
            }
        ]
    }
];