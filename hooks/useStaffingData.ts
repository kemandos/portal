import { useState, useCallback } from 'react';
import { Resource } from '../types';
import { MOCK_PEOPLE, MOCK_PROJECTS } from '../constants';
import { 
    updateResourceTree, 
    updateNodeCapacity, 
    removeAllocationForMonths, 
    findResource, 
    findParentId, 
    getCleanId 
} from '../utils/resourceHelpers';

interface SaveAssignmentPayload {
    mode: 'edit' | 'add';
    resourceId: string;
    parentId?: string;
    month: string;
    months?: string[];
    pt: number;
    newItem?: { id: string, name: string, type: 'project' | 'employee' | 'group', subtext: string };
    isCapacityEdit?: boolean;
    role?: string;
}

export const useStaffingData = (viewMode: 'People' | 'Projects') => {
    const [peopleData, setPeopleData] = useState<Resource[]>(MOCK_PEOPLE);
    const [projectData, setProjectData] = useState<Resource[]>(MOCK_PROJECTS);

    const handleSaveAssignment = useCallback((data: SaveAssignmentPayload) => {
        const targetMonths = (data.months && data.months.length > 0) ? data.months : [data.month];

        targetMonths.forEach(m => {
            // Handle Capacity Edit for Projects
            if (data.isCapacityEdit && viewMode === 'Projects') {
                setProjectData(prev => updateNodeCapacity(prev, data.resourceId, m, data.pt));
                return;
            }

            let personId = '';
            let projectId = '';
            
            if (viewMode === 'People') {
                if (data.mode === 'add') {
                    personId = data.resourceId;
                    projectId = data.newItem!.id;
                } else {
                    personId = data.parentId!; 
                    projectId = getCleanId(data.resourceId);
                }
            } else {
                if (data.mode === 'add') {
                    projectId = data.resourceId;
                    personId = data.newItem!.id;
                } else {
                    projectId = data.parentId!;
                    personId = getCleanId(data.resourceId);
                }
            }

            const personObj = findResource(peopleData, personId) || (data.newItem && data.newItem.type === 'employee' ? data.newItem : null);
            const projectObj = findResource(projectData, projectId) || (data.newItem && data.newItem.type === 'project' ? data.newItem : null);

            if (personObj && projectObj) {
                // Determine Role
                // If provided in payload, use it. Otherwise fall back to existing.
                const roleToUse = data.role;

                // Create templates for updating both trees.
                // In Project View: Child is Employee. Child needs 'role'.
                // In People View: Child is Project. Child *also* needs 'role' to persist the selection if we edit later.
                
                const personTemplateForProjectView = {
                    ...personObj,
                    role: roleToUse,
                    subtext: roleToUse || personObj.subtext
                };

                const projectTemplateForPeopleView = {
                    ...projectObj,
                    role: roleToUse, // Store role on the assignment (project node under person)
                    // We typically don't change the project subtext to the role, but we can store it in 'role' property
                };
                
                // Update People View Data (Person -> Project)
                setPeopleData(prev => updateResourceTree(prev, personId, projectId, m, data.pt, projectTemplateForPeopleView));
                
                // Update Project View Data (Project -> Person)
                setProjectData(prev => updateResourceTree(prev, projectId, personId, m, data.pt, personTemplateForProjectView));
            }
        });
    }, [viewMode, peopleData, projectData]);

    const handleInlineSave = useCallback((resourceId: string, month: string, value: number, isCapacity: boolean) => {
       const cleanResourceId = getCleanId(resourceId);
       const dataSource = viewMode === 'Projects' ? projectData : peopleData;
       const parentId = findParentId(dataSource, resourceId);

       // Root Level Item -> Edit Capacity/Budget
       if (!parentId) {
           if (viewMode === 'Projects') {
                setProjectData(prev => updateNodeCapacity(prev, resourceId, month, value));
           } else {
               setPeopleData(prev => updateNodeCapacity(prev, resourceId, month, value));
           }
           return;
       }

       // Child Item -> Edit Assignment
       let personId = '';
       let projectId = '';
       
       if (viewMode === 'Projects') {
           projectId = parentId;
           personId = cleanResourceId;
       } else {
           personId = parentId;
           projectId = cleanResourceId;
       }
       
       setPeopleData(prev => updateResourceTree(prev, personId, projectId, month, value, {}));
       setProjectData(prev => updateResourceTree(prev, projectId, personId, month, value, {}));
    }, [viewMode, peopleData, projectData]);

    const handleDeleteAssignment = useCallback((resourceId: string, parentId?: string, month?: string, months?: string[]) => {
        if (!parentId) return;

        const targetMonths = (months && months.length > 0) ? months : (month ? [month] : []);
        
        let personId = '';
        let projectId = '';

        if (viewMode === 'People') {
            personId = parentId;
            projectId = getCleanId(resourceId);
        } else {
            projectId = parentId;
            personId = getCleanId(resourceId);
        }

        setPeopleData(prev => removeAllocationForMonths(prev, personId, projectId, targetMonths));
        setProjectData(prev => removeAllocationForMonths(prev, projectId, personId, targetMonths));
    }, [viewMode]);

    return {
        peopleData,
        projectData,
        setPeopleData,
        setProjectData,
        handleSaveAssignment,
        handleDeleteAssignment,
        handleInlineSave
    };
};