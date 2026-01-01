import { Resource } from '../types';

// Recursively find a resource node by ID
export const findResource = (nodes: Resource[], id: string): Resource | null => {
    for (const node of nodes) {
        if (node.id === id) return node;
        if (node.children) {
            const found = findResource(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

// Find parent ID for a given child ID (handling composite IDs)
export const findParentId = (nodes: Resource[], targetId: string): string | undefined => {
    for (const node of nodes) {
        if (node.children) {
            if (node.children.some(c => c.id === targetId || c.id.startsWith(targetId + '::'))) return node.id;
            const res = findParentId(node.children, targetId);
            if (res) return res;
        }
    }
    return undefined;
};

export const getCleanId = (id: string) => id.split('::')[0];

// Update a resource tree by finding a parent and adding/updating a child assignment
export const updateResourceTree = (
    data: Resource[], 
    parentId: string, 
    childEntityId: string, 
    month: string, 
    pt: number, 
    childTemplate: Resource | any
): Resource[] => {
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone
    
    const parent = findResource(newData, parentId);
    if (parent) {
        if (!parent.children) parent.children = [];
        
        let child = parent.children.find((c: Resource) => 
            c.id === childEntityId || c.id.startsWith(`${childEntityId}::`)
        );
        
        if (child) {
             if (!child.allocations[month]) child.allocations[month] = { pt: 0, capacity: 20, status: 'optimal' };
             child.allocations[month].pt = pt;
        } else {
            const newId = `${childEntityId}::${parentId}`;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { children, allocations, ...safeTemplate } = childTemplate;
            
            parent.children.push({
                ...safeTemplate,
                id: newId,
                allocations: { [month]: { pt, capacity: 20, status: 'optimal' } },
                children: [] 
            });
        }
    }
    return newData;
};

// Update Capacity for a node
export const updateNodeCapacity = (data: Resource[], resourceId: string, month: string, capacity: number): Resource[] => {
    const newData = JSON.parse(JSON.stringify(data));
    const node = findResource(newData, resourceId);
    if (node) {
        if (!node.allocations[month]) {
            node.allocations[month] = { pt: 0, capacity: 20, status: 'optimal' };
        }
        node.allocations[month].capacity = capacity;
    }
    return newData;
};

// Remove an allocation for specific months from tree
export const removeAllocationForMonths = (data: Resource[], parentId: string, childEntityId: string, monthsToRemove: string[]): Resource[] => {
    const newData = JSON.parse(JSON.stringify(data));
    const parent = findResource(newData, parentId);
    if (parent && parent.children) {
        const idx = parent.children.findIndex((c: Resource) => 
            c.id === childEntityId || c.id.startsWith(`${childEntityId}::`)
        );
        if (idx !== -1) {
            const child = parent.children[idx];
            
            monthsToRemove.forEach(m => {
                if (child.allocations[m]) {
                    delete child.allocations[m];
                }
            });

            const hasAllocations = Object.keys(child.allocations).length > 0;
            
            if (!hasAllocations) {
                parent.children.splice(idx, 1);
            }
        }
    }
    return newData;
};