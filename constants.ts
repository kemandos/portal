import { Resource } from './types';

export const MONTHS = ["Jan '24", "Feb '24", "Mar '24", "Apr '24", "May '24", "Jun '24", "Jul '24", "Aug '24", "Sep '24"];

export const MOCK_PROJECTS: Resource[] = [
  {
    id: 'f1',
    name: 'Dealfolder: Strategic Accounts',
    subtext: '12 Projects',
    type: 'project',
    allocations: {},
    isExpanded: true,
    children: [
      {
        id: 'p1',
        name: 'Cloud Migration',
        subtext: 'Strategic Accounts • Cloud Lift',
        type: 'project',
        initials: 'CM',
        status: 'Active',
        isExpanded: true,
        allocations: {
          "Jan '24": { hours: 120, total: 160, status: 'optimal' },
          "Feb '24": { hours: 120, total: 160, status: 'optimal' },
          "Mar '24": { hours: 160, total: 160, status: 'optimal' },
          "Apr '24": { hours: 160, total: 160, status: 'optimal' },
          "May '24": { hours: 80, total: 160, status: 'under' },
          "Jun '24": { hours: 80, total: 160, status: 'under' },
        },
        assignments: [
            {
                id: 'e1',
                name: 'Sarah Jenkins',
                subtext: 'Senior Dev',
                type: 'employee',
                avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
                department: 'Engineering',
                allocations: {
                    "Jan '24": { hours: 80, total: 160, status: 'optimal' },
                    "Feb '24": { hours: 80, total: 160, status: 'optimal' },
                    "Mar '24": { hours: 160, total: 160, status: 'optimal' },
                    "Apr '24": { hours: 160, total: 160, status: 'optimal' },
                    "May '24": { hours: 80, total: 160, status: 'optimal' },
                    "Jun '24": { hours: 80, total: 160, status: 'optimal' },
                }
            },
            {
                id: 'e2',
                name: 'Mike Ross',
                subtext: 'Architect',
                type: 'employee',
                avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
                department: 'Engineering',
                allocations: {
                    "Jan '24": { hours: 40, total: 160, status: 'optimal' },
                    "Feb '24": { hours: 40, total: 160, status: 'optimal' },
                    "Mar '24": { hours: 0, total: 160, status: 'empty' },
                    "Apr '24": { hours: 0, total: 160, status: 'empty' },
                    "May '24": { hours: 0, total: 160, status: 'empty' },
                    "Jun '24": { hours: 0, total: 160, status: 'empty' },
                }
            }
        ]
      },
      {
        id: 'p2',
        name: 'Android App V2',
        subtext: 'Mobile Revamp • Active',
        type: 'project',
        initials: 'AA',
        status: 'Active',
        allocations: {
          "Jan '24": { hours: 160, total: 160, status: 'optimal' },
          "Feb '24": { hours: 160, total: 160, status: 'optimal' },
          "Mar '24": { hours: 160, total: 160, status: 'optimal' },
          "Apr '24": { hours: 160, total: 160, status: 'optimal' },
          "May '24": { hours: 160, total: 160, status: 'optimal' },
          "Jun '24": { hours: 160, total: 160, status: 'optimal' },
        }
      },
      {
        id: 'p3',
        name: 'Maps API Integration',
        subtext: 'Tech Stack • Critical',
        type: 'project',
        initials: 'MA',
        status: 'At Risk',
        allocations: {
          "Jan '24": { hours: 160, total: 160, status: 'optimal' },
          "Feb '24": { hours: 160, total: 160, status: 'optimal' },
          "Mar '24": { hours: 160, total: 160, status: 'optimal' },
          "Apr '24": { hours: 160, total: 160, status: 'optimal' },
          "May '24": { hours: 160, total: 160, status: 'optimal' },
          "Jun '24": { hours: 100, total: 160, status: 'under' },
        }
      }
    ]
  },
  {
    id: 'f2',
    name: 'Dealfolder: Emerging Mkts',
    subtext: '8 Projects',
    type: 'project',
    allocations: {},
    isExpanded: false,
    children: [
        {
            id: 'p4',
            name: 'Storefront Redesign',
            subtext: 'Holiday Prep • Planned',
            type: 'project',
            initials: 'SR',
            status: 'Planning',
            allocations: {
              "Jan '24": { hours: 160, total: 160, status: 'optimal' },
              "Feb '24": { hours: 160, total: 160, status: 'optimal' },
              "Mar '24": { hours: 160, total: 160, status: 'optimal' },
              "Apr '24": { hours: 160, total: 160, status: 'optimal' },
              "May '24": { hours: 100, total: 160, status: 'under' },
              "Jun '24": { hours: 100, total: 160, status: 'under' },
            }
          }
    ]
  }
];

export const MOCK_PEOPLE: Resource[] = [
  {
    id: 'g1',
    name: 'Engineering',
    subtext: '12 Members',
    type: 'group',
    isExpanded: true,
    allocations: {}, // Group level allocations can be aggregates
    children: [
        {
            id: 'e1',
            name: 'Jane Doe',
            subtext: 'Senior Dev • London',
            type: 'employee',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
            status: 'Active',
            manager: 'Alice Wong',
            department: 'Engineering',
            skills: ['React', 'Node.js', 'TypeScript'],
            isExpanded: true,
            allocations: {
                "Jan '24": { hours: 120, total: 160, status: 'optimal' },
                "Feb '24": { hours: 120, total: 160, status: 'optimal' },
                "Mar '24": { hours: 160, total: 160, status: 'optimal' },
                "Apr '24": { hours: 160, total: 160, status: 'optimal' },
                "May '24": { hours: 80, total: 160, status: 'under' },
                "Jun '24": { hours: 80, total: 160, status: 'under' },
                "Jul '24": { hours: 40, total: 160, status: 'under' },
                "Aug '24": { hours: 0, total: 160, status: 'empty' },
                "Sep '24": { hours: 0, total: 160, status: 'empty' },
            },
            children: [
                {
                    id: 'p1_e1',
                    name: 'Alpha: Platform Revamp',
                    subtext: '',
                    type: 'project',
                    color: 'bg-blue-500',
                    allocations: {
                        "Jan '24": { hours: 80, total: 0, status: 'optimal' },
                        "Feb '24": { hours: 80, total: 0, status: 'optimal' },
                        "Mar '24": { hours: 80, total: 0, status: 'optimal' },
                        "Apr '24": { hours: 80, total: 0, status: 'optimal' },
                        "May '24": { hours: 40, total: 0, status: 'optimal' },
                        "Jun '24": { hours: 40, total: 0, status: 'optimal' },
                    }
                },
                {
                    id: 'p2_e1',
                    name: 'Beta: Mobile API',
                    subtext: '',
                    type: 'project',
                    color: 'bg-orange-500',
                    allocations: {
                        "Jan '24": { hours: 40, total: 0, status: 'optimal' },
                        "Feb '24": { hours: 40, total: 0, status: 'optimal' },
                        "Mar '24": { hours: 80, total: 0, status: 'optimal' },
                        "Apr '24": { hours: 80, total: 0, status: 'optimal' },
                        "May '24": { hours: 40, total: 0, status: 'optimal' },
                        "Jun '24": { hours: 40, total: 0, status: 'optimal' },
                        "Jul '24": { hours: 40, total: 0, status: 'optimal' },
                    }
                }
            ]
        },
        {
            id: 'e2',
            name: 'John Smith',
            subtext: 'Tech Lead • Remote',
            type: 'employee',
            initials: 'JS',
            status: 'Active',
            manager: 'David Kim',
            department: 'Engineering',
            skills: ['Java', 'Spring', 'Architecture'],
            isExpanded: false,
            allocations: {
                "Jan '24": { hours: 160, total: 160, status: 'optimal' },
                "Feb '24": { hours: 160, total: 160, status: 'optimal' },
                "Mar '24": { hours: 160, total: 160, status: 'optimal' },
                "Apr '24": { hours: 160, total: 160, status: 'optimal' },
                "May '24": { hours: 160, total: 160, status: 'optimal' },
                "Jun '24": { hours: 160, total: 160, status: 'optimal' },
                "Jul '24": { hours: 160, total: 160, status: 'optimal' },
                "Aug '24": { hours: 160, total: 160, status: 'optimal' },
                "Sep '24": { hours: 160, total: 160, status: 'optimal' },
            },
            children: []
        },
        {
            id: 'e3',
            name: 'Alice Wong',
            subtext: 'UX Designer • NY',
            type: 'employee',
            avatar: 'https://i.pravatar.cc/150?u=a04258a2462d826712d',
            status: 'Active',
            manager: 'Sarah Jenkins',
            department: 'Design',
            skills: ['Figma', 'UI/UX', 'Prototyping'],
            isExpanded: false,
            allocations: {
                "Jan '24": { hours: 80, total: 160, status: 'under' },
                "Feb '24": { hours: 40, total: 160, status: 'under' },
                "Mar '24": { hours: 0, total: 160, status: 'empty' },
                "Apr '24": { hours: 0, total: 160, status: 'empty' },
                "May '24": { hours: 0, total: 160, status: 'empty' },
                "Jun '24": { hours: 0, total: 160, status: 'empty' },
                "Jul '24": { hours: 0, total: 160, status: 'empty' },
                "Aug '24": { hours: 0, total: 160, status: 'empty' },
                "Sep '24": { hours: 0, total: 160, status: 'empty' },
            },
            children: []
        },
        {
            id: 'e4',
            name: 'Bob Miller',
            subtext: 'Product Mgr • SF',
            type: 'employee',
            initials: 'BM',
            status: 'Active',
            manager: 'Mike Ross',
            department: 'Product',
            skills: ['Strategy', 'Roadmapping', 'Agile'],
            isExpanded: false,
            allocations: {
                "Jan '24": { hours: 160, total: 160, status: 'optimal' },
                "Feb '24": { hours: 160, total: 160, status: 'optimal' },
                "Mar '24": { hours: 160, total: 160, status: 'optimal' },
                "Apr '24": { hours: 160, total: 160, status: 'optimal' },
                "May '24": { hours: 160, total: 160, status: 'optimal' },
                "Jun '24": { hours: 100, total: 160, status: 'under' },
                "Jul '24": { hours: 40, total: 160, status: 'under' },
                "Aug '24": { hours: 0, total: 160, status: 'empty' },
                "Sep '24": { hours: 0, total: 160, status: 'empty' },
            },
            children: []
        }
    ]
  },
  {
    id: 'g2',
    name: 'Design',
    subtext: '8 Members',
    type: 'group',
    isExpanded: false,
    allocations: {},
    children: [
        {
            id: 'e5',
            name: 'Sarah Jenkins',
            subtext: 'Senior UI • Remote',
            type: 'employee',
            avatar: 'https://i.pravatar.cc/150?u=a042581f4e29026024e',
            status: 'Active',
            manager: 'Alice Wong',
            department: 'Design',
            skills: ['Figma', 'Visual Design', 'CSS'],
            isExpanded: false,
            allocations: {
                "Jan '24": { hours: 160, total: 160, status: 'optimal' },
                "Feb '24": { hours: 160, total: 160, status: 'optimal' },
                "Mar '24": { hours: 160, total: 160, status: 'optimal' },
                "Apr '24": { hours: 160, total: 160, status: 'optimal' },
                "May '24": { hours: 100, total: 160, status: 'under' },
                "Jun '24": { hours: 100, total: 160, status: 'under' },
                "Jul '24": { hours: 40, total: 160, status: 'under' },
                "Aug '24": { hours: 0, total: 160, status: 'empty' },
                "Sep '24": { hours: 0, total: 160, status: 'empty' },
            },
            children: []
        }
    ]
  }
];