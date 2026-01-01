import { Resource } from './types';

// --- Shared Definitions to ensure consistency across views ---

// Allocation Helpers (Converted to PT: 160h = 20pt)
const ALLOC_OPTIMAL = { pt: 20, capacity: 20, status: 'optimal' as const };
const ALLOC_BALANCED = { pt: 15, capacity: 20, status: 'optimal' as const };
const ALLOC_UNDER = { pt: 10, capacity: 20, status: 'under' as const };
const ALLOC_EMPTY = { pt: 0, capacity: 20, status: 'empty' as const };

// Shared Projects
const PROJECT_CLOUD = { id: 'p1', name: 'Cloud Migration', subtext: 'Strategic Accounts • Cloud Lift', type: 'project' as const, initials: 'CM', status: 'Active' as const };
const PROJECT_ANDROID = { id: 'p2', name: 'Android App V2', subtext: 'Mobile Revamp • Active', type: 'project' as const, initials: 'AA', status: 'Active' as const };
const PROJECT_MAPS = { id: 'p3', name: 'Maps API Integration', subtext: 'Tech Stack • Critical', type: 'project' as const, initials: 'MA', status: 'At Risk' as const };
const PROJECT_STOREFRONT = { id: 'p4', name: 'Storefront Redesign', subtext: 'Holiday Prep • Planned', type: 'project' as const, initials: 'SR', status: 'Planning' as const };
const PROJECT_MARKETING = { id: 'p5', name: 'Redesign - Q3 Marketing', subtext: 'Marketing • High Priority', type: 'project' as const, initials: 'RM', status: 'Active' as const, color: 'bg-rose-500' };
const PROJECT_ALPHA = { id: 'p6', name: 'Alpha: Platform Revamp', subtext: 'Infrastructure', type: 'project' as const, initials: 'AP', status: 'Active' as const, color: 'bg-blue-500' };
const PROJECT_BETA = { id: 'p7', name: 'Beta: Mobile API', subtext: 'API Team', type: 'project' as const, initials: 'BM', status: 'Active' as const, color: 'bg-orange-500' };

// Shared Employees
const EMP_JANE = { id: 'e1', name: 'Jane Doe', subtext: 'Senior Dev • London', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d', status: 'Active' as const, manager: 'Alice Wong', department: 'Engineering' };
const EMP_JOHN = { id: 'e2', name: 'John Smith', subtext: 'Tech Lead • Remote', type: 'employee' as const, initials: 'JS', status: 'Active' as const, manager: 'David Kim', department: 'Engineering' };
const EMP_ALICE = { id: 'e3', name: 'Alice Wong', subtext: 'UX Designer • NY', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d', status: 'Active' as const, manager: 'Sarah Jenkins', department: 'Design' };
const EMP_BOB = { id: 'e4', name: 'Bob Miller', subtext: 'Product Mgr • SF', type: 'employee' as const, initials: 'BM', status: 'Active' as const, manager: 'Mike Ross', department: 'Product' };
const EMP_SARAH = { id: 'e5', name: 'Sarah Jenkins', subtext: 'Senior UI • Remote', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024e', status: 'Active' as const, manager: 'Alice Wong', department: 'Design' };
const EMP_MIKE = { id: 'e6', name: 'Mike Ross', subtext: 'Architect', type: 'employee' as const, avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', status: 'Active' as const, manager: 'David Kim', department: 'Engineering' };
const EMP_DAVID = { id: 'e7', name: 'David Kim', subtext: 'Director of Eng', type: 'employee' as const, initials: 'DK', status: 'Active' as const, manager: 'VP Eng', department: 'Engineering' };

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
                { ...EMP_SARAH, allocations: { "Jan '24": { pt: 10, capacity: 20, status: 'optimal' }, "Feb '24": { pt: 10, capacity: 20, status: 'optimal' }, "Mar '24": { pt: 20, capacity: 20, status: 'optimal' } } },
                { ...EMP_MIKE, allocations: { "Jan '24": { pt: 5, capacity: 20, status: 'optimal' }, "Feb '24": { pt: 5, capacity: 20, status: 'optimal' } } }
            ]
        },
        {
            ...PROJECT_MARKETING, // Redesign - Q3 Marketing
            isExpanded: false,
            allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL },
            children: [
                 { ...EMP_ALICE, allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL } }
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
        { ...PROJECT_ANDROID, allocations: {}, children: [{...EMP_JANE, allocations: {"Jan '24": ALLOC_OPTIMAL}}] },
        { ...PROJECT_ALPHA, allocations: {}, children: [{...EMP_JANE, allocations: {"Jan '24": {pt: 10, capacity: 20, status: 'optimal'}}}] },
        { ...PROJECT_BETA, allocations: {}, children: [{...EMP_JANE, allocations: {"Jan '24": {pt: 10, capacity: 20, status: 'optimal'}}}] },
        { ...PROJECT_STOREFRONT, allocations: {}, children: [] }
    ]
  }
];

export const MOCK_PEOPLE: Resource[] = [
    {
        id: 'g1', name: 'Engineering', subtext: '12 Members', type: 'group', isExpanded: true, allocations: {},
        children: [
            {
                ...EMP_JANE,
                skills: ['React', 'Node.js'], isExpanded: true,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL, "Apr '24": ALLOC_OPTIMAL, "May '24": ALLOC_UNDER },
                children: [
                    { ...PROJECT_ALPHA, allocations: { "Jan '24": { pt: 10, capacity: 0, status: 'optimal' } } },
                    { ...PROJECT_BETA, allocations: { "Jan '24": { pt: 5, capacity: 0, status: 'optimal' } } },
                    { ...PROJECT_ANDROID, color: 'bg-green-500', allocations: { "Jan '24": { pt: 5, capacity: 0, status: 'optimal' } } }
                ]
            },
            {
                ...EMP_JOHN,
                skills: ['Java', 'Architecture'], isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_OPTIMAL, "Mar '24": ALLOC_OPTIMAL },
                children: [
                     { ...PROJECT_MAPS, color: 'bg-purple-500', allocations: { "Jan '24": ALLOC_OPTIMAL } }
                ]
            },
            {
                ...EMP_MIKE,
                skills: ['System Design'], isExpanded: false,
                allocations: { "Jan '24": {pt: 5, capacity: 20, status: 'optimal'} },
                children: [
                    { ...PROJECT_CLOUD, color: 'bg-cyan-500', allocations: { "Jan '24": {pt: 5, capacity: 0, status: 'optimal'} } }
                ]
            },
            {
                 ...EMP_DAVID,
                 skills: ['Management'], isExpanded: false,
                 allocations: { "Jan '24": ALLOC_OPTIMAL },
                 children: []
            }
        ]
    },
    {
        id: 'g2', name: 'Design & Product', subtext: '8 Members', type: 'group', isExpanded: true, allocations: {},
        children: [
            {
                ...EMP_ALICE,
                skills: ['Figma', 'UI/UX'], isExpanded: true,
                allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": ALLOC_UNDER },
                children: [
                    // Ensure the 'Redesign - Q3 Marketing' is visible here as well
                    { ...PROJECT_MARKETING, allocations: { "Jan '24": ALLOC_OPTIMAL, "Feb '24": {pt: 12.5, capacity: 0, status: 'under'} } }
                ]
            },
            {
                ...EMP_SARAH,
                skills: ['Visual Design'], isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL },
                children: [
                    { ...PROJECT_CLOUD, color: 'bg-cyan-500', allocations: { "Jan '24": {pt: 10, capacity: 0, status: 'optimal'} } }
                ]
            },
            {
                ...EMP_BOB,
                skills: ['Roadmapping'], isExpanded: false,
                allocations: { "Jan '24": ALLOC_OPTIMAL },
                children: [
                    { ...PROJECT_STOREFRONT, color: 'bg-indigo-500', allocations: { "Jan '24": ALLOC_OPTIMAL } }
                ]
            }
        ]
    }
];