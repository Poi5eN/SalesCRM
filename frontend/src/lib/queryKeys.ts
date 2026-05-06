export const queryKeys = {
  auth: {
    user: ['auth', 'user'],
  },
  tenants: {
    all: ['tenants'],
    detail: (id: string) => ['tenants', id],
  },
  leads: {
    all: ['leads'],
    list: (params: any) => ['leads', 'list', params],
    board: ['leads', 'board'],
    detail: (id: string) => ['leads', 'detail', id],
    count: ['leads', 'count'],
  },
  deals: {
    all: ['deals'],
    list: (params: any) => ['deals', 'list', params],
    board: ['deals', 'board'],
    detail: (id: string) => ['deals', 'detail', id],
    count: ['deals', 'count'],
  },
  contacts: {
    all: ['contacts'],
    list: (params: any) => ['contacts', 'list', params],
    detail: (id: string) => ['contacts', 'detail', id],
  },
  companies: {
    all: ['companies'],
    list: (params: any) => ['companies', 'list', params],
    detail: (id: string) => ['companies', 'detail', id],
  },
  tasks: {
    all: ['tasks'],
    list: (params: any) => ['tasks', 'list', params],
    overdue: ['tasks', 'overdue'],
    upcoming: ['tasks', 'upcoming'],
    count: ['tasks', 'count'],
    overdueCount: ['tasks', 'overdue-count'],
  },
  communications: {
    all: ['communications'],
    list: (params: any) => ['communications', 'list', params],
  },
  products: {
    all: ['products'],
    list: (params: any) => ['products', 'list', params],
  },
  proposals: {
    all: ['proposals'],
    list: (params: any) => ['proposals', 'list', params],
    detail: (id: string) => ['proposals', 'detail', id],
  },
  dashboard: {
    summary: ['dashboard', 'summary'],
    staleDeals: ['dashboard', 'stale-deals'],
    upcomingTasks: ['dashboard', 'upcoming-tasks'],
  },
  analytics: {
    summary: (period: string) => ['analytics', 'summary', period],
    heatmap: ['analytics', 'heatmap'],
  },
  settings: {
    stages: ['settings', 'stages'],
    team: ['settings', 'team'],
    roles: ['settings', 'roles'],
  }
};
